function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      const utcDate = new Date(trimmed.replace(" ", "T") + "Z");
      return Number.isNaN(utcDate.getTime()) ? null : utcDate;
    }

    const parsedDate = new Date(trimmed);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function getRepositoryTimestamp(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}

function formatParts(value) {
  const date = toDate(value);
  if (!date) return null;

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value || "";

  return {
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function formatRepositoryDate(value) {
  const parts = formatParts(value);
  if (!parts) return "-";
  return `${parts.month}월 ${parts.day}일 ${parts.hour}:${parts.minute}`;
}

export function formatRepositoryDateShort(value) {
  const parts = formatParts(value);
  if (!parts) return "-";
  return `${parts.month}월 ${parts.day}일`;
}

export function formatRepositoryDateTime(value) {
  const date = toDate(value);
  if (!date) return "기록 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
