const fs = require('fs');
let code = fs.readFileSync('worker/index.js', 'utf8');

const mapping = {
  'profile': '/api/profile',
  'mentorById': '^\\\\/api\\\\/mentor\\\\/([^/]+)\\\\/?$',
  'mentoringApply': '/api/mentoring/apply',
  'mentors': '/api/mentors',
  'mentorApplication': '/api/mentor-application',
  'adminMentorApplications': '/api/admin/mentor-applications',
  'adminMentorRole': '/api/admin/mentor-role',
  'mentorProfile': '/api/mentor-profile',
  'myMentors': '/api/my-mentors',
  'mentorRequests': '/api/mentor-requests',
  'notifications': '/api/notifications',
  'chatRooms': '/api/chat/rooms',
  'chatMessages': '/api/chat/messages',
  'reviews': '/api/reviews'
};

for (const [moduleName, routePath] of Object.entries(mapping)) {
  let searchSpace = `if (path === "${routePath}") {`;
  if (routePath.includes('^\\\\/api')) {
    // regex case
    searchSpace = `if (m${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}) {`;
  }
  
  if (code.includes(searchSpace)) {
    const injectStr = `if (request.method === "OPTIONS") return ${moduleName}.onRequestOptions({ request });\n      `;
    // check if it's already there
    const checkStr = `if (request.method === "OPTIONS") return ${moduleName}.onRequestOptions`;
    if (!code.includes(checkStr)) {
        code = code.replace(searchSpace, searchSpace + `\n      ` + injectStr);
    }
  }
}

fs.writeFileSync('worker/index.js', code);
