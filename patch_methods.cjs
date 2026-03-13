const fs = require('fs');

let content = fs.readFileSync('worker/index.js', 'utf8');

// admin/mentor-applications
content = content.replace(
  /if \(request.method === "PUT"\) return adminMentorApplications\.onRequestPut\(\{ env, request \}\);/g,
  'if (request.method === "POST") return adminMentorApplications.onRequestPost({ env, request });'
);

// admin/mentor-role
content = content.replace(
  /if \(request.method === "DELETE"\) return adminMentorRole\.onRequestDelete\(\{ env, request \}\);/g,
  ''
);

// mentor-profile
content = content.replace(
  /if \(request.method === "POST"\) return mentorProfile\.onRequestPost\(\{ env, request \}\);/g,
  'if (request.method === "GET") return mentorProfile.onRequestGet({ env, request });\n      if (request.method === "PUT") return mentorProfile.onRequestPut({ env, request });'
);

// mentor-requests
content = content.replace(
  /if \(request.method === "PUT"\) return mentorRequests\.onRequestPut\(\{ env, request \}\);/g,
  'if (request.method === "POST") return mentorRequests.onRequestPost({ env, request });\n      if (request.method === "DELETE") return mentorRequests.onRequestDelete({ env, request });'
);

// notifications
content = content.replace(
  /if \(request.method === "PUT"\) return notifications\.onRequestPut\(\{ env, request \}\);/g,
  'if (request.method === "POST") return notifications.onRequestPost({ env, request });'
);

fs.writeFileSync('worker/index.js', content);
