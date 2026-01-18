import'../css/CommunityView.css';
import React from "react";
import Comment from "../components/comment";



function CommunityView() {

    return (
        <div className="Community-view">
            <div className="Community-view-header">
                <div className="Community-view-title">
                    <h2>커뮤니티 글 제목</h2>
                </div>
                <div className="Community-view-info">
                    <table className="post-info">
                        <tr>
                            <th>작성자</th>
                            <td>밥밥밥</td>
                            <th>조회수</th>
                            <td>423</td>
                        </tr>
                        <tr>
                            <th>첨부파일</th>
                            <td>
                                <span class="file">
                                    <img src="./images/icon/link.png" alt="파일" />19940423.jpg
                                </span>
                            </td>
                            <th>작성일자</th>
                            <td>1994-04-23</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div className="Community-view-main">
                <p className="post-content">
                    이 글은 커뮤니티에서 게시된 글입니다. 내용은 여기에 표시됩니다.
                </p>
                <div className="comments-section">
                    <h3>댓글</h3>
                    <div className="comments-list">
                        <Comment comment={{ author: "사용자1", text: "좋은 글 감사합니다!", time: "2024-06-01 10:00" }} />
                        <Comment comment={{ author: "사용자2", text: "많은 도움이 되었어요.", time: "2024-06-01 11:30" }} />
                    </div>
                    <div className="add-comment">
                        <textarea placeholder="로그인 후 사용 가능합니다"></textarea>
                        <div className="file-upload-form">
                            <input type="file" id="file-upload"  />
                            <span  className="file-name" >선택된 파일이 없습니다</span>
                            <label htmlFor="file-upload" className="custom-file-upload">
                                <i className="fa fa-cloud-upload"></i> 파일 선택
                            </label>
                        </div>
                        <button className="comment-btn">댓글 작성</button>
                    </div>
                </div>
            </div>
            <div className="Community-view-footer">
                <button className="back">돌아가기</button>
            </div>
        </div>
    );
}
export default CommunityView;


