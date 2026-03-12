import { Link } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import "../css/Mypagedata.css";
import { getCurrentUser } from "../utils/auth";
import { apiGetFiles, apiGetFolders, apiGetNotes } from "../api/repository";
import { clearRecentOpenedDoc, getRecentOpenedDoc } from "../utils/repositoryRecentOpened";
import { clearRecentCreatedDoc, getRecentCreatedDoc } from "../utils/repositoryRecentCreated";
import { getRepositoryTimestamp } from "../utils/repositoryDate";

function buildSummaryItems({ recentCreatedDoc, recentOpenedDoc, folders, docs }) {
  const items = [];
  const seenIds = new Set();
  const docIds = new Set(docs.map((doc) => String(doc.id)));

  if (recentCreatedDoc?.id && docIds.has(String(recentCreatedDoc.id))) {
    items.push({
      id: `created-${recentCreatedDoc.id}`,
      title: recentCreatedDoc.title || "제목 없음",
      badge: "신규",
    });
    seenIds.add(String(recentCreatedDoc.id));
  }

  if (
    recentOpenedDoc?.id &&
    docIds.has(String(recentOpenedDoc.id)) &&
    !seenIds.has(String(recentOpenedDoc.id))
  ) {
    items.push({
      id: `opened-${recentOpenedDoc.id}`,
      title: recentOpenedDoc.title || "제목 없음",
      badge: "최근",
    });
    seenIds.add(String(recentOpenedDoc.id));
  }

  folders.forEach((folder) => {
    if (items.length >= 4) return;
    items.push({
      id: `folder-${folder.id}`,
      title: folder.name || "폴더",
      badge: "",
    });
  });

  docs.forEach((doc) => {
    if (items.length >= 4) return;
    if (seenIds.has(String(doc.id))) return;

    items.push({
      id: `doc-${doc.id}`,
      title: doc.title || "제목 없음",
      badge: "",
    });
  });

  return items.slice(0, 4);
}

export default function MypageRepositorySummary() {
  const me = getCurrentUser();
  const userId = me?.user_id;
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [recentOpenedDoc, setRecentOpenedDocState] = useState(() => getRecentOpenedDoc());
  const [recentCreatedDoc, setRecentCreatedDocState] = useState(() => getRecentCreatedDoc());

  useEffect(() => {
    if (!userId) {
      setFolders([]);
      setDocs([]);
      return;
    }

    async function loadData() {
      try {
        const [foldersRes, filesRes, notesRes] = await Promise.all([
          apiGetFolders(userId, null),
          apiGetFiles(userId, null),
          apiGetNotes(userId, null),
        ]);

        setFolders(
          (foldersRes.folders || [])
            .filter((folder) => folder.parent_id === null)
            .slice(0, 4)
            .map((folder) => ({
              id: folder.folder_id,
              name: folder.folder_name,
            }))
        );

        const noteDocs = (notesRes || []).map((note) => ({
          id: note.note_id,
          title: note.title || "제목 없음",
          updatedAt: note.updated_at || note.created_at,
        }));

        const fileDocs = (filesRes.files || []).map((file) => ({
          id: `file-${file.my_file_id}`,
          title: file.display_name || file.origin_name,
          updatedAt: file.added_at || file.uploaded_at,
        }));

        setDocs(
          [...noteDocs, ...fileDocs]
            .sort(
              (a, b) =>
                getRepositoryTimestamp(b.updatedAt) - getRepositoryTimestamp(a.updatedAt)
            )
            .slice(0, 4)
        );
      } catch (e) {
        console.warn("Failed to load mypage repository summary:", e);
      }
    }

    loadData();
  }, [userId]);

  useEffect(() => {
    const onStorage = () => {
      setRecentOpenedDocState(getRecentOpenedDoc());
      setRecentCreatedDocState(getRecentCreatedDoc());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const items = useMemo(
    () => buildSummaryItems({ recentCreatedDoc, recentOpenedDoc, folders, docs }),
    [docs, folders, recentCreatedDoc, recentOpenedDoc]
  );

  useEffect(() => {
    const docIds = new Set(docs.map((doc) => String(doc.id)));

    if (recentCreatedDoc?.id && !docIds.has(String(recentCreatedDoc.id))) {
      clearRecentCreatedDoc();
      setRecentCreatedDocState(null);
    }

    if (recentOpenedDoc?.id && !docIds.has(String(recentOpenedDoc.id))) {
      clearRecentOpenedDoc();
      setRecentOpenedDocState(null);
    }
  }, [docs, recentCreatedDoc, recentOpenedDoc]);

  return (
    <Link to="/mypagerepository" className="mypage-data-link">
      <div className="mypage-data-box">
        <div className="mypage-data-contents">
          <div className="mypage-data-title">
            <h2>자료함</h2>
          </div>
          <div className="mypage-data-main">
            {items.length === 0 ? (
              <div className="folder-name folder-name-empty">
                <p>자료가 없습니다.</p>
              </div>
            ) : (
              items.map((item) => (
                <div className="folder-name" key={item.id}>
                  <p>{item.title}</p>
                  {item.badge ? (
                    <span className={`folder-name-badge ${item.badge === "신규" ? "is-new" : "is-recent"}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
