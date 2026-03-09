import StarRating from "../StarRating.jsx";

function Mentoringreview() {
    return (
        <div className="Mento-star">
            <p>2025.04.23 12:22 익명</p>
            <div className="star">
                <StarRating rating={5.0} count={423} layout="col" size="lg" />
            </div>
            <div className="Mento-review">
                <span>리뷰리뷰리뷰리뷰리뷰리뷰리뷰</span>
                <p>신고</p>
            </div>
        </div>
    );
}

export default Mentoringreview;