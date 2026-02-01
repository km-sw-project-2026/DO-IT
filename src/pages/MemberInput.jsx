import "../css/MemberInput.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function MemberInput() {
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  // ✅ 아이디 중복확인 완료 여부(중요!)
  const [idChecked, setIdChecked] = useState(false);
  const [idAvailable, setIdAvailable] = useState(false);

  // 아이디 입력이 바뀌면 다시 확인해야 함
  const onChangeLoginId = (v) => {
    setLoginId(v);
    setIdChecked(false);
    setIdAvailable(false);
  };

  // ✅ 아이디 확인 버튼 → /api/id-check
  const onCheckId = async () => {
    const id = loginId.trim();
    if (id.length < 4) {
      alert("아이디는 4자 이상이어야 합니다.");
      return;
    }

    try {
      setLoading(true);

      const resp = await fetch("/api/id-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login_id: id }),
      });

      const data = await resp.json().catch(() => ({}));

      // 이 API는 200으로 available true/false를 주는 구조
      setIdChecked(true);
      setIdAvailable(Boolean(data?.available));

      alert(data?.message || "확인 결과를 불러오지 못했습니다.");
    } catch (e) {
      console.error(e);
      alert("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 회원가입 버튼 → /api/signup
  const onSignup = async () => {
    const id = loginId.trim();
    const nick = nickname.trim();
    const em = email.trim();

    // 프론트 기본 검증
    if (id.length < 4) return alert("아이디는 4자 이상이어야 합니다.");
    if (!idChecked) return alert("아이디 확인을 먼저 해주세요.");
    if (!idAvailable) return alert("사용 가능한 아이디로 다시 확인해주세요.");

    if (nick.length < 2) return alert("닉네임은 2자 이상이어야 합니다.");
    if (pw1.length < 6) return alert("비밀번호는 6자 이상이어야 합니다.");
    if (pw1 !== pw2) return alert("비밀번호가 서로 다릅니다.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))
      return alert("이메일 형식이 올바르지 않습니다.");

    try {
      setLoading(true);

      const resp = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          login_id: id,
          nickname: nick,
          email: em,
          password: pw1,
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        // signup API에서 "이미 사용 중인 이메일/아이디" 같은 메시지 내려줌
        alert(data?.message || "회원가입 실패");
        // 혹시 가입 중 아이디 중복이 다시 발생하면 체크 풀기
        if (String(data?.message || "").includes("아이디")) {
          setIdChecked(false);
          setIdAvailable(false);
        }
        return;
      }

      alert("회원가입 성공!");
      navigate("/login");
    } catch (e) {
      console.error(e);
      alert("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="member-input-page">
      <div className="member-input-bg">
        <h3>회원가입</h3>

        <div className="member-input-content">
          <div className="username">
            <div className="userid">
              <p>아이디</p>
              <div className="userid-label">
                <input
                  id="userid"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={loginId}
                  onChange={(e) => onChangeLoginId(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="userid-check"
                  type="button"
                  onClick={onCheckId}
                  disabled={loading}
                >
                  아이디 확인
                </button>
              </div>

              {/* ✅ 선택: 아이디 확인 상태 표시 (원치 않으면 이 블록 삭제 가능) */}
              {idChecked && (
                <p style={{ marginTop: "6px", fontSize: "12px" }}>
                  {idAvailable ? "✅ 사용 가능" : "❌ 사용 불가"}
                </p>
              )}
            </div>

            <div className="nickname">
              <p>닉네임</p>
              <input
                id="nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <p>비밀번호</p>
          <input
            id="password1"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            disabled={loading}
          />

          <p>비밀번호 확인</p>
          <input
            id="password2"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            disabled={loading}
          />

          <p>이메일</p>
          <input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="confirm">
          <button type="button" onClick={onSignup} disabled={loading}>
            {loading ? "처리 중..." : "회원가입"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemberInput;
