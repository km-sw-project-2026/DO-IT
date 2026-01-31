function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);

  // ✅ 이 파일은 "정확히" /api/post (또는 /api/post/) 만 처리
  if (url.pathname !== "/api/post" && url.pathname !== "/api/post/") {
    return json({ message: "not found" }, 404);
  }

  const { results } = await env.D1_DB.prepare(`
    SELECT post_id, title, content, view_count, created_at, user_id
    FROM community_post
    WHERE deleted_at IS NULL
    ORDER BY post_id DESC
    LIMIT 50
  `).all();

  // 기존이 배열만 반환하던 형태 유지
  return json(results || []);
}
