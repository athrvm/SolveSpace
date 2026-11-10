import { CircleAlert, SearchX } from 'lucide-react';
export function LoadingState({ label = 'Loading…' }) { return <div className="state-panel" role="status"><span className="loading loading-spinner" /><p>{label}</p></div>; }
export function EmptyState({ title = 'Nothing here yet', children }) { return <div className="state-panel"><SearchX size={26} /><h3>{title}</h3><p>{children}</p></div>; }
export function ErrorState({ message, onRetry }) { return <div className="state-panel" role="alert"><CircleAlert size={26} /><h3>Something went wrong</h3><p>{message}</p>{onRetry && <button className="btn btn-outline" onClick={onRetry}>Try again</button>}</div>; }
export function DifficultyBadge({ difficulty }) { return <span className={`badge badge-soft ${difficulty === 'easy' ? 'badge-success' : difficulty === 'medium' ? 'badge-warning' : 'badge-error'}`}>{difficulty}</span>; }
