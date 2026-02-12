import { useState } from "react";
import "../css/ProfileSetting.css"


export const ProfileSetting = ({ openModal, setOpenModal}) => {
    return (
        <div className="pop-up" >
            <div className="pop-up-contents">
                <div className="profile-setting-inner">
                    <div className="profile-setting-header">
                        <h2>프로필 설정</h2>
                        <button type="button" onClick={() => {setOpenModal(false);}}>
                            <img src='/images/icon/close.png' alt="닫기" />
                        </button>
                        {/* {!openModal ? setOpenModal(true) : null} */}
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
                                <img src='/images/icon/profile.jpg' alt="이미지 넣을 예정" />
                            </div>
                            <div className="nickname">
                                {/* /디비에서 불러올 예정 */}
                                <h3>이름</h3>
                                <input type="text" readOnly value="어드민" />
                            </div>
                            <div className="information">
                                {/* 자기소개/ */}
                                <h3>정보</h3>
                                <textarea name="information" id="information"></textarea>
                            </div>
                        </div>
                    </div>
                    <button className="profile-setting-check" 
                    type="button" onClick={() => {setOpenModal(false);}}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};