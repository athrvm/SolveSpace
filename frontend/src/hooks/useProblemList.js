import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';

export default function useProblemList({ search = '', difficulty = 'all', tag = 'all', status = 'all', enabled = true } = {}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      axiosClient.get('/problem/getAllProblem', { params: { page, limit, search, difficulty, tag, status } }).then(({ data }) => {
        if (!active) return;
        if (page > Math.max(1, data.pagination.totalPages)) { setPage(Math.max(1, data.pagination.totalPages)); return; }
        setData(data);
      }).catch(() => { if (active) setError('The problem library could not be loaded. Please try again.'); }).finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [page, limit, search, difficulty, tag, status, enabled, attempt]);
  return { problems: data?.problems || [], pagination: data?.pagination, summary: data?.summary, loading, error, page, limit, setPage, setLimit: value => { setLimit(value); setPage(1); }, refresh: () => setAttempt(value => value + 1) };
}
