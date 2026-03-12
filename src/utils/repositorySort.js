import { getRepositoryTimestamp } from "./repositoryDate";

function getName(item, fallbackField = "title") {
  return String(item?.[fallbackField] || item?.name || item?.title || "").trim();
}

function compareNames(a, b, fallbackField = "title") {
  return getName(a, fallbackField).localeCompare(getName(b, fallbackField), "ko");
}

function compareDates(a, b, dateField = "updatedAt") {
  return getRepositoryTimestamp(a?.[dateField] || a?.createdAt) - getRepositoryTimestamp(b?.[dateField] || b?.createdAt);
}

export function sortRepositoryItems(items, sortKey, options = {}) {
  const { nameField = "title", dateField = "updatedAt" } = options;
  const list = [...items];

  switch (sortKey) {
    case "oldest":
      return list.sort((a, b) => compareDates(a, b, dateField));
    case "name_asc":
      return list.sort((a, b) => compareNames(a, b, nameField));
    case "name_desc":
      return list.sort((a, b) => compareNames(b, a, nameField));
    case "latest":
    default:
      return list.sort((a, b) => compareDates(b, a, dateField));
  }
}
