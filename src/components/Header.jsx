import "../css/Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { getCurrentUser, isAdmin } from "../utils/auth";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  // ✅ 로그인 정보 불러오기
  useEffect(() => {
    setUser(getCurrentUser());

    // storage 변경 감지 (다른 탭 포함)
    const syncUser = () => setUser(getCurrentUser());
    window.addEventListener("storage", syncUser);

    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // 알림 조회
  const fetchNotifications = useCallback((uid) => {
    if (!uid) return;
    fetch(`/api/notifications?user_id=${uid}`)
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnread(data.unread || 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const uid = user?.user_id;
    if (!uid) return;
    fetchNotifications(uid);
    // 10초마다 폴링
    const timer = setInterval(() => fetchNotifications(uid), 10000);
    return () => clearInterval(timer);
  }, [user, fetchNotifications]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotif((prev) => !prev);
    // 열 때 전체 읽음 처리
    if (!showNotif && unread > 0 && user?.user_id) {
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id }),
      }).then(() => {
        setUnread(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      }).catch(() => {});
    }
  };

  const onLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // ✅ 프로필 이미지 (없으면 기본)
  const profileSrc =
    user?.profile_image && user.profile_image.trim() !== ""
      ? user.profile_image
      : "/images/profile.jpg";

  return (
    <header className="project-header">
      <div className="header-inner">
        <div className="logo">
          <Link to="/">
            <img src="/images/logo.png" alt="로고" />
          </Link>
        </div>

        <nav>
          <ul>
            <Link to="/mentypage"><li>멘토/멘티</li></Link>

            <Link to="/post">
              <li>커뮤니티</li>
            </Link>

            <Link to="/calendar"><li>캘린더</li></Link>
            <Link to="/mypagementy">
            <li>마이페이지</li>
            </Link>

            {/* ✅ 관리자 전용 메뉴 */}
            {user && isAdmin() && (
              <Link to="/admin">
                <li className="admin-menu">관리자</li>
              </Link>
            )}
          </ul>
        </nav>

        {/* ✅ 로그인 전/후 UI */}
        <div className="user">
          {!user ? (
            <>
              <Link to="/login" className="login">
                로그인
              </Link>
              <Link to="/memberinput" className="new-user">
                회원가입
              </Link>
            </>
          ) : (
            <div className="user-info">
              {/* 🔔 알림 벨 */}
              <div className="notif-wrap" ref={notifRef}>
                <button className="notif-bell" type="button" onClick={handleBellClick} aria-label="알림">
                  <img src="/images/mentee/notice.png" alt="알림" />
                  {unread > 0 && <span className="notif-badge">{unread}</span>}
                </button>

                {showNotif && (
                  <div className="notif-dropdown">
                    <div className="notif-header">알림</div>
                    {notifications.length === 0 ? (
                      <div className="notif-empty">새 알림이 없어요.</div>
                    ) : (
                      <ul className="notif-list">
                        {notifications.map((n) => (
                          <li
                            key={n.notification_id}
                            className={`notif-item${n.is_read === 0 ? " unread" : ""}${(n.link_url || n.mentoring_id) ? " clickable" : ""}`}
                            onClick={() => {
                              let dest = n.link_url
                                || (n.mentoring_id ? `/chat?mentoring_id=${n.mentoring_id}` : null);
                              
                              if (dest === '/mypage') {
                                if (n.message && n.message.includes("신청했어요!")) {
                                  dest = "/mentopage";
                                } else {
                                  dest = "/mypagementy";
                                }
                              }

                              if (dest) {
                                setShowNotif(false);
                                navigate(dest);
                              }
                            }}
                          >
                            <span className="notif-msg">{n.message}</span>
                            <span className="notif-time">
                              {n.created_at ? new Date(n.created_at.includes('T') || n.created_at.endsWith('Z') ? n.created_at : n.created_at.replace(' ', 'T') + 'Z').toLocaleString("ko-KR", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                              }) : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <img
                className="user-avatar"
                src={profileSrc}
                alt="프로필"
              />

              <span className="user-nickname">
                {user.nickname}
                {isAdmin() && <span style={{ color: "crimson" }}> (관리자)</span>}
              </span>

              <button
                className="logout-btn"
                type="button"
                onClick={onLogout}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
