import "../../css/Menty/MentypageMento.css";
import { Link } from "react-router-dom";
import StarRating from "../StarRating.jsx";

function MentypageMento({ mentor }) {
  const id = mentor?.id ?? "";
  return (
    <Link to={id ? `/mentoring/${id}` : "/mentypage"} className="MentypageMento-card-link">
      <div className="MentypageMento-card">
        <div className="MentypageMento-profile">
          <img src="/images/profile.jpg" alt="프로필" />
        </div>

        <div className="MentypageMento-info">
          <h3>{mentor?.name ?? "멘토"}</h3>

          <p className="job">{"</>"} {mentor?.job ?? "직무"}</p>
          <p className="company">▦ {mentor?.company ?? "회사"}</p>

          {mentor?.introduction && (
            <p className="introduction">{mentor.introduction}</p>
          )}

          <div className="rating-row">
            <StarRating
              rating={mentor?.rating ?? 0}
              count={mentor?.reviewCount ?? 0}
              layout="row"
              size="sm"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default MentypageMento;