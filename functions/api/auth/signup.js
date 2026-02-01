// functions/api/signup.js

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

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 120000;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );

  const hash = new Uint8Array(bits);

  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...hash));

  return `pbkdf2$${iterations}$${saltB64}$${hashB64}`;
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env }) {
  try {
    const headers = corsHeaders(request);
    const body = await request.json();

    const login_id = String(body.login_id || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const nickname = String(body.nickname || "").trim();
    const profile_image = body.profile_image ?? null;

    // ✅ 기본 검증
    if (!login_id || login_id.length < 4)
      return json({ message: "아이디는 4자 이상이어야 합니다." }, 400, headers);

    if (!nickname || nickname.length < 2)
      return json({ message: "닉네임은 2자 이상이어야 합니다." }, 400, headers);

    if (!isEmail(email))
      return json({ message: "이메일 형식이 올바르지 않습니다." }, 400, headers);

    if (!password || password.length < 6)
      return json({ message: "비밀번호는 6자 이상이어야 합니다." }, 400, headers);

    // ======================
    // ✅ 아이디 중복 체크
    // ======================
    const idDup = await env.D1_DB.prepare(
      `SELECT user_id FROM user WHERE login_id = ? LIMIT 1`
    )
      .bind(login_id)
      .first();

    if (idDup) {
      return json({ message: "이미 사용 중인 아이디입니다." }, 409, headers);
    }

    // ======================
    // ✅ 이메일 중복 체크
    // ======================
    const emailDup = await env.D1_DB.prepare(
      `SELECT user_id FROM user WHERE email = ? LIMIT 1`
    )
      .bind(email)
      .first();

    if (emailDup) {
      return json({ message: "이미 사용 중인 이메일입니다." }, 409, headers);
    }

    // ✅ 비밀번호 해시
    const hashed = await hashPassword(password);

    // ✅ 저장
    const result = await env.D1_DB.prepare(
      `INSERT INTO user (login_id, email, password, nickname, profile_image, role)
       VALUES (?, ?, ?, ?, ?, 'USER')`
    )
      .bind(login_id, email, hashed, nickname, profile_image)
      .run();

    return json(
      {
        message: "회원가입 성공",
        user_id: result.meta.last_row_id,
      },
      201,
      headers
    );
  } catch (e) {
    console.error(e);
    return json({ message: "서버 오류" }, 500);
  }
}
