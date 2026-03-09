import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/MainCalenderPreview.css";
import {
  fetchCalendarCategories,
  fetchCalendarEventsByMonth,
} from "../api/calendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYMD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toMonthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addDays(date, diff) {
  const d = new Date(date);
  d.setDate(d.getDate() + diff);
  return d;
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

export default function MainCalenderPreview() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [categories, setCategories] = useState([]);

  const [selectedKey, setSelectedKey] = useState(() => toYMD(new Date()));

  useEffect(() => {
    const load = async () => {
      try {
        const [catData, evtData] = await Promise.all([
          fetchCalendarCategories(),
          fetchCalendarEventsByMonth(toMonthKey(baseMonth)),
        ]);

        const cats = (catData.categories || []).map((c) => ({
          id: c.category_id,
          name: c.name,
          color: c.color_code,
          locked: Boolean(c.locked),
        }));

        setCategories(cats);
        setEventsByDate(buildEventsByDateFromRows(evtData.events || []));
      } catch (e) {
        console.error("메인 캘린더 미리보기 불러오기 실패:", e);
        setCategories([]);
        setEventsByDate({});
      }
    };

    load();
  }, [baseMonth]);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const monthStart = useMemo(() => startOfMonth(baseMonth), [baseMonth]);

  const gridDays = useMemo(() => {
    const firstDayOfWeek = monthStart.getDay();
    const firstGridDay = addDays(monthStart, -firstDayOfWeek);
    return Array.from({ length: 42 }, (_, i) => addDays(firstGridDay, i));
  }, [monthStart]);

  const selectedList = useMemo(() => {
    const arr = Array.isArray(eventsByDate[selectedKey]) ? eventsByDate[selectedKey] : [];
    return arr.slice();
  }, [eventsByDate, selectedKey]);

  const goCalendarPage = () => {
    const m = `${baseMonth.getFullYear()}-${pad2(baseMonth.getMonth() + 1)}`;
    navigate(`/calendar?m=${m}`);
  };

  const monthTitle = `${baseMonth.getFullYear()}년 ${baseMonth.getMonth() + 1}월`;

  return (
    <section className="main-cal-preview-wrap">
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
                  const cat = catById.get(ev.categoryId);
                  return cat?.color || ev.color || "#E5E7EB";
                });

              const visibleBars = bars.slice(0, 3);
              const moreCount = Math.max(0, bars.length - 3);

              const dow = d.getDay();

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

        <aside className="main-cal-right">
          <div className="side-head">
            <div>
              <h4>보조 캘린더</h4>
              <div className="side-picked">선택 날짜: {selectedKey}</div>
            </div>

            <button className="go-btn" type="button" onClick={goCalendarPage}>
              캘린더 열기
            </button>
          </div>

          {selectedList.length === 0 ? (
            <div className="side-empty">이 날짜에 등록된 일정이 없어요.</div>
          ) : (
            <ul className="side-list">
              {selectedList.map((e, idx) => {
                const cat = catById.get(e.categoryId);
                const color = cat?.color || e.color || "#E5E7EB";

                return (
                  <li key={`${selectedKey}-${e.id ?? idx}`} className="side-card">
                    <span className="side-accent" style={{ background: color }} />
                    <div className="side-card-body">
                      <div className="side-card-top">
                        <div className="side-card-title">{e.title || "일정"}</div>
                      </div>
                      <div className="side-card-sub">
                        {e.desc && e.desc.trim() ? e.desc : (cat?.name || e.categoryName || "카테고리")}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="side-foot">* 내 계정 일정 기준</div>
        </aside>
      </div>
    </section>
  );
}