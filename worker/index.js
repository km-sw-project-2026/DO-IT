import * as posts from "../functions/api/posts";

// ✅ 게시글 상세(조회/수정/삭제)
import * as postById from "../functions/api/post/[id].js";

// ✅ 댓글 목록/작성/삭제
import * as comments from "../functions/api/post/[id]/comments.js";

// ✅ 회원가입 API
import * as signup from "../functions/api/signup.js";

// ✅ 아이디 중복 확인 API
import * as idCheck from "../functions/api/id-check.js";

// ✅ 로그인 API
import * as login from "../functions/api/login.js";

import * as report from "../functions/api/report/index.js";
import * as adminReports from "../functions/api/admin/reports.js";
import * as adminNotice from "../functions/api/admin/notice.js";
import * as adminBan from "../functions/api/admin/ban.js";
import * as profile from "../functions/api/profile/index.js";
import * as mentorStatus from "../functions/me/mentor-status.js";
import * as mentorById from "../functions/api/mentor/[id].js";
import * as mentoringApply from "../functions/api/mentoring/apply.js";
import * as mentors from "../functions/api/mentors/index.js";
import * as mentorApplication from "../functions/api/mentor-application/index.js";
import * as adminMentorApplications from "../functions/api/admin/mentor-applications.js";
import * as adminMentorRole from "../functions/api/admin/mentor-role.js";
import * as mentorProfile from "../functions/api/mentor-profile/index.js";
import * as myMentors from "../functions/api/my-mentors/index.js";
import * as mentorRequests from "../functions/api/mentor-requests/index.js";
import * as notifications from "../functions/api/notifications/index.js";
import * as chatRooms from "../functions/api/chat/rooms.js";
import * as chatMessages from "../functions/api/chat/messages.js";
import * as reviews from "../functions/api/reviews/index.js";
import * as upload from "../functions/api/upload.js";

import * as calendarCategories from "../functions/api/calendar/categories.js";
import * as calendarCategoriesById from "../functions/api/calendar/categories/[id].js";
import * as calendarEvents from "../functions/api/calendar/events.js";
import * as calendarEventsById from "../functions/api/calendar/events/[id].js";

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



    if (path === "/api/profile") {
      if (request.method === "OPTIONS") return profile.onRequestOptions({ request });
      
      if (request.method === "GET") return profile.onRequestGet({ env, request });
      if (request.method === "PUT") return profile.onRequestPut({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/me/mentor-status") {
      if (request.method === "GET") return mentorStatus.onRequestGet({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    const mMentorById = path.match(/^\/api\/mentor\/([^/]+)\/?$/);
    if (mMentorById) {
      if (request.method === "OPTIONS") return mentorById.onRequestOptions({ request });
      
      if (request.method === "GET") return mentorById.onRequestGet({ env, request, params: { id: mMentorById[1]} });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/mentoring/apply") {
      if (request.method === "OPTIONS") return mentoringApply.onRequestOptions({ request });
      
      if (request.method === "POST") return mentoringApply.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/mentors") {
      if (request.method === "OPTIONS") return mentors.onRequestOptions({ request });
      
      if (request.method === "GET") return mentors.onRequestGet({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/mentor-application") {
      if (request.method === "OPTIONS") return mentorApplication.onRequestOptions({ request });
      
      if (request.method === "POST") return mentorApplication.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/admin/mentor-applications") {
      if (request.method === "OPTIONS") return adminMentorApplications.onRequestOptions({ request });
      
      if (request.method === "GET") return adminMentorApplications.onRequestGet({ env, request });
      if (request.method === "POST") return adminMentorApplications.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/admin/mentor-role") {
      if (request.method === "OPTIONS") return adminMentorRole.onRequestOptions({ request });
      
      if (request.method === "POST") return adminMentorRole.onRequestPost({ env, request });
      
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/mentor-profile") {
      if (request.method === "OPTIONS") return mentorProfile.onRequestOptions({ request });
      
      if (request.method === "GET") return mentorProfile.onRequestGet({ env, request });
      if (request.method === "PUT") return mentorProfile.onRequestPut({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/my-mentors") {
      if (request.method === "OPTIONS") return myMentors.onRequestOptions({ request });
      
      if (request.method === "GET") return myMentors.onRequestGet({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/mentor-requests") {
      if (request.method === "OPTIONS") return mentorRequests.onRequestOptions({ request });
      
      if (request.method === "GET") return mentorRequests.onRequestGet({ env, request });
      if (request.method === "POST") return mentorRequests.onRequestPost({ env, request });
      if (request.method === "DELETE") return mentorRequests.onRequestDelete({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/notifications") {
      if (request.method === "OPTIONS") return notifications.onRequestOptions({ request });
      
      if (request.method === "GET") return notifications.onRequestGet({ env, request });
      if (request.method === "POST") return notifications.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/chat/rooms") {
      if (request.method === "OPTIONS") return chatRooms.onRequestOptions({ request });
      
      if (request.method === "GET") return chatRooms.onRequestGet({ env, request });
      if (request.method === "POST") return chatRooms.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/chat/messages") {
      if (request.method === "OPTIONS") return chatMessages.onRequestOptions({ request });
      
      if (request.method === "GET") return chatMessages.onRequestGet({ env, request });
      if (request.method === "POST") return chatMessages.onRequestPost({ env, request });
      if (request.method === "PUT") return chatMessages.onRequestPut({ env, request });
      if (request.method === "DELETE") return chatMessages.onRequestDelete({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/reviews") {
      if (request.method === "OPTIONS") return reviews.onRequestOptions({ request });
      
      if (request.method === "GET") return reviews.onRequestGet({ env, request });
      if (request.method === "POST") return reviews.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }
    if (path === "/api/upload") {
      if (request.method === "OPTIONS") return upload.onRequestOptions({ request });
      if (request.method === "POST") return upload.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }

    // ---------------------------
    // Calendar APIs
    // ---------------------------
    const CORS_HEADERS_CALENDAR = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-user-id", "Access-Control-Allow-Credentials": "true" };
    
    if (path === "/api/calendar/categories") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS_CALENDAR });
      if (request.method === "GET") return calendarCategories.onRequestGet({ request, env });
      if (request.method === "POST") return calendarCategories.onRequestPost({ request, env });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }

    const matchCategoriesById = path.match(/^\/api\/calendar\/categories\/([^/]+)\/?$/);
    if (matchCategoriesById) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS_CALENDAR });
      if (request.method === "PUT") return calendarCategoriesById.onRequestPut({ request, env, params: { id: matchCategoriesById[1] } });
      if (request.method === "DELETE") return calendarCategoriesById.onRequestDelete({ request, env, params: { id: matchCategoriesById[1] } });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }

    if (path === "/api/calendar/events") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS_CALENDAR });
      if (request.method === "GET") return calendarEvents.onRequestGet({ request, env });
      if (request.method === "POST") return calendarEvents.onRequestPost({ request, env });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }

    const matchEventsById = path.match(/^\/api\/calendar\/events\/([^/]+)\/?$/);
    if (matchEventsById) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS_CALENDAR });
      if (request.method === "DELETE") return calendarEventsById.onRequestDelete({ request, env, params: { id: matchEventsById[1] } });
      return new Response(JSON.stringify({ message: "method not allowed" }), { status: 405 });
    }

    return new Response(null, { status: 404 });
  },
};
