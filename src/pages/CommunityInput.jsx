import '../css/CommunityInput.css';
import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const no = () => {
    alert("아직 구현되지 않은 기능입니다.");};

function CommunityInput() {
    return (
        <div className="Community-input">
            <div className="Community-input-header">
                <h2>커뮤니티 글 작성</h2>
                <Link to={"/post"}><button className="close"><img src="./images/icon/close.png" alt="닫기" /></button></Link>
            </div>
            <div className="Community-input-main">
                <div className="Community-input-title">
                    <input
                        type="text"
                        placeholder="제목을 입력하세요."
                    />
                </div>
                <div className="Community-input-content">
                    <textarea
                        className="Community-input-textarea"
                        placeholder="내용을 입력하세요."
                    ></textarea>
                </div>
            </div>
            <div className="Community-input-footer">
                <div className="Community-input-footer-content">
                    <button className="picture" onClick={no}><img src="./images/icon/picture.png" alt="사진" /></button>
                    <button className="link" onClick={no}><img src="./images/icon/link.png" alt="파일" /></button>
                </div>
                <button className="Community-input-button">등록</button>
            </div>
        </div>
    );
}
export default CommunityInput;