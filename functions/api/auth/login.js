function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 입력 검증
    if (!username?.trim() || !password) {
      return json({ success: false, message: "아이디와 비밀번호를 입력하세요." }, 400);
    }

    // 사용자 조회
    const user = await env.D1_DB.prepare(
      "SELECT user_id, username, email, password FROM users WHERE username = ?"
    ).bind(username).first();

    if (!user) {
      return json({ success: false, message: "아이디 또는 비밀번호가 잘못되었습니다." }, 401);
    }

    // 비밀번호 확인 (실제로는 해시 비교해야 함)
    if (user.password !== password) {
      return json({ success: false, message: "아이디 또는 비밀번호가 잘못되었습니다." }, 401);
    }

    // 성공 - 비밀번호 제외하고 반환
    return json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return json({ success: false, message: "서버 오류가 발생했습니다." }, 500);
  }
}
