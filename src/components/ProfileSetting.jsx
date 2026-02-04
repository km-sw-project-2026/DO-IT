import "../css/ProfileSetting.css"

function ProfileSetting() {
    return (
        <div className="profile-setting-inner">
            <div className="profile-setting-header">
                <h2>프로필 설정</h2>
                <img src='/images/icon/clos.png' alt="" />
            </div>
            <div className="profile-setting-set">
                <div className="profile-setting-list">
                    <div>
                        <button>프로필</button>
                    </div>
                </div>
                <div className="profile-setting-contents">
                    <div className="profile">
                        <h3>프로필</h3>
                        <img src="" alt="이미지 넣을 예정" />
                    </div>
                    <div className="nickname">
                        {/* /디비에서 불러올 예정 */}
                        <h3>이름</h3>
                        <input type="text" />
                    </div>
                    <div className="information">
                        {/* 자기소개/ */}
                        <h3>정보</h3>
                        <input type="text" />
                    </div>
                </div>
            </div>
            <button className="profile-setting-check">확인</button>
        </div>
    );
}

export default ProfileSetting;