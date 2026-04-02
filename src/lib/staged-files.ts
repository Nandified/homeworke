// Minimal IndexedDB helper for passing a file between pages (dashboard -> express estimate).
// This avoids putting large files into query params/localStorage.

export type StagedFileRow = {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: number;
};

const DB_NAME = "hw_staged_files_v1";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function randomId(prefix: string) {
  const anyCrypto = globalThis.crypto as Crypto | undefined;
  const id = anyCrypto?.randomUUID ? anyCrypto.randomUUID() : Math.random().toString(16).slice(2);
  return `${prefix}_${id}`;
}

export async function stageFile(file: File): Promise<string> {
  const db = await openDb();
  const id = randomId("stg");
  const row: StagedFileRow = {
    id,
    name: file.name,
    type: file.type || "application/octet-stream",
    blob: file,
    createdAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(row);
  });

  // Best-effort cleanup of older rows.
  void cleanupStagedFiles(12);
  return id;
}

export async function stageFiles(files: File[]): Promise<string[]> {
  const out: string[] = [];
  for (const f of files || []) {
    if (!(f instanceof File)) continue;
    out.push(await stageFile(f));
  }
  return out;
}

export async function getStagedFile(id: string): Promise<File | null> {
  const db = await openDb();
  const row = await new Promise<StagedFileRow | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as StagedFileRow | undefined);
    req.onerror = () => reject(req.error);
  });
  if (!row) return null;
  return new File([row.blob], row.name, { type: row.type });
}

export async function getStagedFiles(ids: string[]): Promise<File[]> {
  const out: File[] = [];
  for (const id of ids || []) {
    const f = await getStagedFile(id);
    if (f) out.push(f);
  }
  return out;
}

export async function deleteStagedFile(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).delete(id);
  });
}

export async function cleanupStagedFiles(maxAgeHours = 12): Promise<void> {
  const db = await openDb();
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result as IDBCursorWithValue | null;
      if (!cursor) return;
      const v = cursor.value as StagedFileRow;
      if (v?.createdAt && v.createdAt < cutoff) {
        cursor.delete();
      }
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}
