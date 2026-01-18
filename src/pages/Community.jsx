import '../css/Community.css';
import React from "react";
import CommunityPost from "../components/CommunityPost";


function Community() {
    return (
        <section className="Community">
            <div className="Community-header">
                <div className="search">
                    <input type="text" placeholder="검색어를 입력해세요" />
                    <button><img src="./images/icon/search1.png" alt="검색"/></button>
                </div>
            </div>
            <div className="Community-main">
                <div className="Community-main-title">
                    <div className="Community-main-title-content">
                        <h2>제목</h2>
                        <div className="Community-title-content">
                            <span className="view">조회수</span>
                            <span className="date">등록일</span>
                            <span className="comment">댓글</span>
                        </div>
                    </div>
                </div>
                <CommunityPost />
                <CommunityPost />
                <CommunityPost />
                <CommunityPost />
                <CommunityPost />
                <CommunityPost />
                <CommunityPost />
                <CommunityPost />
                <CommunityPost />
                <CommunityPost />
            </div>
            <footer className="Community-footer">
                <div className="Community-footer-content">
                <div className="page-number">
                    <button className="prev">←</button>
                    <button>1</button>
                    <button>2</button>
                    <button>3</button>
                    <button>4</button>
                    <button>5</button>
                    <span>...</span>
                    <button>23</button>
                    <button className="next">→</button>
                </div>
                <button className="write-button"><img src="./images/icon/pan.png" alt="" /></button>
                </div>
            </footer>
        </section>
        
    );
}

export default Community;