import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import axiosClient from '../utils/axiosClient';
import { DifficultyBadge, EmptyState, ErrorState, LoadingState } from '../components/ui/States';

export default function Bookmarks() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [removing, setRemoving] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    axiosClient.get('/bookmarks', { params: { page, limit } }).then(({ data }) => {
      if (!active) return;
      if (page > Math.max(1, data.pagination.totalPages)) { setPage(Math.max(1, data.pagination.totalPages)); return; }
      setData(data);
    }).catch(() => { if (active) setError('Your bookmarks could not be loaded.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, limit, attempt]);
  const remove = async id => {
    setRemoving(id); setActionError('');
    try { await axiosClient.delete(`/bookmarks/${id}`); setAttempt(value => value + 1); }
    catch { setActionError('Could not remove bookmark. Please try again.'); }
    finally { setRemoving(null); }
  };
  return <div className="page-container"><div className="page-heading"><div><p className="eyebrow">YOUR PRACTICE</p><h1>Bookmarks</h1><p>Problems saved for your next practice session.</p></div><label>Per page <select className="select w-auto" value={limit} disabled={loading} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>{[10, 20, 50].map(size => <option key={size}>{size}</option>)}</select></label></div>
    {actionError && <p className="alert alert-error mb-4" role="alert">{actionError}</p>}
    {loading ? <LoadingState label="Loading bookmarks…" /> : error ? <ErrorState message={error} onRetry={() => setAttempt(value => value + 1)} /> : !data?.bookmarks.length ? <EmptyState title="No bookmarks yet">Open a problem and select Bookmark to save it. <Link className="text-button" to="/">Browse problems</Link></EmptyState> : <><div className="table-scroll"><table className="table"><thead><tr><th>Problem</th><th>Difficulty</th><th>Topic</th><th>Action</th></tr></thead><tbody>{data.bookmarks.map(({ _id, problem }) => <tr key={_id}><td><Link className="problem-link" to={`/problem/${problem._id}`}>{problem.title}</Link></td><td><DifficultyBadge difficulty={problem.difficulty} /></td><td>{problem.tags}</td><td><button className="btn btn-sm btn-ghost" disabled={removing !== null} onClick={() => remove(problem._id)} aria-label={`Remove bookmark for ${problem.title}`}>{removing === problem._id ? 'Removing…' : 'Remove'}</button></td></tr>)}</tbody></table></div><nav className="flex flex-wrap items-center justify-between gap-4 mt-6" aria-label="Bookmark pagination"><button className="btn btn-outline" disabled={!data.pagination.hasPreviousPage || removing !== null} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {data.pagination.totalPages} · {data.pagination.total} bookmarks</span><button className="btn btn-outline" disabled={!data.pagination.hasNextPage || removing !== null} onClick={() => setPage(value => value + 1)}>Next</button></nav></>}
  </div>;
}
