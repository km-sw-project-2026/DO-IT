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

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env }) {
  try {
    const headers = corsHeaders(request);
    const body = await request.json();

    const login_id = String(body.login_id || "").trim();

    // ✅ 기본 검증
    if (!login_id || login_id.length < 4) {
      return json(
        { message: "아이디는 4자 이상이어야 합니다." },
        400,
        headers
      );
    }

    // ✅ DB 중복 체크
    const exists = await env.D1_DB.prepare(
      `SELECT user_id FROM user WHERE login_id = ? LIMIT 1`
    )
      .bind(login_id)
      .first();

    if (exists) {
      return json(
        {
          available: false,
          message: "이미 사용 중인 아이디입니다.",
        },
        200,
        headers
      );
    }

    // ✅ 사용 가능
    return json(
      {
        available: true,
        message: "사용 가능한 아이디입니다.",
      },
      200,
      headers
    );
  } catch (e) {
    console.error(e);
    return json({ message: "서버 오류" }, 500);
  }
}
