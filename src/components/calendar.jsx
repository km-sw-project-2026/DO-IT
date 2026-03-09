import {
  fetchCalendarCategories,
  createCalendarCategory,
  updateCalendarCategory,
  deleteCalendarCategory,
  fetchCalendarEventsByMonth,
  createCalendarEvent,
  deleteCalendarEvent,
} from "../api/calendar";
import { useEffect, useMemo, useState } from "react";
import "../css/calendar.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// ✅ 기본 카테고리 + 색상 고정 (plan 삭제)
const DEFAULT_CATEGORY_NAMES = ["시험", "수행", "숙제"];

const LS_CAT = "doit_calendar_categories_v1";
const LS_EVT = "doit_calendar_events_v1";

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addMonths(date, diff) {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function keyOfDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function formatHeader(d) {
  const week = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${week}요일`;
}
function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildEventsByDateFromRows(rows = []) {
  const map = {};

  for (const row of rows) {
    const key = row.event_date;
    if (!map[key]) map[key] = [];

    map[key].push({
      id: row.event_id,
      title: row.title,
      desc: row.description || "",
      categoryId: row.category_id,
      categoryName: row.category_name,
      color: row.color_code,
    });
  }

  return map;
}

async function loadCategories() {
  const data = await fetchCalendarCategories();
  const cats = (data.categories || []).map((c) => ({
    id: c.category_id,
    name: c.name,
    color: c.color_code,
    locked: Boolean(c.locked),
  }));

  setCategories(cats);

  if (!selectedCategoryId && cats.length > 0) {
    setSelectedCategoryId(cats[0].id);
  }
}

async function loadMonthEvents(date) {
  const month = toMonthKey(date);
  const data = await fetchCalendarEventsByMonth(month);
  setEventsByDate(buildEventsByDateFromRows(data.events || []));
}

export default function Calendar() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // ✅ 일정 저장: { "YYYY-MM-DD": [ {id, title, desc, categoryId} ] }
  const [eventsByDate, setEventsByDate] = useState({});

  // ✅ 카테고리(커스텀 가능)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // ✅ 팝업 분리
  const [isViewOpen, setIsViewOpen] = useState(false); // 일정 확인(목록)
  const [isAddOpen, setIsAddOpen] = useState(false);   // 일정 추가
  const [isCatAddOpen, setIsCatAddOpen] = useState(false); // 카테고리 + 폼
  const [isCatEditOpen, setIsCatEditOpen] = useState(false); // 카테고리 편집

  // ✅ 일정 입력
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  // ✅ 커스텀 카테고리 입력
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#9CA3AF");

  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(viewDate.getFullYear(), viewDate.getMonth(), 1),
    [viewDate]
  );

  // ✅ 로컬 저장 불러오기 (+ plan이 저장되어 있어도 자동으로 제거)
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadMonthEvents(viewDate);
  }, [viewDate]);

  const gridStart = useMemo(() => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [monthStart]);

  const days = useMemo(() => {
    const list = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      list.push(d);
    }
    return list;
  }, [gridStart]);

  const monthLabel = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth() + 1;
    return `${y}. ${String(m).padStart(2, "0")}`;
  }, [viewDate]);

  const goPrev = () => setViewDate((d) => addMonths(d, -1));
  const goNext = () => setViewDate((d) => addMonths(d, 1));
  const goToday = () => setViewDate(new Date());

  const selectedKey = selectedDate ? keyOfDate(selectedDate) : "";
  const list = selectedKey ? eventsByDate[selectedKey] || [] : [];

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // ✅ 한 번 클릭: 선택만
  const onClickDate = (d) => setSelectedDate(d);

  // ✅ 더블클릭: "일정 확인(목록)" 팝업만 열기
  const onDoubleClickDate = (d) => {
    setSelectedDate(d);
    setIsViewOpen(true);

    // 다른 팝업은 닫기
    setIsAddOpen(false);
    setIsCatAddOpen(false);
    setIsCatEditOpen(false);
  };

  // ✅ 일정 확인 팝업에서 + 누르면 "추가 팝업" 열기
  const openAddPopup = () => {
    setIsAddOpen(true);
    setDraftTitle("");
    setDraftDesc("");
    setSelectedCategoryId("exam");
    setIsCatAddOpen(false);
    setIsCatEditOpen(false);
  };

  const closeAll = () => {
    setIsViewOpen(false);
    setIsAddOpen(false);
    setIsCatAddOpen(false);
    setIsCatEditOpen(false);
  };

  // ✅ 일정 추가
  const addEvent = async () => {
    if (!selectedDate) return;

    const title = draftTitle.trim();
    if (!title) return;
    if (!selectedCategoryId) return;

    await createCalendarEvent({
      event_date: keyOfDate(selectedDate),
      title,
      description: draftDesc,
      category_id: selectedCategoryId,
    });

    await loadMonthEvents(viewDate);

    setDraftTitle("");
    setDraftDesc("");
    setIsAddOpen(false);
    setIsCatAddOpen(false);
    setIsCatEditOpen(false);
  };

  const removeEvent = async (dateKey, id) => {
    await deleteCalendarEvent(id);
    await loadMonthEvents(viewDate);
  };

  // ✅ 커스텀 카테고리 추가
  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;

    await createCalendarCategory({
      name,
      color_code: newCatColor,
    });

    setNewCatName("");
    setNewCatColor("#9CA3AF");

    await loadCategories();
  };

  // ✅ 카테고리 업데이트
  const updateCategory = async (id, patch) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    await updateCalendarCategory(id, {
      name: patch.name ?? target.name,
      color_code: patch.color ?? target.color,
    });

    await loadCategories();
  };

  // ✅ 카테고리 삭제(해당 일정은 exam으로 이동)
  const deleteCategoryHandler = async (id) => {
    await deleteCalendarCategory(id);
    await loadCategories();
    await loadMonthEvents(viewDate);

    if (selectedCategoryId === id) {
      const exam = categories.find((c) => c.name === "시험");
      if (exam) setSelectedCategoryId(exam.id);
    }
  };

  return (
    <div className="cal-wrap">
      <div className="cal-card">
        <div className="cal-head">
          <div className="cal-title">
            <span className="cal-title-big">{monthLabel}</span>
            <span className="cal-title-sub">월간 캘린더</span>
          </div>

          <div className="cal-actions">
            <button className="cal-btn ghost" onClick={goToday} type="button">
              오늘
            </button>
            <div className="cal-nav">
              <button className="cal-btn icon" onClick={goPrev} type="button" aria-label="이전 달">
                ‹
              </button>
              <button className="cal-btn icon" onClick={goNext} type="button" aria-label="다음 달">
                ›
              </button>
            </div>
          </div>
        </div>

        <div className="cal-weekdays">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`cal-weekday ${i === 0 ? "sun" : ""} ${i === 6 ? "sat" : ""}`}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="cal-grid">
          {days.map((d) => {
            const inMonth = d.getMonth() === viewDate.getMonth();
            const isToday = isSameDay(d, today);
            const isSelected = selectedDate && isSameDay(d, selectedDate);
            const dow = d.getDay();

            const dateKey = keyOfDate(d);
            const items = eventsByDate[dateKey] || [];

            // ✅ 오름차순(먼저 추가한 것 -> 위)
            const bars = items
              .slice()
              .reverse()
              .map((ev) => {
                const cat = catById.get(ev.categoryId) || catById.get("exam"); // ✅ plan 제거
                return cat?.color || "#E5E7EB";
              });

            const visibleBars = bars.slice(0, 3);
            const moreCount = Math.max(0, bars.length - 3);

            return (
              <button
                key={d.toISOString()}
                type="button"
                className={[
                  "cal-cell",
                  inMonth ? "in" : "out",
                  isToday ? "today" : "",
                  isSelected ? "selected" : "",
                  dow === 0 ? "sun" : "",
                  dow === 6 ? "sat" : "",
                ].join(" ")}
                onClick={() => onClickDate(d)}
                onDoubleClick={() => onDoubleClickDate(d)}
                title="더블클릭: 일정 확인"
              >
                <div className="cal-date">{d.getDate()}</div>

                {bars.length > 0 && (
                  <div className="cal-bars top">
                    {visibleBars.map((color, idx) => (
                      <span
                        key={`${dateKey}-${idx}`}
                        className="cal-bar"
                        style={{ background: color }}
                      />
                    ))}
                    {moreCount > 0 && <span className="cal-more">+{moreCount}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="cal-footer">
          <span className="hint">한 번 클릭: 선택 / 두 번 클릭: 일정 확인</span>
          {selectedDate && <span className="selected-text">선택됨: {selectedKey}</span>}
        </div>
      </div>

      {/* ✅ 1) 일정 확인 팝업(목록만) */}
      {isViewOpen && selectedDate && (
        <div className="cal-modal-back" onMouseDown={closeAll}>
          <div className="cal-modal view-ui" onMouseDown={(e) => e.stopPropagation()}>
            <div className="view-head">
              <div className="view-title">
                {formatHeader(selectedDate)} <span className="view-sub">할 일</span>
              </div>
              <button className="view-close" type="button" onClick={closeAll}>
                ×
              </button>
            </div>

            <div className="view-line" />

            <div className="view-list">
              {list.map((ev) => {
                const cat = catById.get(ev.categoryId) || catById.get("exam"); // ✅ plan 제거
                return (
                  <div key={ev.id} className="event-card">
                    <div className="event-bar" style={{ background: cat?.color }} />
                    <div className="event-body">
                      <div className="event-top">
                        <div className="event-title">{ev.title}</div>
                        <button
                          className="event-del"
                          type="button"
                          onClick={() => removeEvent(selectedKey, ev.id)}
                          aria-label="삭제"
                        >
                          ×
                        </button>
                      </div>
                      {ev.desc ? <div className="event-desc">{ev.desc}</div> : null}
                    </div>
                  </div>
                );
              })}
              {list.length === 0 && <div className="event-empty">등록된 일정이 없어요.</div>}
            </div>

            <button className="fab-plus" type="button" onClick={openAddPopup} aria-label="일정 추가">
              +
            </button>
          </div>
        </div>
      )}

      {/* ✅ 2) 일정 추가 팝업(추가만) */}
      {isAddOpen && selectedDate && (
        <div className="cal-modal-back" onMouseDown={() => setIsAddOpen(false)}>
          <div className="cal-modal add-ui" onMouseDown={(e) => e.stopPropagation()}>
            <div className="add-head">
              <div className="add-title">{formatHeader(selectedDate)}</div>
              <button className="add-close" type="button" onClick={() => setIsAddOpen(false)}>
                ×
              </button>
            </div>

            <div className="add-line" />

            <input
              className="add-input"
              placeholder="할 일을 입력해주세요"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
            <input
              className="add-input sub"
              placeholder="(선택) 세부 내용"
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
            />

            {/* ✅ 카테고리 칩: plan이 로컬에 남아있어도 안 보이게 필터 */}
            <div className="cat-row">
              {categories
                .filter((c) => c.id !== "plan")
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`cat-chip ${selectedCategoryId === c.id ? "active" : ""}`}
                    onClick={() => setSelectedCategoryId(c.id)}
                    style={
                      selectedCategoryId === c.id
                        ? { background: c.color, color: "#fff" }
                        : { background: "#E5E7EB", color: "#111827" }
                    }
                  >
                    {c.name}
                  </button>
                ))}

              <button className="cat-chip plus" type="button" onClick={() => setIsCatAddOpen((v) => !v)}>
                +
              </button>

              <button className="cat-chip edit" type="button" onClick={() => setIsCatEditOpen((v) => !v)}>
                편집
              </button>
            </div>

            {/* + 카테고리 추가 */}
            {isCatAddOpen && (
              <div className="cat-add-box">
                <input
                  className="cat-add-name"
                  placeholder="카테고리 이름"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <div className="cat-add-color">
                  <span>색상</span>
                  <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} />
                </div>
                <button className="cat-add-btn" type="button" onClick={addCategory}>
                  추가
                </button>
              </div>
            )}

            {/* 카테고리 편집 */}
            {isCatEditOpen && (
              <div className="cat-edit-box">
                {categories
                  .filter((c) => c.id !== "plan")
                  .map((c) => (
                    <div key={c.id} className="cat-edit-row">
                      <input
                        className="cat-edit-name"
                        value={c.name}
                        disabled={c.locked}
                        onChange={(e) => updateCategory(c.id, { name: e.target.value })}
                      />
                      <input
                        type="color"
                        value={c.color}
                        disabled={c.locked}
                        onChange={(e) => updateCategory(c.id, { color: e.target.value })}
                      />
                      <button
                        className="cat-del-btn"
                        type="button"
                        disabled={c.locked}
                        onClick={() => deleteCategoryHandler(c.id)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                <div className="cat-edit-help">기본 카테고리는 삭제/수정이 잠겨있어요.</div>
              </div>
            )}

            <div className="add-foot">
              <button className="add-confirm" type="button" onClick={addEvent}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}