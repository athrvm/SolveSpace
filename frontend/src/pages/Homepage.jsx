import useProblemList from '../hooks/useProblemList';
import Pagination from '../components/ui/Pagination';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Circle, Search, ArrowUpRight } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { DifficultyBadge, EmptyState, ErrorState, LoadingState } from '../components/ui/States';
const topicNames = { array: 'Arrays', linkedList: 'Linked lists', graph: 'Graphs', dp: 'Dynamic programming' };
export default function Homepage() {
  const [solved, setSolved] = useState(null);
  const [progressError, setProgressError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ difficulty: 'all', tag: 'all', status: 'all' });
  const list = useProblemList({ search, ...filters });
  const { problems, loading, error, summary } = list;
  useEffect(() => {
    let active = true;
    setProgressError(false);
    axiosClient.get('/problem/problemSolvedByUser').then(({ data }) => { if (active) setSolved(data); }).catch(() => { if (active) { setSolved(null); setProgressError(true); } });
    return () => { active = false; };
  }, [attempt]);
  const solvedIds = new Set((solved || []).map(p => p._id));
  const filtered = problems;
  const update = (key, value) => { setFilters(current => ({ ...current, [key]: value })); list.setPage(1); };
  const clear = () => { setSearch(''); setFilters({ difficulty: 'all', tag: 'all', status: 'all' }); list.setPage(1); };
  return <div className="page-container">
    <div className="page-heading"><div><p className="eyebrow">THE PRACTICE WORKSPACE</p><h1>Problem library</h1><p>Build understanding, one solution at a time.</p></div><span className="quiet-label">Data structures & algorithms</span></div>
    <div className="library-layout"><section className="library-main" aria-label="Problem library">
      <div className="filter-bar"><label className="search-field"><Search size={17} /><input aria-label="Search problems" placeholder="Search problems…" value={search} onChange={e => { setSearch(e.target.value); list.setPage(1); }} /></label>
        <select className="select" aria-label="Difficulty" value={filters.difficulty} onChange={e => update('difficulty', e.target.value)}><option value="all">All difficulties</option>{['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select>
        <select className="select" aria-label="Topic" value={filters.tag} onChange={e => update('tag', e.target.value)}><option value="all">All topics</option>{(summary?.topics || Object.keys(topicNames)).map(tag => <option key={tag} value={tag}>{topicNames[tag] || tag}</option>)}</select>
        <select className="select" aria-label="Completion status" value={filters.status} disabled={!solved} onChange={e => update('status', e.target.value)}><option value="all">All statuses</option><option value="solved">Solved</option><option value="unsolved">Unsolved</option></select>
      </div>
      <div className="list-meta"><span>{loading ? 'Loading library…' : `${filtered.length} of ${list.pagination?.total || 0} matching problems`}</span><button className="text-button" onClick={clear}>Reset filters</button></div>
      {loading ? <LoadingState label="Loading problems…" /> : error ? <ErrorState message={error} onRetry={list.refresh} /> : !filtered.length ? <EmptyState title="No problems found">Try another search or reset your filters.</EmptyState> : <div className="table-scroll"><table className="table problem-table"><thead><tr><th>Status</th><th>Problem</th><th>Difficulty</th><th>Topic</th><th><span className="sr-only">Open problem</span></th></tr></thead><tbody>{filtered.map(p => <tr key={p._id}><td>{solvedIds.has(p._id) ? <CheckCircle2 size={18} className="text-success" aria-label="Solved" /> : <Circle size={17} className="muted" aria-label={solved ? 'Unsolved' : 'Status unavailable'} />}</td><td><Link className="problem-link" to={`/problem/${p._id}`}>{p.title}</Link></td><td><DifficultyBadge difficulty={p.difficulty} /></td><td className="muted">{topicNames[p.tags] || p.tags}</td><td><Link to={`/problem/${p._id}`} aria-label={`Solve ${p.title}`}><ArrowUpRight size={17} /></Link></td></tr>)}</tbody></table></div>}
      <Pagination {...list} />
    </section><aside className="progress-sidebar"><p className="eyebrow">YOUR PRACTICE</p><h2>Progress overview</h2>{progressError || error ? <><p className="muted">Progress is currently unavailable.</p><button className="text-button" onClick={() => { setAttempt(a => a + 1); list.refresh(); }}>Retry</button></> : loading || !solved || !summary ? <LoadingState label="Loading progress…" /> : <><div className="progress-total"><strong>{solved.length}</strong><span>/ {summary?.total || 0} solved</span></div>{['easy', 'medium', 'hard'].map(d => { const total = (summary?.difficulties[d] || 0); const count = solved.filter(p => p.difficulty === d).length; return <div className="difficulty-progress" key={d}><div><span className="capitalize">{d}</span><span>{count}<span className="muted"> / {total}</span></span></div><progress aria-label={`${d} problems solved`} value={count} max={total || 1} /></div>; })}<p className="sidebar-note">Your accepted solutions count towards your progress.</p></>}</aside></div>
  </div>;
}
