import { useState, useEffect, useCallback, useRef } from "react";
import type { MediaEntry } from "../media-store-types";

const DB_NAME = "ntsc-camera-roll";
const DB_VERSION = 1;
const STORE_NAME = "captures";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-timestamp", "timestamp");
        store.createIndex("by-type", "type");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllEntries(db: IDBDatabase): Promise<MediaEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index("by-timestamp");
    const req = idx.openCursor(null, "prev"); // newest first
    const results: MediaEntry[] = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push(cursor.value as MediaEntry);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export function useMediaStore() {
  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const dbRef = useRef<IDBDatabase | null>(null);

  const refresh = useCallback(async () => {
    const db = dbRef.current ?? await openDB();
    dbRef.current = db;
    const all = await getAllEntries(db);
    setEntries(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(async (entry: MediaEntry) => {
    const db = dbRef.current ?? await openDB();
    dbRef.current = db;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await refresh();
  }, [refresh]);

  const deleteEntry = useCallback(async (id: string) => {
    const db = dbRef.current ?? await openDB();
    dbRef.current = db;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await refresh();
  }, [refresh]);

  const latestThumbnail = entries.length > 0 ? entries[0].thumbnail : null;
  const latestId = entries.length > 0 ? entries[0].id : null;

  return {
    entries,
    count: entries.length,
    latestThumbnail,
    latestId,
    addEntry,
    deleteEntry,
    refresh,
  };
}
