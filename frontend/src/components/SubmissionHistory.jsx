import { useState, useEffect, useRef } from 'react';
import axiosClient from '../utils/axiosClient';
import { History } from 'lucide-react';
import { ErrorState, LoadingState } from './ui/States';

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [retry, setRetry] = useState(0);

  const dialogRef = useRef(null);
  useEffect(() => {
    if (selectedSubmission) dialogRef.current?.showModal();
  }, [selectedSubmission]);
  useEffect(() => {
    let active = true;
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedSubmission(null);
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        // Support the previous API response until the backend is restarted.
        const history = response.data === 'No Submission is present' ? [] : response.data;
        if (!Array.isArray(history)) throw new Error('Invalid submission history response');
        if (active) setSubmissions(history);
      } catch {
        if (active) setError('We could not load your submissions. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSubmissions();
    return () => { active = false; };
  }, [problemId, retry]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'badge-success';
      case 'wrong': return 'badge-error';
      case 'error': return 'badge-warning';
      case 'pending': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const formatMemory = (memory) => {
    if (memory < 1024) return `${memory} kB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <LoadingState label="Loading your submissions…" />;

  if (error) return <ErrorState message={error} onRetry={() => setRetry(value => value + 1)} />;

  return (
    <div className="container mx-auto p-4">
      {submissions.length === 0 ? (
        <div className="state-panel rounded-xl border border-base-300 bg-base-200" role="status">
          <History size={32} aria-hidden="true" />
          <h3 className="text-lg font-semibold">No submissions yet</h3>
          <p>Write your solution in the editor and select Submit. Your attempts, results and submitted code will appear here.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Test Cases</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, index) => (
                  <tr key={sub._id}>
                    <td>{index + 1}</td>
                    <td className="font-mono">{sub.language}</td>
                    <td>
                      <span className={`badge ${getStatusColor(sub.status)}`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="font-mono">{sub.runtime}sec</td>
                    <td className="font-mono">{formatMemory(sub.memory)}</td>
                    <td className="font-mono">{sub.testCasesPassed}/{sub.testCasesTotal}</td>
                    <td>{formatDate(sub.createdAt)}</td>
                    <td>
                      <button 
                        className="btn btn-s btn-outline"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Showing {submissions.length} submissions
          </p>
        </>
      )}

      {/* Code View Modal */}
      {selectedSubmission && (
        <dialog ref={dialogRef} className="modal" aria-label="Submission details" onCancel={() => setSelectedSubmission(null)}>
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">
              Submission Details: {selectedSubmission.language}
            </h3>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`badge ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status}
                </span>
                <span className="badge badge-outline">
                  Runtime: {selectedSubmission.runtime}s
                </span>
                <span className="badge badge-outline">
                  Memory: {formatMemory(selectedSubmission.memory)}
                </span>
                <span className="badge badge-outline">
                  Passed: {selectedSubmission.testCasesPassed}/{selectedSubmission.testCasesTotal}
                </span>
              </div>
              
              {selectedSubmission.errorMessage && (
                <div className="alert alert-error mt-2">
                  <div>
                    <span>{selectedSubmission.errorMessage}</span>
                  </div>
                </div>
              )}
            </div>
            
            <pre className="p-4 submission-code rounded overflow-x-auto">
              <code>{selectedSubmission.code}</code>
            </pre>
            
            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default SubmissionHistory;