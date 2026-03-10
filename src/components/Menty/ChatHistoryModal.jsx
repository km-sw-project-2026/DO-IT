import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Menty/ChatHistoryModal.css";

function ChatHistoryModal({ onClose }) {
    const navigate = useNavigate();

    const getUser = () => {
        try {
            const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    };
    const me = getUser();
    const myId = me?.user_id ?? me?.id ?? null;

    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const bottomRef = useRef(null);

    // 채팅방 목록 불러오기
    const fetchRooms = useCallback(async () => {
        if (!myId) { setLoadingRooms(false); return; }
        try {
            const res = await fetch(`/api/chat/rooms?user_id=${myId}`);
            const data = await res.json();
            const list = data.rooms || [];
            setRooms(list);
            if (list.length > 0 && !activeRoom) setActiveRoom(list[0]);
        } catch { /* ignore */ } finally {
            setLoadingRooms(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myId]);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    // 선택된 방의 메시지 불러오기
    useEffect(() => {
        if (!activeRoom) return;
        setLoadingMsgs(true);
        setMessages([]);
        fetch(`/api/chat/messages?room_id=${activeRoom.room_id}&after=0`)
            .then(r => r.json())
            .then(data => { setMessages(data.messages || []); })
            .catch(() => {})
            .finally(() => setLoadingMsgs(false));
    }, [activeRoom]);

    // 메시지 새로 오면 스크롤
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 기록 삭제 (숨김 처리)
    const handleDelete = async () => {
        if (!activeRoom || !myId) return;
        if (!window.confirm("이 채팅 기록을 삭제하시겠어요?")) return;
        await fetch("/api/chat/rooms", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: myId, room_id: activeRoom.room_id }),
        }).catch(() => {});
        const updated = rooms.filter(r => r.room_id !== activeRoom.room_id);
        setRooms(updated);
        setActiveRoom(updated[0] || null);
        setMessages([]);
    };

    const handleGoChat = () => {
        if (!activeRoom) return;
        onClose();
        navigate(`/chat?mentoring_id=${activeRoom.mentoring_id}`);
    };

    const formatTime = (iso) => {
        const d = new Date(iso.includes('T') || iso.endsWith('Z') ? iso : iso.replace(' ', 'T') + 'Z');
        return d.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const renderContent = (content) => {
        const imgMatch = content.match(/^\[img\]([\s\S]+)\[\/img\]$/);
        if (imgMatch) {
            return <img src={imgMatch[1]} alt="첨부 이미지" className="chm-img-preview" />;
        }
        const fileMatch = content.match(/^\[file name="([^"]+)" data="([\s\S]+)"\]\[\/file\]$/);
        if (fileMatch) {
            return (
                <a href={fileMatch[2]} download={fileMatch[1]} className="chm-file-link">
                    📎 {fileMatch[1]}
                </a>
            );
        }
        return content;
    };

    return (
        <div className="chm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="chm-modal">
                {/* 헤더 */}
                <div className="chm-header">
                    <span className="chm-title-text">나의 채팅 기록</span>
                    <button className="chm-close" onClick={onClose}>✕</button>
                </div>

                <div className="chm-body">
                    {/* 왼쪽: 채팅 상대 목록 */}
                    <aside className="chm-sidebar">
                        {loadingRooms ? (
                            <p className="chm-empty">불러오는 중...</p>
                        ) : rooms.length === 0 ? (
                            <p className="chm-empty">채팅 내역이 없어요.</p>
                        ) : (
                            rooms.map(room => (
                                <button
                                    key={room.room_id}
                                    className={`chm-room-btn${activeRoom?.room_id === room.room_id ? " active" : ""}`}
                                    onClick={() => setActiveRoom(room)}
                                >
                                    <img
                                        src={room.other_image}
                                        alt=""
                                        className="chm-avatar"
                                        onError={e => { e.target.src = "/images/profile.jpg"; }}
                                    />
                                    <span className="chm-room-name">{room.other_nickname}</span>
                                </button>
                            ))
                        )}
                    </aside>

                    {/* 오른쪽: 대화 내용 */}
                    <div className="chm-messages">
                        {!activeRoom ? (
                            <p className="chm-no-room">채팅 상대를 선택해주세요.</p>
                        ) : loadingMsgs ? (
                            <p className="chm-no-room">불러오는 중...</p>
                        ) : messages.length === 0 ? (
                            <p className="chm-no-room">아직 메시지가 없어요.</p>
                        ) : (
                            messages.map(msg => {
                                const isMine = msg.sender_id === myId;
                                return (
                                    <div
                                        key={msg.message_id}
                                        className={`chm-msg-row${isMine ? " mine" : " theirs"}`}
                                    >
                                        {!isMine && (
                                            <img
                                                src={msg.profile_image || "/images/profile.jpg"}
                                                alt=""
                                                className="chm-msg-avatar"
                                                onError={e => { e.target.src = "/images/profile.jpg"; }}
                                            />
                                        )}
                                        <div className="chm-msg-col">
                                            <div className="chm-bubble-row">
                                                {isMine && <span className="chm-time">{formatTime(msg.created_at)}</span>}
                                                <div className={`chm-bubble${isMine ? " mine" : ""}`}>{renderContent(msg.content)}</div>
                                                {!isMine && <span className="chm-time">{formatTime(msg.created_at)}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* 하단 */}
                <div className="chm-footer">
                    {activeRoom && (
                        <button className="chm-del-btn" onClick={handleDelete}>기록 삭제</button>
                    )}
                    <button
                        className="chm-go-btn"
                        onClick={handleGoChat}
                        disabled={!activeRoom}
                    >
                        채팅하러 가기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatHistoryModal;
