function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ env, url }) {
  url = new URL(url);

  const page = Math.max(1, Number(url.searchParams.get("page") || 1));

  // ✅ 요구사항: 공지는 따로, 일반글만 페이징
  // ✅ 1페이지는 일반글 8개, 2페이지부터 10개
  const FIRST_LIMIT = 8;
  const NEXT_LIMIT = 10;

  const limit = page === 1 ? FIRST_LIMIT : NEXT_LIMIT;
  const offset = page === 1 ? 0 : FIRST_LIMIT + (page - 2) * NEXT_LIMIT;

  // =========================
  // ✅ 공지글(상단고정) 목록: 페이지랑 무관하게 항상 내려줌
  // =========================
  const noticeRes = await env.D1_DB.prepare(`
    SELECT
      p.post_id,
      p.title,
      p.content,
      p.view_count,
      p.created_at,
      p.user_id,
      p.is_notice,

      -- ✅ 작성자 정보
      u.nickname AS author_nickname,
      u.profile_image AS author_profile_image,

      -- ✅ 댓글 수
      (
        SELECT COUNT(*)
        FROM community_comment c
        WHERE c.post_id = p.post_id
          AND c.deleted_at IS NULL
      ) AS comment_count

    FROM community_post p
    JOIN "user" u ON u.user_id = p.user_id
    WHERE p.deleted_at IS NULL
      AND p.is_notice = 1
    ORDER BY
      p.pinned_at DESC,
      p.post_id DESC
  `).all();

  const notice_posts = noticeRes?.results ?? [];

  // =========================
  // ✅ 일반글 total (공지 제외)
  // =========================
  const totalRow = await env.D1_DB.prepare(`
    SELECT COUNT(*) AS total
    FROM community_post
    WHERE deleted_at IS NULL
      AND (is_notice IS NULL OR is_notice = 0)
  `).first();

  const total = Number(totalRow?.total || 0);

  // ✅ total_pages 계산 (1페이지 8개, 이후 10개)
  let total_pages = 1;
  if (total <= FIRST_LIMIT) {
    total_pages = 1;
  } else {
    total_pages = 1 + Math.ceil((total - FIRST_LIMIT) / NEXT_LIMIT);
  }

  // =========================
  // ✅ 일반글 목록 (공지 제외) + 너가 쓰던 정보/정렬 유지
  // =========================
  const { results } = await env.D1_DB.prepare(`
    SELECT
      p.post_id,
      p.title,
      p.content,
      p.view_count,
      p.created_at,
      p.user_id,
      p.is_notice,

      -- ✅ 작성자 정보
      u.nickname AS author_nickname,
      u.profile_image AS author_profile_image,

      -- ✅ 댓글 수
      (
        SELECT COUNT(*)
        FROM community_comment c
        WHERE c.post_id = p.post_id
          AND c.deleted_at IS NULL
      ) AS comment_count

    FROM community_post p
    JOIN "user" u ON u.user_id = p.user_id
    WHERE p.deleted_at IS NULL
      AND (p.is_notice IS NULL OR p.is_notice = 0)

    ORDER BY
      p.pinned_at DESC,
      p.post_id DESC

    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return json({
    page,
    limit,
    total,        // ✅ 일반글 total (공지 제외)
    total_pages,  // ✅ 일반글 기준 페이지 수
    notice_posts, // ✅ 공지 따로
    posts: results,
  });
}

export async function onRequestPost({ request, env }) {
  const { title, content, user_id } = await request.json();
  if (!title || title.length > 20) {
    return json({ message: "제목은 20자 이내로 입력해주세요." }, 400);
  }

  if (!content || content.length > 500) {
    return json({ message: "내용은 500자 이내로 입력해주세요." }, 400);
  }
  const result = await env.D1_DB.prepare(`
    INSERT INTO community_post(title, content, user_id)
    VALUES (?, ?, ?)
  `).bind(title, content, user_id).run();

  return json({ ok: true, result });
}
