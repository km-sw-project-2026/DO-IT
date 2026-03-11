function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestPost({ request, env }) {
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return json({ message: "multipart/form-data required" }, 400);
  }

  const form = await request.formData();
  const file = form.get("file");
  const post_id = Number(form.get("post_id"));
  const user_id = Number(form.get("user_id"));

  if (!file || typeof file === "string") return json({ message: "file required" }, 400);
  if (!post_id || !user_id) return json({ message: "post_id, user_id required" }, 400);
  if (file.size > MAX_BYTES) {
    return json({
      message: `파일 크기는 5MB 이하여야 합니다. (현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    }, 400);
  }

  // 파일 → base64 data URL 로 stored_key에 저장
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
  const base64 = btoa(binary);
  const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`;

  const result = await env.D1_DB
    .prepare(`
      INSERT INTO post_files (post_id, user_id, original_name, stored_key, mime_type, size)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(post_id, user_id, file.name, dataUrl, file.type || "", file.size)
    .run();

  return json({
    ok: true,
    file_id: result.meta?.last_row_id ?? null,
    original_name: file.name,
    mime_type: file.type,
    size: file.size,
  }, 201);
}
