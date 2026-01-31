import "../css/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");   // ✅ API가 username을 받음
  const [password, setPassword] = useState("");
  const [keepLogin, setKeepLogin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault(); // ✅ 엔터/폼 제출 막고 우리가 처리
    setErr("");
    setLoading(true);

    try {
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data?.success) {
        throw new Error(data?.message || "로그인 실패");
      }

      // ✅ 로그인 성공: user 저장 (로그인 유지 체크에 따라 저장 위치 선택)
      const storage = keepLogin ? localStorage : sessionStorage;
      storage.setItem("AUTH_USER", JSON.stringify(data.user));

      // ✅ 원하는 페이지로 이동 (예: 커뮤니티)
      nav("/community");
    } catch (e) {
      setErr(e.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-page-content">
          <h3>로그인</h3>

          {/* ✅ form으로 감싸면 엔터로도 로그인됨 */}
          <form onSubmit={onSubmit}>
            <input
              id="userid"
              type="text"
              placeholder="아이디를 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div className="login_bt">
              <input
                className="keep-login"
                type="checkbox"
                checked={keepLogin}
                onChange={(e) => setKeepLogin(e.target.checked)}
              />
              <p>로그인상태 유지</p>
            </div>

            {/* ✅ 에러 표시 */}
            {err && <p style={{ color: "crimson", marginTop: 8 }}>{err}</p>}

            <div className="confirm">
              <button type="submit" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </button>

              <Link to={"/memberinput"} className="new-user">
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
