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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
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

export async function onRequestPost({ request, env }) {
  try {
    const headers = corsHeaders(request);

    const body = await request.json().catch(() => null);
    if (!body) return json({ message: "JSON body가 필요합니다." }, 400, headers);

    const login_id = String(body.login_id || "").trim();
    const password = String(body.password || "");

    if (!login_id) return json({ message: "아이디를 입력해주세요." }, 400, headers);
    if (!password) return json({ message: "비밀번호를 입력해주세요." }, 400, headers);

    // ✅ 유저 조회
    const user = await env.D1_DB.prepare(
      `SELECT user_id, login_id, email, password, nickname, profile_image, role
       FROM user
       WHERE login_id = ?
       LIMIT 1`
    )
      .bind(login_id)
      .first();

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
      headers
    );
  } catch (e) {
    console.error("login error:", e);
    return json({ message: "서버 오류" }, 500);
  }
}
