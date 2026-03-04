import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/MainCalenderPreview.css";

const LS_EVT = "doit_calendar_events_v1";
const LS_CAT = "doit_calendar_categories_v1";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const DEFAULT_CATEGORIES = [
  { id: "exam", name: "시험", color: "#FFD047", locked: true },
  { id: "perf", name: "수행", color: "#72CAB5", locked: true },
  { id: "home", name: "숙제", color: "#C799FF", locked: true },
];

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYMD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addDays(date, diff) {
  const d = new Date(date);
  d.setDate(d.getDate() + diff);
  return d;
}
function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export default function MainCalenderPreview() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ URL ?m=YYYY-MM 로 월 연동
  const baseMonth = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const m = params.get("m");
    if (m && /^\d{4}-\d{2}$/.test(m)) {
      const [yy, mm] = m.split("-").map(Number);
      return new Date(yy, mm - 1, 1);
    }
    return new Date();
  }, [location.search]);

  const [eventsByDate, setEventsByDate] = useState({});
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // ✅ 선택된 날짜(오른쪽 보조캘린더 필터용)
  const [selectedKey, setSelectedKey] = useState(() => toYMD(new Date()));

  useEffect(() => {
    const load = () => {
      const savedEvts = safeParse(localStorage.getItem(LS_EVT), {});
      setEventsByDate(savedEvts && typeof savedEvts === "object" ? savedEvts : {});

      const savedCats = safeParse(localStorage.getItem(LS_CAT), null);
      if (Array.isArray(savedCats) && savedCats.length) {
        const filtered = savedCats.filter((c) => c.id !== "plan");
        const map = new Map(filtered.map((c) => [c.id, c]));
        DEFAULT_CATEGORIES.forEach((dc) => {
          if (!map.has(dc.id)) map.set(dc.id, dc);
        });
        setCategories(Array.from(map.values()));
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    };

    load();

    const onStorage = (e) => {
      if (e.key === LS_EVT || e.key === LS_CAT) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const monthStart = useMemo(() => startOfMonth(baseMonth), [baseMonth]);

  const gridDays = useMemo(() => {
    const firstDayOfWeek = monthStart.getDay();
    const firstGridDay = addDays(monthStart, -firstDayOfWeek);
    return Array.from({ length: 42 }, (_, i) => addDays(firstGridDay, i));
  }, [monthStart]);

  // ✅ 오른쪽: 선택된 날짜의 일정만
  const selectedList = useMemo(() => {
    const arr = Array.isArray(eventsByDate[selectedKey]) ? eventsByDate[selectedKey] : [];
    // 캘린더 페이지랑 같은 느낌으로(최신이 위)
    return arr.slice(); // 필요하면 reverse 등 적용 가능
  }, [eventsByDate, selectedKey]);

  // ✅ 버튼으로만 이동 (캘린더 카드 클릭 이동 제거)
  const goCalendarPage = () => {
    const m = `${baseMonth.getFullYear()}-${pad2(baseMonth.getMonth() + 1)}`;
    navigate(`/calendar?m=${m}`);
  };

  const monthTitle = `${baseMonth.getFullYear()}년 ${baseMonth.getMonth() + 1}월`;

  return (
    <section className="main-cal-preview-wrap">
      {/* ✅ 더이상 전체 클릭 이동 없음 */}
      <div className="main-cal-preview">
        <div className="main-cal-left">
          <div className="main-cal-header">
            <h3 className="main-cal-title">{monthTitle}</h3>
            <div className="main-cal-hint">날짜를 누르면 오른쪽에 일정이 떠요</div>
          </div>

          <div className="main-cal-weekdays">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`main-cal-weekday ${i === 0 ? "sun" : ""} ${i === 6 ? "sat" : ""}`}
              >
                {w}
              </div>
            ))}
          </div>

          <div className="main-cal-grid">
            {gridDays.map((d) => {
              const ymd = toYMD(d);
              const inMonth = d.getMonth() === baseMonth.getMonth();

              const today = new Date();
              const isToday =
                d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate();

              const isSelected = selectedKey === ymd;

              const items = Array.isArray(eventsByDate[ymd]) ? eventsByDate[ymd] : [];
              const bars = items
                .slice()
                .reverse()
                .map((ev) => {
                  const cat = catById.get(ev.categoryId) || catById.get("exam");
                  return cat?.color || "#E5E7EB";
                });

              const visibleBars = bars.slice(0, 3);
              const moreCount = Math.max(0, bars.length - 3);

              const dow = d.getDay(); // 0=일, 6=토

              return (
                <button
                  key={ymd}
                  type="button"
                  className={[
                    "main-cal-cell",
                    inMonth ? "" : "is-out",
                    isToday ? "is-today" : "",
                    isSelected ? "is-selected" : "",
                    dow === 0 ? "is-sun" : "",
                    dow === 6 ? "is-sat" : "",
                  ].join(" ")}
                  onClick={() => setSelectedKey(ymd)}
                >
                  <div className="main-cal-daynum">{d.getDate()}</div>

                  {bars.length > 0 && (
                    <div className="main-cal-bars">
                      {visibleBars.map((color, idx) => (
                        <span
                          key={`${ymd}-${idx}`}
                          className="main-cal-bar"
                          style={{ background: color }}
                        />
                      ))}
                      {moreCount > 0 && <span className="main-cal-more">+{moreCount}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ✅ 보조 캘린더: 선택된 날짜 일정만 */}
        <aside className="main-cal-right">
          <div className="side-head">
            <div>
              <h4>보조 캘린더</h4>
              <div className="side-picked">선택 날짜: {selectedKey}</div>
            </div>

            {/* ✅ 버튼 눌렀을 때만 이동 */}
            <button className="go-btn" type="button" onClick={goCalendarPage}>
              캘린더 열기
            </button>
          </div>

          {selectedList.length === 0 ? (
            <div className="side-empty">이 날짜에 등록된 일정이 없어요.</div>
          ) : (
            <ul className="side-list">
              {selectedList.map((e, idx) => {
                const cat = catById.get(e.categoryId) || catById.get("exam");
                const color = cat?.color || "#E5E7EB";

                return (
                  <li key={`${selectedKey}-${e.id ?? idx}`} className="side-card">
                    <span className="side-accent" style={{ background: color }} />
                    <div className="side-card-body">
                      <div className="side-card-top">
                        <div className="side-card-title">{e.title || "일정"}</div>
                      </div>
                      <div className="side-card-sub">
                        {e.desc && e.desc.trim() ? e.desc : (cat?.name || "카테고리")}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="side-foot">* 일정은 로컬스토리지 기준</div>
        </aside>
      </div>
    </section>
  );
}