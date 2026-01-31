import * as posts from "../functions/api/posts";
import * as postById from "../functions/api/post/[[id]]";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/posts") {
      // /api/posts 경로로 요청이 들어오면 posts.onRequestGet 호출
      return posts.onRequestGet({url, env});
    } else if (url.pathname.startsWith("/api/post/")) {
      // /api/post/:id 경로로 요청이 들어오면 ID 추출하여 postById.onRequestGet 호출
      const id = url.pathname.replace(/^\/api\/post\/+/, '');
      const context = { params: { id } };
      return postById.onRequestGet({ env, params: context.params });
    }

    // 위 두 조건에 맞지 않으면 404 응답
    return new Response(null, { status: 404 });
  }
}
