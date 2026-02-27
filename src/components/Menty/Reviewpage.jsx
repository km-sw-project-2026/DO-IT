import "../../css/Menty/Myreview.css";

function Reviewpage({ date, author, score, text, onReport }) {
    return (
        <>
            <div className="review-item">
                <div className="review-meta">
                    <span className="review-date">{date}</span>
                    <span className="review-author">{author}</span>
                </div>
                <div className="review-stars">
                    <span className="star full">★</span>
                    <span className="star full">★</span>
                    <span className="star full">★</span>
                    <span className="star full">★</span>
                    <span className="star half">★</span>
                    <span className="score">{score}</span>
                </div>
                <div className="review-body">
                    <p className="review-text">{text}</p>
                    <button className="report-btn" onClick={onReport}>신고</button>
                </div>
            </div>
        </>
    );
}

export default Reviewpage;