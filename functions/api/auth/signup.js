function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { username, nickname, password, email } = body;

    // 입력 검증
    if (!username?.trim() || !password || !email?.trim()) {
      return json({ success: false, message: "필수 항목을 입력하세요." }, 400);
    }

    if (password.length < 4) {
      return json({ success: false, message: "비밀번호는 4자 이상이어야 합니다." }, 400);
    }

    // 아이디 중복 체크
    const existing = await env.D1_DB.prepare(
      "SELECT user_id FROM users WHERE username = ?"
    ).bind(username).first();

    if (existing) {
      return json({ success: false, message: "이미 존재하는 아이디입니다." }, 409);
    }

    // 이메일 중복 체크
    const emailExists = await env.D1_DB.prepare(
      "SELECT user_id FROM users WHERE email = ?"
    ).bind(email).first();

    if (emailExists) {
      return json({ success: false, message: "이미 사용 중인 이메일입니다." }, 409);
    }

    // 사용자 생성 (비밀번호는 실제로는 해시해야 하지만, 간단히 구현)
    const result = await env.D1_DB.prepare(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
    ).bind(username, email, password).run();

    const userId = result.meta.last_row_id;

    return json({
      success: true,
      user: {
        user_id: userId,
        username,
        email
      }
    }, 201);

  } catch (error) {
    console.error("Signup error:", error);
    return json({ success: false, message: "서버 오류가 발생했습니다." }, 500);
  }
}
