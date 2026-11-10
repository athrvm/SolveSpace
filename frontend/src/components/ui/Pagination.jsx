export default function Pagination({ pagination, loading, setPage, setLimit }) {
  if (!pagination) return null;
  return <nav className="flex flex-wrap items-center justify-between gap-4 mt-6" aria-label="Problem pagination">
    <label className="flex items-center gap-2">Per page <select className="select w-auto" aria-label="Problems per page" value={pagination.limit} disabled={loading} onChange={e => setLimit(Number(e.target.value))}>{[10, 20, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
    <span>Page {pagination.totalPages ? pagination.page : 0} of {pagination.totalPages} · {pagination.total} problems</span>
    <div className="flex gap-2"><button className="btn btn-outline" disabled={loading || !pagination.hasPreviousPage} onClick={() => setPage(pagination.page - 1)}>Previous</button><button className="btn btn-outline" disabled={loading || !pagination.hasNextPage} onClick={() => setPage(pagination.page + 1)}>Next</button></div>
  </nav>;
}
