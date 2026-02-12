function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ env, request }) {
  try {
    const url = new URL(request.url);
    const userId = Number(url.searchParams.get("user_id"));
    if (!userId) return json({ message: "user_id가 필요합니다." }, 400);

    // 유저 존재 확인(추천)
    const userRow = await env.D1_DB
      .prepare("SELECT user_id, nickname FROM user WHERE user_id = ?")
      .bind(userId)
      .first();
    if (!userRow) return json({ message: "유저를 찾을 수 없습니다." }, 404);

    // ✅ mentor 테이블 존재 여부로 멘토 권한 판별
    const mentorRow = await env.D1_DB
      .prepare("SELECT mentor_id FROM mentor WHERE user_id = ?")
      .bind(userId)
      .first();

    const isMentor = !!mentorRow;

    return json({
      user_id: userRow.user_id,
      nickname: userRow.nickname,
      isMentor,
      canToggle: isMentor,   // 멘토면 토글 가능
      defaultMode: "MENTEE", // 기본은 멘티
    });
  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500);
  }
}