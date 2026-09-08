function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

const SESSION_COOKIE = "doit_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function bytesToB64Url(bytes) {
  return bytesToB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createSessionToken(secret, userId, maxAgeSec) {
  const enc = new TextEncoder();
  const payload = `${userId}.${Date.now() + maxAgeSec * 1000}`;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${bytesToB64Url(new Uint8Array(sig))}`;
}

let cachedSessionSecret = null;

export async function getSessionSecret(env) {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (cachedSessionSecret) return cachedSessionSecret;

  await env.D1_DB.prepare(
    `CREATE TABLE IF NOT EXISTS app_secret (name TEXT PRIMARY KEY, value TEXT NOT NULL)`
  ).run();

  const generated = bytesToB64(crypto.getRandomValues(new Uint8Array(32)));
  await env.D1_DB.prepare(
    `INSERT OR IGNORE INTO app_secret (name, value) VALUES ('session', ?)`
  )
    .bind(generated)
    .run();

  const row = await env.D1_DB.prepare(
    `SELECT value FROM app_secret WHERE name = 'session' LIMIT 1`
  ).first();

  cachedSessionSecret = row?.value || generated;
  return cachedSessionSecret;
}

function sessionCookie(token, keepLogin) {
  const base = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  return keepLogin ? `${base}; Max-Age=${SESSION_MAX_AGE}` : base;
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

// timing-safe 비교(길이 같을 때 XOR)
function safeEqual(aB64, bB64) {
  if (aB64.length !== bB64.length) return false;
  let diff = 0;
  for (let i = 0; i < aB64.length; i++) diff |= aB64.charCodeAt(i) ^ bB64.charCodeAt(i);
  return diff === 0;
}

async function verifyPassword(plain, stored) {
  // stored: "pbkdf2$iterations$saltB64$hashB64"
  if (typeof stored !== "string") return false;

  const parts = stored.split("$");
  if (parts.length !== 4) return false;

  const [scheme, iterStr, saltB64, hashB64] = parts;
  if (scheme !== "pbkdf2") return false;

  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 1000) return false;

  const salt = b64ToBytes(saltB64);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(plain),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );

  const computed = new Uint8Array(bits);
  const computedB64 = bytesToB64(computed);

  return safeEqual(computedB64, hashB64);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestDelete({ request }) {
  const headers = corsHeaders(request);
  return json({ message: "로그아웃 되었습니다." }, 200, {
    ...headers,
    "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const headers = corsHeaders(request);

    const body = await request.json().catch(() => null);
    if (!body) return json({ message: "JSON body가 필요합니다." }, 400, headers);

    const keepLogin = body.keepLogin === true;
    const login_id = String(body.login_id || "").trim();
    const password = String(body.password || "");

    if (!login_id) return json({ message: "아이디를 입력해주세요." }, 400, headers);
    if (!password) return json({ message: "비밀번호를 입력해주세요." }, 400, headers);

    // ✅ 유저 조회
    const user = await env.D1_DB.prepare(
      `SELECT user_id, login_id, email, password, nickname, profile_image, role, banned_until
   FROM "user"
   WHERE login_id = ?
   LIMIT 1`
    )
      .bind(login_id)
      .first();

    // ❗ 아이디 존재 체크 먼저 (없으면 바로 에러)
    if (!user) {
      return json({ message: "아이디가 올바르지 않습니다." }, 401, headers);
    }

    // ✅ 차단 체크 (← 네가 붙인 코드 위치 여기!)
    if (user?.banned_until) {
      const until = new Date(String(user.banned_until).replace(" ", "T") + "Z");
      const now = new Date();

      if (!Number.isNaN(until.getTime()) && until > now) {
        return json(
          {
            message: `차단된 계정입니다. (${until.toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            })} 까지)`,
            code: "BANNED",
            banned_until: user.banned_until,
          },
          403,
          headers
        );
      }
    }


    // 아이디가 없거나 비번이 틀리면 같은 메시지(보안상)
    if (!user) {
      return json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401, headers);
    }

    // ✅ 비밀번호 검증
    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401, headers);
    }

    // ✅ 성공: 비밀번호는 절대 내려주지 않기
    const secret = await getSessionSecret(env);
    const token = await createSessionToken(secret, user.user_id, SESSION_MAX_AGE);

    return json(
      {
        message: "로그인 성공",
        user: {
          user_id: user.user_id,
          login_id: user.login_id,
          email: user.email,
          nickname: user.nickname,
          profile_image: user.profile_image,
          role: user.role,
        },
      },
      200,
      { ...headers, "Set-Cookie": sessionCookie(token, keepLogin) }
    );
  } catch (e) {
    console.error("login error:", e);
    return json({ message: "서버 오류" }, 500);
  }
}
