import React from "react";

function MypageRepositoryFolderItem({
  folder,
  folders,
  level = 0,
  selectedFolderId,
  onToggle,
  onSelect,
}) {
  const children = folders.filter(
    (item) => item.parentId === folder.id && !item.isDeleted
  );

  const isSelected = selectedFolderId === folder.id;

  return (
    <li>
      <div
        className={`mr-folder-row ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${level * 18}px` }}
      >
        <button
          type="button"
          className="mr-folder-toggle"
          onClick={() => onToggle(folder.id)}
        >
          <img
            className={`mr-arrow ${folder.isOpen ? "open" : ""}`}
            src="/images/icon/aroow.png"
            alt=""
          />
        </button>

        <button
          type="button"
          className="mr-folder-name"
          onClick={() => onSelect(folder.id)}
        >
          {folder.name}
        </button>
      </div>

      {folder.isOpen && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <MypageRepositoryFolderItem
              key={child.id}
              folder={child}
              folders={folders}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default MypageRepositoryFolderItem;