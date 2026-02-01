import "../css/Header.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ 저장소에서 user 읽기 (keepLogin이면 localStorage, 아니면 sessionStorage)
  const readUser = () => {
    const u =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setUser(readUser());

    // 같은 탭에서 로그인/로그아웃하면 바로 반영되게(간단 폴링)
    const t = setInterval(() => setUser(readUser()), 500);
    return () => clearInterval(t);
  }, []);

  const onLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // ✅ 프로필 이미지 없을 때 기본 이미지
  const profileSrc =
    user?.profile_image && user.profile_image.trim() !== ""
      ? user.profile_image
      : "/images/default-profile.png"; // 너 프로젝트에 이 이미지 하나 추가해줘

  return (
    <header className="project-header">
      <div className="header-inner">
        <div className="logo">
          <Link to={"/"}>
            <img src="/images/logo.png" alt="로고" />
          </Link>
        </div>

        <nav>
          <ul>
            <li>멘토/멘티</li>
            <Link to={"/post"}>
              <li>커뮤니티</li>
            </Link>
            <li>캘린더</li>
            <li>마이페이지</li>
          </ul>
        </nav>

        {/* ✅ 로그인 전/후 UI 분기 */}
        <div className="user">
          {!user ? (
            <>
              <Link to={"/login"} className="login">
                로그인
              </Link>
              <Link to={"/memberinput"} className="new-user">
                회원가입
              </Link>
            </>
          ) : (
            <div className="user-info">
              <img className="user-avatar" src={profileSrc} alt="프로필" />
              <span className="user-nickname">{user.nickname}</span>
              <button className="logout-btn" type="button" onClick={onLogout}>
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