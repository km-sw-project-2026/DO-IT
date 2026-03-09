import { getCurrentUser } from "../utils/auth";

function getHeaders() {
  const me = getCurrentUser();
  return {
    "Content-Type": "application/json",
    "x-user-id": String(me?.user_id || me?.id || ""),
  };
}

async function handleRes(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "요청 실패");
  }
  return data;
}

export async function fetchCalendarCategories() {
  const res = await fetch("/api/calendar/categories", {
    method: "GET",
    headers: getHeaders(),
  });
  return handleRes(res);
}

export async function createCalendarCategory(payload) {
  const res = await fetch("/api/calendar/categories", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function updateCalendarCategory(categoryId, payload) {
  const res = await fetch(`/api/calendar/categories/${categoryId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function deleteCalendarCategory(categoryId) {
  const res = await fetch(`/api/calendar/categories/${categoryId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleRes(res);
}

export async function fetchCalendarEventsByMonth(month) {
  const res = await fetch(`/api/calendar/events?month=${month}`, {
    method: "GET",
    headers: getHeaders(),
  });
  return handleRes(res);
}

export async function createCalendarEvent(payload) {
  const res = await fetch("/api/calendar/events", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function deleteCalendarEvent(eventId) {
  const res = await fetch(`/api/calendar/events/${eventId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleRes(res);
}