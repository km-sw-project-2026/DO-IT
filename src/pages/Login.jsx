import '../css/Login.css';

function Login() {
    return (
        <>
            <div className="login-page">
                <div className="login-page-content">
                    <h3>로그인</h3>
                    <input id="userid" type="text" placeholder="아이디를 입력하세요" />
                    <input id="password" type="password" placeholder="비밀번호를 입력하세요" />
                    <div className="login_bt">
                        <input className="keep-login" type="checkbox" />
                        <p>로그인상태 유지</p>
                    </div>
                    <div className="confirm">
                        <button>
                            로그인
                        </button>
                        <a href="#" className="members">회원가입</a>
                    </div>
                </div>
            </div>
        </>
    );
}
export default Login;