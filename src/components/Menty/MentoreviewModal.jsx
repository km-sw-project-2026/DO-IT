import { useState, useEffect } from "react";
import "../../css/Menty/MentoreviewModal.css";

function MentoreviewModal({ onClose, onSelect }) {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
            const me = raw ? JSON.parse(raw) : null;
            const uid = me?.user_id ?? me?.id ?? me?.user?.user_id ?? null;
            if (!uid) { setLoading(false); return; }

            fetch(`/api/my-mentors?user_id=${uid}`)
                .then((r) => r.json())
                .then((data) => {
                    setMentors(data.mentors || []);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } catch {
            setLoading(false);
        }
    }, []);

    return (
        <div className="MentoreviewModal-overlay" onClick={onClose}>
            <div className="MentoreviewModal-box" onClick={(e) => e.stopPropagation()}>
                <p className="MentoreviewModal-title">어떤 멘토에게 리뷰를 남기시겠습니까?</p>
                <div className="MentoreviewModal-mentors">
                    {loading ? (
                        <p className="MentoreviewModal-empty">불러오는 중...</p>
                    ) : mentors.length === 0 ? (
                        <p className="MentoreviewModal-empty">아직 멘토링을 받은 내역이 없어요.</p>
                    ) : (
                        mentors.map((mentor) => (
                            <div className="MentoreviewModal-item" key={mentor.mentor_id}>
                                <img src={mentor.img} alt={mentor.name} />
                                <p>{mentor.name}</p>
                                <button onClick={() => onSelect(mentor)}>선택하기</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default MentoreviewModal;
