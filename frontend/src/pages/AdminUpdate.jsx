import useProblemList from '../hooks/useProblemList';
import Pagination from '../components/ui/Pagination';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import axiosClient from '../utils/axiosClient';
import AdminPanel from '../components/AdminPanel';
import { DifficultyBadge, EmptyState, ErrorState, LoadingState } from '../components/ui/States';

export default function AdminUpdate() {
  const { problemId } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const list = useProblemList({ search, enabled: !problemId });

  useEffect(() => {
    if (!problemId) return;
    let active = true;
    setLoading(true);
    setError('');
    setResource(null);
    const url = `/problem/problemById/${problemId}`;
    axiosClient.get(url).then(({ data }) => {
      if (active) setResource({ id: problemId, data });
    }).catch(error => {
      if (!active) return;
      if (!problemId && error.response?.status === 404) setResource({ data: [] });
      else setError(problemId ? 'This problem could not be loaded. Try again or return to the problem list.' : 'The problem list could not be loaded. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [problemId, attempt]);

  if (problemId && loading) return <LoadingState label={problemId ? 'Loading problem details…' : 'Loading problems…'} />;
  if (problemId && error) return <><ErrorState message={error} onRetry={() => setAttempt(value => value + 1)} /><div className="text-center"><Link className="text-button" to="/admin/update">Back to problems</Link></div></>;
  if (problemId && (!resource || resource.id !== problemId)) return <LoadingState label="Loading problem details…" />;
  if (problemId) return <AdminPanel key={problemId} problemId={problemId} initialProblem={resource.data} />;

  const { problems } = list;
  return <div className="page-container">
    <div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Update problems</h1><p>Choose a problem to edit its details, examples and code.</p></div></div>
    <label className="form-control mb-6 max-w-md"><span className="label">Search problems</span><input className="input w-full" value={search} onChange={event => { setSearch(event.target.value); list.setPage(1); }} placeholder="Search by title…" /></label>
    {list.loading ? <LoadingState label="Loading problems…" /> : list.error ? <ErrorState message={list.error} onRetry={list.refresh} /> : !problems.length ? <EmptyState title="No problems found">{search ? 'Try a different search.' : 'Create a problem before editing it.'}</EmptyState> : <div className="table-scroll"><table className="table"><thead><tr><th>Problem</th><th>Difficulty</th><th>Topic</th><th>Action</th></tr></thead><tbody>{problems.map(problem => <tr key={problem._id}><td><Link className="problem-link" to={`/admin/update/${problem._id}`}>{problem.title}</Link></td><td><DifficultyBadge difficulty={problem.difficulty} /></td><td>{problem.tags}</td><td><Link className="btn btn-sm btn-outline" to={`/admin/update/${problem._id}`} aria-label={`Edit ${problem.title}`}>Edit</Link></td></tr>)}</tbody></table></div>}
    <Pagination {...list} />
  </div>;
}
