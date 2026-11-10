export function draftKey(userId, problemId, language) {
  return `codepath:draft:v1:${encodeURIComponent(userId)}:${encodeURIComponent(problemId)}:${language}`;
}
export function readDraft(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { code: fallback, status: 'Drafts save on this browser' };
    const draft = JSON.parse(raw);
    if (draft.version !== 1 || typeof draft.code !== 'string') throw new Error('Invalid draft');
    return { code: draft.code, status: 'Draft restored' };
  } catch {
    return { code: fallback, status: 'Draft could not be restored' };
  }
}
export function saveDraft(storage, key, code) {
  try {
    storage.setItem(key, JSON.stringify({ version: 1, code, savedAt: Date.now() }));
    return 'Draft saved on this browser';
  } catch {
    return 'Draft not saved — browser storage unavailable';
  }
}
