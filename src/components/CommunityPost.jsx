import '../css/CommunityPost.css';

function CommunityPost() {
    return (
        <div className="Community-post">
            <a href="#" className="Community-post-content">
                <h4>----커뮤니티 글 제목----</h4>
                <div className="Community-content">
                    <span className="view">319</span>
                    <span className="date">2008-03-19</span>
                    <span className="Comment">7</span>
                </div>
            </a>
        </div>
    );
}
export default CommunityPost;