import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

export default function BookmarkButton({ problemId }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [known, setKnown] = useState(false);
  useEffect(() => {
    let active = true;
    setBusy(true); setKnown(false); setError('');
    axiosClient.get('/bookmarks', { params: { problemId, limit: 1 } }).then(({ data }) => {
      if (active) { setSaved(data.bookmarks.length > 0); setKnown(true); }
    }).catch(() => { if (active) setError('Could not check bookmark.'); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [problemId, attempt]);
  const toggle = async () => {
    if (!known) { setAttempt(value => value + 1); return; }
    setBusy(true); setError('');
    try {
      if (saved) await axiosClient.delete(`/bookmarks/${problemId}`);
      else await axiosClient.post(`/bookmarks/${problemId}`);
      setSaved(!saved);
    } catch { setError('Could not update bookmark. Please try again.'); }
    finally { setBusy(false); }
  };
  return <div><button className="btn btn-sm btn-ghost" onClick={toggle} disabled={busy} aria-pressed={known ? saved : undefined}><Bookmark size={16} fill={saved && known ? 'currentColor' : 'none'} />{busy ? 'Loading…' : !known ? 'Retry bookmark' : saved ? 'Bookmarked' : 'Bookmark'}</button>{error && <p role="alert" className="text-error text-xs">{error}</p>}</div>;
}
