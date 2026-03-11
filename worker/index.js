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
    // /api/profile (프로필 조회/수정)
    // ---------------------------
    if (path === "/api/profile") {
      if (request.method === "OPTIONS") return profile.onRequestOptions({ request });
      if (request.method === "GET") return profile.onRequestGet({ request, env, url });
      if (request.method === "PUT") return profile.onRequestPut({ request, env });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /me/mentor-status (멘토 권한/토글 가능 여부)
    // ---------------------------
    if (path === "/me/mentor-status") {
      if (request.method === "GET") {
        return mentorStatus.onRequestGet({ env, request });
      }
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/mentor/:id (멘토 프로필 상세 조회)
    // ---------------------------
    const mMentor = path.match(/^\/api\/mentor\/(\d+)\/?$/);
    if (mMentor) {
      const params = { id: mMentor[1] };
      if (request.method === "OPTIONS") return mentorById.onRequestOptions({ request });
      if (request.method === "GET") return mentorById.onRequestGet({ env, params, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/mentoring/apply (멘토링 신청)
    // ---------------------------
    if (path === "/api/mentoring/apply") {
      if (request.method === "OPTIONS") return mentoringApply.onRequestOptions({ request });
      if (request.method === "POST") return mentoringApply.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/mentors (멘토 목록)
    // ---------------------------
    if (path === "/api/mentors") {
      if (request.method === "OPTIONS") return mentors.onRequestOptions({ request });
      if (request.method === "GET") return mentors.onRequestGet({ env, url, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/mentor-requests (멘토에게 온 신청 목록/수락거절/종료)
    // ---------------------------
    if (path === "/api/mentor-requests") {
      if (request.method === "OPTIONS") return mentorRequests.onRequestOptions({ request });
      if (request.method === "GET") return mentorRequests.onRequestGet({ env, url, request });
      if (request.method === "POST") return mentorRequests.onRequestPost({ env, request });
      if (request.method === "DELETE") return mentorRequests.onRequestDelete({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/notifications (알림 목록/읽음 처리)
    // ---------------------------
    if (path === "/api/notifications") {
      if (request.method === "OPTIONS") return notifications.onRequestOptions({ request });
      if (request.method === "GET") return notifications.onRequestGet({ env, url, request });
      if (request.method === "POST") return notifications.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/chat/rooms (채팅방 목록/생성)
    // ---------------------------
    if (path === "/api/chat/rooms") {
      if (request.method === "OPTIONS") return chatRooms.onRequestOptions({ request });
      if (request.method === "GET") return chatRooms.onRequestGet({ env, url, request });
      if (request.method === "POST") return chatRooms.onRequestPost({ env, request });
      if (request.method === "DELETE") return chatRooms.onRequestDelete({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/chat/messages (메시지 조회/전송/수정/삭제)
    // ---------------------------
    if (path === "/api/chat/messages") {
      if (request.method === "OPTIONS") return chatMessages.onRequestOptions({ request });
      if (request.method === "GET") return chatMessages.onRequestGet({ env, url, request });
      if (request.method === "POST") return chatMessages.onRequestPost({ env, request });
      if (request.method === "PUT") return chatMessages.onRequestPut({ env, request });
      if (request.method === "DELETE") return chatMessages.onRequestDelete({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/my-mentors (내가 받은 멘토 목록)
    // ---------------------------
    if (path === "/api/my-mentors") {
      if (request.method === "OPTIONS") return myMentors.onRequestOptions({ request });
      if (request.method === "GET") return myMentors.onRequestGet({ env, url, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/mentor-profile (멘토 프로필 조회/수정)
    // ---------------------------
    if (path === "/api/mentor-profile") {
      if (request.method === "OPTIONS") return mentorProfile.onRequestOptions({ request });
      if (request.method === "GET") return mentorProfile.onRequestGet({ env, url, request });
      if (request.method === "PUT") return mentorProfile.onRequestPut({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/mentor-application (멘토 지원)
    // ---------------------------
    if (path === "/api/mentor-application") {
      if (request.method === "OPTIONS") return mentorApplication.onRequestOptions({ request });
      if (request.method === "POST") return mentorApplication.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/admin/mentor-applications (멘토 지원 목록/승인거절)
    // ---------------------------
    if (path === "/api/admin/mentor-applications") {
      if (request.method === "OPTIONS") return adminMentorApplications.onRequestOptions({ request });
      if (request.method === "GET") return adminMentorApplications.onRequestGet({ env, request });
      if (request.method === "POST") return adminMentorApplications.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/admin/mentor-role (멘토 권한 부여/박탈)
    // ---------------------------
    if (path === "/api/admin/mentor-role") {
      if (request.method === "OPTIONS") return adminMentorRole.onRequestOptions({ request });
      if (request.method === "POST") return adminMentorRole.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }


    // ---------------------------
    // /api/reviews (리뷰 등록/조회)
    // ---------------------------
    if (path === "/api/reviews") {
      if (request.method === "OPTIONS") return reviews.onRequestOptions({ request });
      if (request.method === "GET") return reviews.onRequestGet({ env, url, request });
      if (request.method === "POST") return reviews.onRequestPost({ env, request });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    // ---------------------------
    // /api/upload (파일 업로드)
    // ---------------------------
    if (path === "/api/upload") {
      if (request.method === "OPTIONS") return upload.onRequestOptions({ request });
      if (request.method === "POST") return upload.onRequestPost({ request, env });
      return new Response(JSON.stringify({ message: "method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(null, { status: 404 });
  },
};
