import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/Chat.css";

const MAX_FILE_MB = 5;
const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "application/zip",
];

function Chat() {
    const [searchParams] = useSearchParams();
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
    const [activeRoom, setActiveRoom] = useState(null); // { room_id, other_nickname, other_image }
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [fileErr, setFileErr] = useState("");
    // 수정 상태
    const [editingId, setEditingId] = useState(null);   // 수정 중인 message_id
    const [editText, setEditText] = useState("");
    const fileInputRef = useRef(null);
    const lastMsgId = useRef(0);
    const bottomRef = useRef(null);
    const pollRef = useRef(null);
    const sendingRef = useRef(false); // 전송 중 폴링 중복 방지
    const mountedRef = useRef(true); // unmount 후 상태 업데이트 방지

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // 채팅방 목록 불러오기
    const fetchRooms = useCallback(async () => {
        if (!myId) return;
        const res = await fetch(`/api/chat/rooms?user_id=${myId}`).catch(() => null);
        if (!res?.ok) return;
        const data = await res.json();
        setRooms(data.rooms || []);
        return data.rooms || [];
    }, [myId]);

    // 초기 진입 시: URL에 mentoring_id가 있으면 방 생성/입장
    useEffect(() => {
        if (!myId) return;
        let cancelled = false;
        const mId = searchParams.get("mentoring_id");

        fetchRooms().then(async (fetchedRooms) => {
            if (cancelled) return;
            if (mId) {
                // 방 생성 or 기존 방 가져오기
                const res = await fetch("/api/chat/rooms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mentoring_id: Number(mId) }),
                }).catch(() => null);
                if (cancelled) return;
                if (res?.ok) {
                    const data = await res.json();
                    const roomId = data.room_id;
                    // 목록을 다시 가져와서 해당 방을 activeRoom으로 설정
                    const refreshed = await fetch(`/api/chat/rooms?user_id=${myId}`).then(r => r.json()).catch(() => ({ rooms: [] }));
                    if (cancelled) return;
                    const updatedRooms = refreshed.rooms || [];
                    setRooms(updatedRooms);
                    const found = updatedRooms.find(r => r.room_id === roomId);
                    if (found) setActiveRoom(found);
                }
            } else if (fetchedRooms?.length > 0) {
                // 기본으로 첫 번째 방 선택
                setActiveRoom(fetchedRooms[0]);
            }
        });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myId]);

    // 메시지 로드 (폴링)
    const fetchMessages = useCallback(async (roomId, after = 0) => {
        const res = await fetch(`/api/chat/messages?room_id=${roomId}&after=${after}`).catch(() => null);
        if (!res?.ok) return [];
        const data = await res.json();
        return data.messages || [];
    }, []);

    // 방이 바뀔 때 메시지 초기화 + 폴링 시작
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (!activeRoom) return;

        lastMsgId.current = 0;
        setMessages([]);

        fetchMessages(activeRoom.room_id, 0).then((msgs) => {
            setMessages(msgs);
            if (msgs.length > 0) lastMsgId.current = msgs[msgs.length - 1].message_id;
        });

        pollRef.current = setInterval(async () => {
            if (sendingRef.current) return; // 전송 중이면 스킵 (중복 방지)
            const newMsgs = await fetchMessages(activeRoom.room_id, lastMsgId.current);
            if (newMsgs.length > 0) {
                setMessages((prev) => [...prev, ...newMsgs]);
                lastMsgId.current = newMsgs[newMsgs.length - 1].message_id;
            }
        }, 3000);

        return () => clearInterval(pollRef.current);
    }, [activeRoom, fetchMessages]);

    // 새 메시지 오면 스크롤 아래로
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !activeRoom || !myId || sending) return;
        setSending(true);
        sendingRef.current = true;
        const content = input.trim();
        setInput("");
        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ room_id: activeRoom.room_id, sender_id: myId, content }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.message_id) lastMsgId.current = data.message_id; // 폴링 기준점 먼저 업데이트
                const now = new Date().toISOString();
                const tempMsg = {
                    message_id: data.message_id ?? Date.now(),
                    sender_id: myId,
                    content,
                    created_at: now,
                    nickname: me?.nickname || "나",
                    profile_image: me?.profile_image || "/images/profile.jpg",
                };
                setMessages((prev) => [...prev, tempMsg]);
            }
        } catch { /* ignore */ } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !activeRoom || !myId) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setFileErr("지원하지 않는 파일 형식입니다.");
            return;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            setFileErr(`파일 크기는 ${MAX_FILE_MB}MB 이하여야 합니다.`);
            return;
        }
        setFileErr("");
        setSending(true);
        sendingRef.current = true;

        // base64 코딩 인라인 전송
        const reader = new FileReader();
        reader.onload = async (ev) => {
            if (!mountedRef.current) return;
            const dataUrl = ev.target.result;
            const isImage = file.type.startsWith("image/");
            const content = isImage
                ? `[img]${dataUrl}[/img]`
                : `[file name="${file.name}" data="${dataUrl}"][/file]`;

            try {
                const res = await fetch("/api/chat/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ room_id: activeRoom.room_id, sender_id: myId, content }),
                });
                if (mountedRef.current && res.ok) {
                    const data = await res.json();
                    if (data.message_id) lastMsgId.current = data.message_id; // 폴링 기준점 먼저 업데이트
                    const now = new Date().toISOString();
                    setMessages((prev) => [...prev, {
                        message_id: data.message_id ?? Date.now(),
                        sender_id: myId,
                        content,
                        created_at: now,
                        nickname: me?.nickname || "나",
                        profile_image: me?.profile_image || "/images/profile.jpg",
                    }]);
                }
            } catch { /* ignore */ } finally {
                if (mountedRef.current) {
                    sendingRef.current = false;
                    setSending(false);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 메시지 삭제
    const handleDeleteMsg = async (msg) => {
        if (!window.confirm("메시지를 삭제할까요?")) return;
        const res = await fetch("/api/chat/messages", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message_id: msg.message_id, sender_id: myId }),
        }).catch(() => null);
        if (res?.ok) {
            setMessages((prev) => prev.filter((m) => m.message_id !== msg.message_id));
        } else {
            alert("삭제 실패");
        }
    };

    // 메시지 수정 저장
    const handleSaveEdit = async (msg) => {
        const text = editText.trim();
        if (!text || text === msg.content) { setEditingId(null); return; }
        const res = await fetch("/api/chat/messages", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message_id: msg.message_id, sender_id: myId, content: text }),
        }).catch(() => null);
        if (res?.ok) {
            setMessages((prev) =>
                prev.map((m) => m.message_id === msg.message_id ? { ...m, content: text } : m)
            );
            setEditingId(null);
        } else {
            alert("수정 실패");
        }
    };

    const handleLeave = () => navigate(-1);

    const formatTime = (iso) => {
        if (!iso) return "";
        const d = new Date(iso.includes('T') || iso.endsWith('Z') ? iso : iso.replace(' ', 'T') + 'Z');
        return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    };

    const renderContent = (content) => {
        // 시스템 메시지
        const sysMatch = content.match(/^\[system\]([\s\S]+)\[\/system\]$/);
        if (sysMatch) {
            return <span className="chat-system-msg">{sysMatch[1]}</span>;
        }
        const imgMatch = content.match(/^\[img\]([\s\S]+)\[\/img\]$/);
        if (imgMatch) {
            return <img src={imgMatch[1]} alt="첨부 이미지" className="chat-img-preview" />;
        }
        const fileMatch = content.match(/^\[file name="([^"]+)" data="([\s\S]+)"\]\[\/file\]$/);
        if (fileMatch) {
            return (
                <a href={fileMatch[2]} download={fileMatch[1]} className="chat-file-link">
                    📎 {fileMatch[1]}
                </a>
            );
        }
        return content;
    };

    if (!myId) {
        return (
            <div className="chat-login-msg">
                로그인이 필요합니다.
            </div>
        );
    }

    return (
        <div className="chat-page">
            {/* 상단: 사이드바 + 메시지 영역 */}
            <div className="chat-body">
                {/* 왼쪽 사이드바 */}
                <aside className="chat-sidebar">
                    {rooms.length === 0 && (
                        <p className="chat-sidebar-empty">채팅방이 없어요.</p>
                    )}
                    {rooms.map((room) => (
                        <button
                            key={room.room_id}
                            className={`chat-room-item${activeRoom?.room_id === room.room_id ? " active" : ""}${room.is_ended ? " ended" : ""}`}
                            onClick={() => setActiveRoom(room)}
                        >
                            <img
                                src={room.other_image}
                                alt=""
                                className="chat-room-avatar"
                                onError={(e) => { e.target.src = "/images/profile.jpg"; }}
                            />
                            <div className="chat-room-info">
                                <span className="chat-room-name">{room.other_nickname}</span>
                                {room.is_ended && <span className="chat-room-ended">종료</span>}
                            </div>
                        </button>
                    ))}
                </aside>

                {/* 오른쪽: 메시지 목록 */}
                <div className="chat-messages">
                    {!activeRoom ? (
                        <p className="chat-no-room">채팅방을 선택해주세요.</p>
                    ) : messages.length === 0 ? (
                        <p className="chat-no-msg">아직 메시지가 없어요. 먼저 말을 걸어보세요!</p>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.sender_id === myId;
                            const isEditing = editingId === msg.message_id;
                            // 시스템 메시지
                            const isSystem = msg.content?.startsWith("[system]");
                            if (isSystem) {
                                return (
                                    <div key={msg.message_id} className="chat-system-row">
                                        {renderContent(msg.content)}
                                    </div>
                                );
                            }
                            return (
                                <div
                                    key={msg.message_id}
                                    className={`chat-msg-row${isMine ? " mine" : " theirs"}`}
                                >
                                    {!isMine && (
                                        <img
                                            src={msg.profile_image || "/images/profile.jpg"}
                                            alt=""
                                            className="chat-msg-avatar"
                                            onError={(e) => { e.target.src = "/images/profile.jpg"; }}
                                        />
                                    )}
                                    <div className="chat-msg-col">
                                        {!isMine && <span className="chat-msg-name">{msg.nickname}</span>}
                                        <div className="chat-bubble-row">
                                            {isMine && <span className="chat-msg-time">{formatTime(msg.created_at)}</span>}
                                            <div className={`chat-bubble${isMine ? " mine" : ""}`}>
                                                {isEditing ? (
                                                    <div className="chat-edit-wrap">
                                                        <input
                                                            className="chat-edit-input"
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleSaveEdit(msg);
                                                                if (e.key === "Escape") setEditingId(null);
                                                            }}
                                                            autoFocus
                                                        />
                                                        <div className="chat-edit-actions">
                                                            <button type="button" className="chat-edit-save" onClick={() => handleSaveEdit(msg)}>저장</button>
                                                            <button type="button" className="chat-edit-cancel" onClick={() => setEditingId(null)}>취소</button>
                                                        </div>
                                                    </div>
                                                ) : renderContent(msg.content)}
                                            </div>
                                            {!isMine && <span className="chat-msg-time">{formatTime(msg.created_at)}</span>}
                                            {isMine && !isEditing && (
                                                <div className="chat-msg-actions">
                                                    <button type="button" className="chat-action-btn" onClick={() => { setEditingId(msg.message_id); setEditText(msg.content); }}>수정</button>
                                                    <button type="button" className="chat-action-btn del" onClick={() => handleDeleteMsg(msg)}>삭제</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* 하단: 입력 영역 */}
            <div className="chat-footer">
                <button className="chat-leave-btn" type="button" onClick={handleLeave}>
                    채팅 나가기
                </button>
                {activeRoom?.is_ended ? (
                    <div className="chat-ended-notice">🔒 종료된 멘토링입니다. 메시지를 보낼 수 없어요.</div>
                ) : (
                <div className="chat-input-wrap">
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept={ALLOWED_TYPES.join(",")}
                        onChange={handleFileChange}
                    />
                    <button
                        className="chat-attach-btn"
                        type="button"
                        title="파일 첨부"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!activeRoom || sending}
                    >📎</button>
                    <input
                        className="chat-input"
                        type="text"
                        placeholder="메세지를 입력하세요"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!activeRoom || sending}
                    />
                </div>
                )}
            </div>
            {fileErr && <div className="chat-file-err">{fileErr}</div>}
        </div>
    );
}

export default Chat;
