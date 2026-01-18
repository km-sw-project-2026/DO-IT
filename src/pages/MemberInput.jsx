import '../css/MemberInput.css';

function MemberInput() {
    return (
        <div className="member-input-page">
            <div className="member-input-bg">
                <h3>회원가입</h3>
                <div className="member-input-content">
                    <div className="username">
                        <div className="userid">
                            <p>아이디</p>
                            <div className="userid-label">
                                <input id="userid" type="text" placeholder="아이디를 입력하세요" />
                                <button className="userid-check">아이디 확인</button>
                            </div>
                        </div>
                        <div className="nickname">
                            <p>닉네임</p>
                            <input id="nickname" type="text" placeholder="닉네임을 입력하세요" />
                        </div>
                    </div>
                    <p>비밀번호</p>
                    <input id="password1" type="password" placeholder="비밀번호를 입력하세요" />
                    <p>비밀번호 확인</p>
                    <input id="password2" type="password" placeholder="비밀번호를 입력하세요" />
                    <p>이메일</p>
                    <input id="email" type="email" placeholder="이메일을 입력하세요" />
                </div>
                <div className="confirm">
                    <button>
                        회원가입
                    </button>
                </div>
            </div>
        </div>
    );
}
export default MemberInput;