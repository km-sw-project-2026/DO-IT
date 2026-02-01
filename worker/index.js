import * as posts from "../functions/api/posts";

// ✅ 게시글 상세(조회/수정/삭제)
import * as postById from "../functions/api/post/[id].js";

// ✅ 댓글 목록/작성
import * as comments from "../functions/api/post/[id]/comments.js";

// ✅ 회원가입 API
import * as signup from "../functions/api/auth/signup.js";

// ✅ 아이디 중복 확인 API
import * as idCheck from "../functions/api/auth/id-ckack.js";

//  ✅ 로그인 API
import * as login from "../functions/api/auth/login.js";
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ---------------------------
    // /api/posts
    // ---------------------------
    if (path === "/api/posts") {
      if (request.method === "GET") {
        // Pages Functions 스타일은 보통 { env, request } 받지만,
        // 네 posts 파일이 { url, env }로 되어있다 했으니 그대로 유지
        return posts.onRequestGet({ url, env, request });
      }
      if (request.method === "POST") {
        return posts.onRequestPost({ request, env });
      }
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/post/:id/comments
    // ---------------------------
    const mComments = path.match(/^\/api\/post\/(\d+)\/comments\/?$/);
    if (mComments) {
      const id = mComments[1];
      const params = { id };

      if (request.method === "GET") {
        return comments.onRequestGet({ env, params, request });
      }
      if (request.method === "POST") {
        return comments.onRequestPost({ env, params, request });
      }

      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/post/:id
    // ---------------------------
    const mPost = path.match(/^\/api\/post\/(\d+)\/?$/);
    if (mPost) {
      const id = mPost[1];
      const params = { id };

      if (request.method === "GET") {
        return postById.onRequestGet({ env, params, request });
      }
      if (request.method === "PUT") {
        return postById.onRequestPut({ env, params, request });
      }
      if (request.method === "DELETE") {
        return postById.onRequestDelete({ env, params, request });
      }

      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }
    // ---------------------------
    // /api/signup
    // ---------------------------
    if (path === "/api/signup") {
      if (request.method === "OPTIONS") {
        return signup.onRequestOptions({ request });
      }
      if (request.method === "POST") {
        return signup.onRequestPost({ request, env });
      }
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/id-check
    // ---------------------------
    if (path === "/api/id-check") {
      if (request.method === "OPTIONS") {
        return idCheck.onRequestOptions({ request });
      }
      if (request.method === "POST") {
        return idCheck.onRequestPost({ request, env });
      }
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/login
    // ---------------------------
    if (path === "/api/login") {
      if (request.method === "OPTIONS") return login.onRequestOptions({ request });
      if (request.method === "POST") return login.onRequestPost({ request, env });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }


    // 여기까지 오면 API 아닌 요청 → SPA/정적 파일은 기존 방식대로면 assets로 넘겨야 하는데
    // 너는 지금 404만 주고 있었음.
    // 일단 너 흐름 유지(404)로 두되, SPA 필요하면 아래를 바꿔야 함.
    return new Response(null, { status: 404 });
  },
};
