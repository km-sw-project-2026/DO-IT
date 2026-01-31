function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ env, request }) {
  const body = await request.json();

  const login_id = body?.login_id?.trim();
  const password = body?.password?.trim();

  if (!login_id || !password) {
    return json({ message: "아이디/비밀번호를 입력해주세요." }, 400);
  }

  // ✅ 아이디로 유저 찾기
  const user = await env.D1_DB.prepare(
    `SELECT user_id, login_id, email, password, nickname, role
     FROM user
     WHERE login_id = ?`
  ).bind(login_id).first();

  if (!user) {
    return json({ message: "아이디 또는 비밀번호가 틀렸습니다." }, 401);
  }

  // ✅ 비밀번호 확인 (지금은 평문 비교)
  if (user.password !== password) {
    return json({ message: "아이디 또는 비밀번호가 틀렸습니다." }, 401);
  }

  // ✅ 로그인 성공: 비밀번호는 절대 프론트로 보내지 않기
  return json({
    ok: true,
    user: {
      user_id: user.user_id,
      login_id: user.login_id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    },
  });
}
