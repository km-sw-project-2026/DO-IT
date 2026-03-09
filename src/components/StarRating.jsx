import "../css/StarRating.css";

/**
 * StarRating - 별점 표시 공통 컴포넌트
 * @param {number}  rating  - 0~5 숫자 (소수 가능)
 * @param {number}  count   - 리뷰 수 (선택)
 * @param {"col"|"row"} layout - col: 별·라벨 세로 정렬(기본) / row: 가로 정렬
 * @param {"sm"|"md"|"lg"} size
 */
function StarRating({ rating = 0, count, layout = "col", size = "md" }) {
  const filled = Math.round(rating);

  const stars = [1, 2, 3, 4, 5].map((i) => (
    <span
      key={i}
      className={`star-rating__star${i <= filled ? " filled" : ""}`}
    >
      ★
    </span>
  ));

  const label =
    rating !== null && rating !== undefined ? (
      <span className="star-rating__label">
        {Number(rating).toFixed(1)}
        {count !== undefined ? ` (${count})` : ""}
      </span>
    ) : null;

  return (
    <div className={`star-rating star-rating--${size} star-rating--${layout}`}>
      <div className="star-rating__stars">{stars}</div>
      {label}
    </div>
  );
}

export default StarRating;
