import "../css/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepLogin, setKeepLogin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const login_id = username.trim();
    const pw = password;

    if (!login_id) {
      setErr("아이디를 입력해주세요.");
      return;
    }
    if (!pw) {
      setErr("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          login_id,
          password: pw,
          keepLogin, // (선택) 서버에서 안 써도 같이 보내도 됨
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        setErr(data?.message || "로그인 실패");
        return;
      }

      // ✅ 로그인 성공: user 정보 저장(원하면 localStorage/sessionStorage)
      // keepLogin 체크에 따라 저장 위치 분기
      const storage = keepLogin ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(data.user));

      // ✅ 이동(원하는 경로로 바꿔도 됨)
      navigate("/");
    } catch (error) {
      console.error(error);
      setErr("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-page-content">
          <h3>로그인</h3>

          <div className="login-page-contents">
            {/* ✅ form으로 감싸면 엔터로도 로그인됨 */}
            <form onSubmit={onSubmit}>
              <input
                id="userid"
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />

              <input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />

              <div className="login_bt">
                <input
                  className="keep-login"
                  type="checkbox"
                  checked={keepLogin}
                  onChange={(e) => setKeepLogin(e.target.checked)}
                  disabled={loading}
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
      </div>
    </>
  );
}

export default Login;
