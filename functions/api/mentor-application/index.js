function json(data, status = 200, request) {
  const origin = request?.headers?.get("Origin") || "*";
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestOptions({ request }) {
  const origin = request?.headers?.get("Origin") || "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * POST /api/mentor-application
 * body: { user_id, contact, contractor_name, affiliation, introduction, hope_field, related_url? }
 */
export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user_id, contact, contractor_name, affiliation, introduction, hope_field, related_url } = body;

    // 필수값 검증
    if (!user_id)         return json({ message: "로그인이 필요합니다." }, 401, request);
    if (!contact?.trim()) return json({ message: "연락받을 수단을 입력해주세요." }, 400, request);
    if (!contractor_name?.trim()) return json({ message: "계약자명을 입력해주세요." }, 400, request);
    if (!affiliation?.trim()) return json({ message: "소속을 입력해주세요." }, 400, request);
    if (!introduction?.trim()) return json({ message: "자기소개를 입력해주세요." }, 400, request);
    if (!hope_field?.trim()) return json({ message: "희망분야를 입력해주세요." }, 400, request);

    // 유저 존재 확인
    const userRow = await env.D1_DB
      .prepare("SELECT user_id FROM user WHERE user_id = ?")
      .bind(Number(user_id))
      .first();
    if (!userRow) return json({ message: "존재하지 않는 유저입니다." }, 404, request);

    // 이미 PENDING 신청이 있는지 확인
    const existing = await env.D1_DB
      .prepare("SELECT mentor_apply_id, status FROM mentor_application WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
      .bind(Number(user_id))
      .first();

    if (existing?.status === "PENDING") {
      return json({ message: "이미 심사 중인 지원서가 있습니다. 결과를 기다려주세요." }, 409, request);
    }

    // 이미 멘토인지 확인
    const mentorRow = await env.D1_DB
      .prepare("SELECT mentor_id FROM mentor WHERE user_id = ?")
      .bind(Number(user_id))
      .first();
    if (mentorRow) {
      return json({ message: "이미 멘토 권한이 있습니다." }, 409, request);
    }

    // 저장
    const result = await env.D1_DB
      .prepare(`
        INSERT INTO mentor_application
          (contact, contractor_name, affiliation, introduction, hope_field, related_url, status, user_id)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `)
      .bind(
        contact.trim(),
        contractor_name.trim(),
        affiliation.trim(),
        introduction.trim(),
        hope_field.trim(),
        related_url?.trim() || null,
        Number(user_id),
      )
      .run();

    // 관리자들에게 알림 발송
    const admins = await env.D1_DB
      .prepare(`SELECT user_id FROM "user" WHERE role = 'ADMIN'`)
      .all();
    const applicantRow = await env.D1_DB
      .prepare(`SELECT nickname FROM "user" WHERE user_id = ? LIMIT 1`)
      .bind(Number(user_id))
      .first();
    const applicantName = applicantRow?.nickname || `user#${user_id}`;
    for (const admin of (admins.results ?? [])) {
      await env.D1_DB
        .prepare(`INSERT INTO notification (user_id, message, is_read) VALUES (?, ?, 0)`)
        .bind(admin.user_id, `${applicantName}님이 멘토 신청을 제출했습니다.`)
        .run();
    }

    return json({
      message: "멘토 지원이 완료되었습니다. 관리자 검토 후 결과를 알려드릴게요.",
      mentor_apply_id: result.meta?.last_row_id ?? null,
    }, 201, request);

  } catch (e) {
    return json({ message: e?.message || "서버 오류" }, 500, request);
  }
}
