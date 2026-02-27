import "../../css/Menty/MentoreviewModal.css";

const dummyMentors = [
    { id: 1, name: "OOO 멘토", img: "/images/profile.jpg" },
    { id: 2, name: "OOO 멘토", img: "/images/profile.jpg" },
    { id: 3, name: "OOO 멘토", img: "/images/profile.jpg" },
];

function MentoreviewModal({ onClose, onSelect }) {
    return (
        <div className="MentoreviewModal-overlay" onClick={onClose}>
            <div className="MentoreviewModal-box" onClick={(e) => e.stopPropagation()}>
                <p className="MentoreviewModal-title">어떤 멘토에게 리뷰를 남기시겠습니까?</p>
                <div className="MentoreviewModal-mentors">
                    {dummyMentors.map((mentor) => (
                        <div className="MentoreviewModal-item" key={mentor.id}>
                            <img src={mentor.img} alt={mentor.name} />
                            <p>{mentor.name}</p>
                            <button onClick={() => onSelect(mentor)}>선택하기</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MentoreviewModal;
