import { useState } from 'react';
import useProblemList from '../hooks/useProblemList';
import Pagination from './ui/Pagination';
import { ErrorState, EmptyState } from './ui/States';
import axiosClient from '../utils/axiosClient'

const AdminDelete = () => {
  const list = useProblemList();
  const { problems, loading } = list;
  const [actionError, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const error = actionError || list.error;
  const fetchProblems = () => { setError(''); list.refresh(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) return;
    
    setBusy(true);
    try {
      await axiosClient.delete(`/problem/delete/${id}`);
      list.refresh();
    } catch (err) {
      setError('Failed to delete problem');
      console.error(err);
    } finally { setBusy(false); }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) return <ErrorState message={typeof error === 'string' ? error : 'The operation could not be completed.'} onRetry={fetchProblems} />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Delete Problems</h1>
      </div>

      {!problems.length && <EmptyState title="No problems yet">Create a problem to get started.</EmptyState>}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="w-1/12">#</th>
              <th className="w-4/12">Title</th>
              <th className="w-2/12">Difficulty</th>
              <th className="w-3/12">Tags</th>
              <th className="w-2/12">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr key={problem._id}>
                <th>{(list.page - 1) * list.limit + index + 1}</th>
                <td>{problem.title}</td>
                <td>
                  <span className={`badge ${
                    problem.difficulty === 'easy' 
                      ? 'badge-success' 
                      : problem.difficulty === 'medium' 
                        ? 'badge-warning' 
                        : 'badge-error'
                  }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td>
                  <span className="badge badge-outline">
                    {problem.tags}
                  </span>
                </td>
                <td>
                  <div className="flex space-x-2">
                    <button 
                      disabled={busy} onClick={() => handleDelete(problem._id)}
                      className="btn btn-sm btn-error"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination {...list} loading={loading || busy} />
    </div>
  );
};

export default AdminDelete;