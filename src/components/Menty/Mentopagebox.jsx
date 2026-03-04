import "../../css/Menty/Mentopage.css";

function Mentopagebox() {
    return (
        <>
        
                        <div className="card-top">
                            <div className="avatar">
                            </div>
                            <div className="applicant-info">
                                <div className="name">000</div>
                                <div className="msg">공부 좀 가르쳐 주세요</div>
                            </div>
                        </div>
                        {/* <div className="applicant-actions">
                            <button className="btn-accept">수락하기</button>
                            <button className="btn-reject">거절하기</button>
                        </div> */}
                        <div className="applicant-actions">
                            <button className="btn-accept">채팅하기</button>
                            <button className="btn-reject">멘토 그만하기</button>
                        </div>
        </>
    );
}

export default Mentopagebox;