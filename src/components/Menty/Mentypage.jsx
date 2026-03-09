import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Menty/Mentypage.css";
import MentypageMento from "./MentypageMento.jsx";
import MentoreviewModal from "./MentoreviewModal.jsx";
import Mentopage from "./Mentopage.jsx";
import { getCurrentUser } from "../../utils/auth";

function Mentypage() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const me = getCurrentUser();
  const [page, setPage] = useState(1);

  // mentor 권한 여부
  const [isMentor, setIsMentor] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  // 멘토 목록
  const [mentors, setMentors] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [mentorsLoaded, setMentorsLoaded] = useState(false);
  const PAGE_SIZE = 6;

  // ✅ 모든 hook을 조건부 return 전에 선언
  useEffect(() => {
    if (!me) { setStatusLoaded(true); return; }
    fetch(`/me/mentor-status?user_id=${me.user_id}`)
      .then((r) => r.json())
      .then((data) => {
        setIsMentor(data.isMentor || me.role === "ADMIN");
        setStatusLoaded(true);
      })
      .catch(() => {
        setIsMentor(me.role === "MENTOR" || me.role === "ADMIN");
        setStatusLoaded(true);
      });
  }, []);

  useEffect(() => {
    fetch(`/api/mentors?page=${page}&size=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then((data) => {
        setMentors(data.mentors || []);
        setTotalPages(data.totalPages ?? 1);
        setMentorsLoaded(true);
      })
      .catch(() => setMentorsLoaded(true));
  }, [page]);

  const handleSelectMentor = (mentor) => {
    setShowModal(false);
    navigate("/mentoreview", { state: { mentor } });
  };

  // 상태 로딩 전 빈 화면 방지
  if (!statusLoaded) return null;

  const viewMode = sessionStorage.getItem("viewMode") || (isMentor ? "mentor" : "mentee");

  if (viewMode === "mentor" && isMentor) {
    return <Mentopage />;
  }

  return (
    <section className="Mentypage">
      <div className="Mentypage-header">
        <div className="Mentypage-header-inner">
          <h1>
            함께 성장하는 <strong>멘토링</strong>의 시작, <strong>경험</strong>을 나누고{" "}
            <strong>성장</strong>을 연결합니다
          </h1>

          <div className="Menty-buttons-group">
            <div className="Menty-button">
              <img src="#" alt="1" />
              <button onClick={() => navigate("/mentologin")}>멘토 지원하기</button>
            </div>
            <div className="Menty-button">
              <img src="#" alt="2" />
              <button onClick={() => setShowModal(true)}>후기 남기기</button>
            </div>
            <div className="Menty-button">
              <img src="#" alt="3" />
              <button>나의 채팅 기록</button>
            </div>
          </div>
        </div>
      </div>

      <button className="filter-button">
        <p>필터</p>
        <div className="filter-button-inner">
          <ul>
            <li>별점 높은 순</li>
            <li>리뷰 순</li>
            <li>최근 순</li>
          </ul>
        </div>
      </button>

      {/* 멘토 카드 */}
      <div className="Mento-box">
        {!mentorsLoaded ? (
          <p style={{ padding: "40px 0", textAlign: "center", color: "#aaa" }}>불러오는 중...</p>
        ) : mentors.length === 0 ? (
          <div className="Mento-backup">
            <p>아직 멘토가 없어요</p>
            <span>지원하고 첫번째 멘토되기</span>
            <button className="Mento-backup-btn" onClick={() => navigate("/mentologin")}>
              멘토 지원하기
            </button>
          </div>
        ) : (
          mentors.map((mentor) => (
            <MentypageMento key={mentor.id} mentor={mentor} />
          ))
        )}
      </div>

      <footer className="Mentypage-footer">
        <div className="Mentypage-footer-content">
          <div className="page-number">
            <button className="prev" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>{"<"}</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                className={num === page ? "active" : undefined}
              >
                {num}
              </button>
            ))}

            <button className="next" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{">"}</button>
          </div>
        </div>
      </footer>

      {/* 없을때 화면은 나중에 데이터 0개일 때만 보이게 */}
      {/* 
      <div className="Mento-backup">
        <img src="/images/mentoring/1.png" alt="img" />
        <p>아직 멘토가 없어요</p>
        <span>지원하고 첫번째 멘토되기</span>
      </div>

      <div className="Mento-backup-button">
        <button onClick={() => navigate("/mentologin")}>멘토 지원하기</button>
      </div>
      */}

      {showModal && (
        <MentoreviewModal
          onClose={() => setShowModal(false)}
          onSelect={handleSelectMentor}
        />
      )}
    </section>
  );
}

export default Mentypage;