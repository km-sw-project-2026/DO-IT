// functions/api/profile/index.js

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
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// GET /api/profile?user_id=123
export async function onRequestGet({ request, env, url }) {
  try {
    const headers = corsHeaders(request);
    const userId = url.searchParams.get("user_id");
    if (!userId) return json({ message: "user_id가 필요합니다." }, 400, headers);

    const row = await env.D1_DB.prepare(
      `SELECT u.user_id, u.login_id, u.nickname, u.profile_image, up.bio
       FROM "user" u
       LEFT JOIN user_profile up ON up.user_id = u.user_id
       WHERE u.user_id = ? LIMIT 1`
    )
      .bind(userId)
      .first();

    if (!row) return json({ message: "사용자를 찾을 수 없습니다." }, 404, headers);

    return json({ user: row }, 200, headers);
  } catch (e) {
    console.error(e);
    return json({ message: "서버 오류" }, 500);
  }
}

// PUT /api/profile  { user_id, nickname?, bio? }
export async function onRequestPut({ request, env }) {
  try {
    const headers = corsHeaders(request);
    const body = await request.json().catch(() => null);
    if (!body) return json({ message: "JSON body가 필요합니다." }, 400, headers);

    const userId = body.user_id;
    if (!userId) return json({ message: "user_id가 필요합니다." }, 400, headers);

    // 닉네임 업데이트(선택)
    if (typeof body.nickname === "string") {
      await env.D1_DB.prepare(
        `UPDATE "user" SET nickname = ?, updated_at = datetime('now') WHERE user_id = ?`
      )
        .bind(body.nickname, userId)
        .run();
    }

    // 프로필 바이오(upsert into user_profile)
    if (typeof body.bio === "string") {
      const exists = await env.D1_DB.prepare(
        `SELECT profile_id FROM user_profile WHERE user_id = ? LIMIT 1`
      )
        .bind(userId)
        .first();

      if (exists) {
        await env.D1_DB.prepare(
          `UPDATE user_profile SET bio = ?, updated_at = datetime('now') WHERE user_id = ?`
        )
          .bind(body.bio, userId)
          .run();
      } else {
        await env.D1_DB.prepare(
          `INSERT INTO user_profile (bio, user_id) VALUES (?, ?)`
        )
          .bind(body.bio, userId)
          .run();
      }
    }

    return json({ message: "프로필이 저장되었습니다." }, 200, headers);
  } catch (e) {
    console.error(e);
    return json({ message: "서버 오류" }, 500);
  }
}
