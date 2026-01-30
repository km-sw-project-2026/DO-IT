function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ env, request }) {
  const MAX = 2 * 1024 * 1024 * 1024; // 2GB

  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return json({ message: "multipart/form-data required" }, 400);
  }

  const form = await request.formData();
  const file = form.get("file");
  const user_id = Number(form.get("user_id") || 1);

  if (!file) return json({ message: "file required" }, 400);
  if (typeof file === "string") return json({ message: "invalid file" }, 400);

  if (file.size >= MAX) return json({ message: "file must be < 2GB" }, 400);

  // ⚠️ 여기서는 “일단 저장됐다”까지만 구현(최소버전)
  // 다음 단계에서 R2 저장 / DB(file table) 저장로 확장할거야.
  return json({
    ok: true,
    file: {
      origin_name: file.name,
      file_size: file.size,
      file_type: file.type,
    },
  });
}
