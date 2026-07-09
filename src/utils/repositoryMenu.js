export function getRepositoryMenuButtonClass(btn, pathname) {
  const currentPath = (pathname || "").toLowerCase();
  const targetPath = (btn.to || "").toLowerCase();
  const baseClass = `mypagerepository-${btn.class}`;

  const isActive =
    (targetPath === "/bookmark" && currentPath === "/bookmark") ||
    (targetPath === "/mypagerepositorydelete" &&
      (currentPath === "/mypagerepositorydelete" ||
        currentPath === "/repository/trash" ||
        currentPath.startsWith("/repository/trash/"))) ||
    (targetPath === "/mypagerepository" &&
      (currentPath === "/mypagerepository" ||
        currentPath === "/repository" ||
        currentPath === "/mypage/repository" ||
        currentPath.startsWith("/repository/folder/")));

  return isActive ? `${baseClass} is-active` : baseClass;
}
