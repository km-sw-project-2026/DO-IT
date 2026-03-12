import * as posts from "../functions/api/posts";

// ✅ 게시글 상세(조회/수정/삭제)
import * as postById from "../functions/api/post/[id].js";

// ✅ 댓글 목록/작성/삭제
import * as comments from "../functions/api/post/[id]/comments.js";

// ✅ 회원가입 API
import * as signup from "../functions/api/auth/signup.js";

// ✅ 아이디 중복 확인 API
import * as idCheck from "../functions/api/auth/id-ckack.js";

// ✅ 로그인 API
import * as login from "../functions/api/auth/login.js";

import * as report from "../functions/api/report/index.js";
import * as adminReports from "../functions/api/admin/reports.js";
import * as adminNotice from "../functions/api/admin/notice.js";
import * as adminBan from "../functions/api/admin/ban.js";

import * as repoFolders from "../functions/api/repository/folders/index.js";
import * as repoFoldersById from "../functions/api/repository/folders/[id].js";
import * as repoFiles from "../functions/api/repository/files/index.js";
import * as repoFilesById from "../functions/api/repository/files/[id].js";
import * as repoNotes from "../functions/api/repository/notes/index.js";
import * as repoNotesById from "../functions/api/repository/notes/[id].js";
import * as repoTrash from "../functions/api/repository/trash/index.js";
import * as repoTrashFolderById from "../functions/api/repository/trash/folders/[id].js";
import * as repoTrashFolderRestore from "../functions/api/repository/trash/folders/[id]/restore.js";
import * as repoTrashFolderPurge from "../functions/api/repository/trash/folders/[id]/purge.js";
import * as repoTrashFileRestore from "../functions/api/repository/trash/files/[id]/restore.js";
import * as repoTrashFilePurge from "../functions/api/repository/trash/files/[id]/purge.js";
import * as repoTrashNoteById from "../functions/api/repository/trash/notes/[id].js";
import * as repoTrashNoteRestore from "../functions/api/repository/trash/notes/[id]/restore.js";
import * as repoTrashNotePurge from "../functions/api/repository/trash/notes/[id]/purge.js";



export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ---------------------------
    // /api/posts
    // ---------------------------
    if (path === "/api/posts") {
      if (request.method === "GET") {
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
      // ✅ 여기 추가!!
      if (request.method === "DELETE") {
        return comments.onRequestDelete({ env, params, request });
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

    // ---------------------------
    // /api/report (신고 접수)
    // ---------------------------
    if (path === "/api/report") {
      if (request.method === "POST") {
        return report.onRequestPost({ env, request });
      }
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/admin/reports (신고 목록/처리)
    // ---------------------------
    if (path === "/api/admin/reports") {
      if (request.method === "GET") {
        return adminReports.onRequestGet({ env, request });
      }
      if (request.method === "POST") {
        return adminReports.onRequestPost({ env, request });
      }
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/admin/notice (공지 설정/해제)
    // ---------------------------
    if (path === "/api/admin/notice") {
      if (request.method === "OPTIONS") return adminNotice.onRequestOptions({ request });
      if (request.method === "POST") return adminNotice.onRequestPost({ request, env });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }
    // ---------------------------
    // /api/admin/ban (차단/해제)
    // ---------------------------
    if (path === "/api/admin/ban") {
      if (request.method === "OPTIONS") return adminBan.onRequestOptions({ request });
      if (request.method === "POST") return adminBan.onRequestPost({ request, env });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/repository/folders (폴더 목록/생성)
    // ---------------------------
    if (path === "/api/repository/folders") {
      if (request.method === "GET") return repoFolders.onRequestGet({ env, request, url });
      if (request.method === "POST") return repoFolders.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/repository/folders/:id (폴더 수정/삭제)
    // ---------------------------
    const mFolderById = path.match(/^\/api\/repository\/folders\/(\d+)\/?$/);
    if (mFolderById) {
      const id = mFolderById[1];
      const params = { id };
      if (request.method === "PATCH") return repoFoldersById.onRequestPatch({ env, request, params });
      if (request.method === "DELETE") return repoFoldersById.onRequestDelete({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/repository/files (파일 목록)
    // ---------------------------
    if (path === "/api/repository/files") {
      if (request.method === "GET") return repoFiles.onRequestGet({ env, request, url });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/repository/files/:id (파일 수정/삭제)
    // ---------------------------
    const mFileById = path.match(/^\/api\/repository\/files\/(\d+)\/?$/);
    if (mFileById) {
      const id = mFileById[1];
      const params = { id };
      if (request.method === "PATCH") return repoFilesById.onRequestPatch({ env, request, params });
      if (request.method === "DELETE") return repoFilesById.onRequestDelete({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/repository/notes (노트 목록/생성)
    // ---------------------------
    if (path === "/api/repository/notes") {
      if (request.method === "GET") return repoNotes.onRequestGet({ env, request, url });
      if (request.method === "POST") return repoNotes.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/repository/notes/:id (노트 조회/수정/삭제)
    // ---------------------------
    const mNoteById = path.match(/^\/api\/repository\/notes\/(\d+)\/?$/);
    if (mNoteById) {
      const id = mNoteById[1];
      const params = { id };
      if (request.method === "GET") return repoNotesById.onRequestGet({ env, request, params });
      if (request.method === "PUT") return repoNotesById.onRequestPut({ env, request, params });
      if (request.method === "DELETE") return repoNotesById.onRequestDelete({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/repository/trash (휴지통)
    // ---------------------------
    if (path === "/api/repository/trash") {
      if (request.method === "GET") return repoTrash.onRequestGet({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const mTrashFolderById = path.match(/^\/api\/repository\/trash\/folders\/(\d+)\/?$/);
    if (mTrashFolderById) {
      const id = mTrashFolderById[1];
      const params = { id };
      if (request.method === "GET") return repoTrashFolderById.onRequestGet({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const mTrashFolderRestore = path.match(/^\/api\/repository\/trash\/folders\/(\d+)\/restore\/?$/);
    if (mTrashFolderRestore) {
      const id = mTrashFolderRestore[1];
      const params = { id };
      if (request.method === "POST") return repoTrashFolderRestore.onRequestPost({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const mTrashFolderPurge = path.match(/^\/api\/repository\/trash\/folders\/(\d+)\/purge\/?$/);
    if (mTrashFolderPurge) {
      const id = mTrashFolderPurge[1];
      const params = { id };
      if (request.method === "DELETE") return repoTrashFolderPurge.onRequestDelete({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const mTrashFileRestore = path.match(/^\/api\/repository\/trash\/files\/(\d+)\/restore\/?$/);
    if (mTrashFileRestore) {
      const id = mTrashFileRestore[1];
      const params = { id };
      if (request.method === "POST") return repoTrashFileRestore.onRequestPost({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const mTrashFilePurge = path.match(/^\/api\/repository\/trash\/files\/(\d+)\/purge\/?$/);
    if (mTrashFilePurge) {
      const id = mTrashFilePurge[1];
      const params = { id };
      if (request.method === "DELETE") return repoTrashFilePurge.onRequestDelete({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const mTrashNoteById = path.match(/^\/api\/repository\/trash\/notes\/(\d+)\/?$/);
    if (mTrashNoteById) {
      const id = mTrashNoteById[1];
      const params = { id };
      if (request.method === "GET") return repoTrashNoteById.onRequestGet({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const mTrashNoteRestore = path.match(/^\/api\/repository\/trash\/notes\/(\d+)\/restore\/?$/);
    if (mTrashNoteRestore) {
      const id = mTrashNoteRestore[1];
      const params = { id };
      if (request.method === "POST") return repoTrashNoteRestore.onRequestPost({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    const mTrashNotePurge = path.match(/^\/api\/repository\/trash\/notes\/(\d+)\/purge\/?$/);
    if (mTrashNotePurge) {
      const id = mTrashNotePurge[1];
      const params = { id };
      if (request.method === "DELETE") return repoTrashNotePurge.onRequestDelete({ env, request, params });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }


    return new Response(null, { status: 404 });
  },
};
