import "../css/Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser, isAdmin } from "../utils/auth";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ 로그인 정보 불러오기
  useEffect(() => {
    setUser(getCurrentUser());

    // storage 변경 감지 (다른 탭 포함)
    const syncUser = () => setUser(getCurrentUser());
    window.addEventListener("storage", syncUser);

    return () => window.removeEventListener("storage", syncUser);
  }, []);

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
      : "/images/default-profile.png";

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
            <li>멘토/멘티</li>

            <Link to="/post">
              <li>커뮤니티</li>
            </Link>

            <li>캘린더</li>
            <li>마이페이지</li>

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
