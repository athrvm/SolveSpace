import { NavLink, useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Monitor } from 'lucide-react';
import { logoutUser } from '../authSlice';
import { useTheme } from './ThemeProvider';
export default function AppShell({ children }) {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { preference, setPreference } = useTheme();
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="app-header">
      <NavLink to="/" className="brand"><img src="/solvespace-mark.svg" width="30" height="30" alt="" /><span>SolveSpace</span></NavLink>
      {isAuthenticated && <nav aria-label="Main navigation" className="main-nav">
        <NavLink to="/" end>Problems</NavLink>
        <NavLink to="/bookmarks">Bookmarks</NavLink>
        {user?.role === 'admin' && <NavLink to="/admin">Administration</NavLink>}
      </nav>}
      <div className="header-tools">
        <label className="theme-control"><Monitor size={16} /><span className="sr-only">Colour theme</span><select aria-label="Colour theme" value={preference} onChange={e => setPreference(e.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        {isAuthenticated && <details className="profile-menu"><summary><span className="avatar-initial">{user?.firstName?.[0] || 'U'}</span><span className="profile-name">{user?.firstName}</span></summary><div className="profile-popover"><strong>{user?.firstName}</strong><p>{user?.emailId}</p><button className="btn btn-ghost" onClick={() => dispatch(logoutUser())}><LogOut size={16} /> Sign out</button></div></details>}
      </div>
    </header>
    {pathname.startsWith('/admin') && <nav className="admin-nav" aria-label="Administration"><NavLink end to="/admin">Overview</NavLink><NavLink to="/admin/create">Create problem</NavLink><NavLink to="/admin/update">Update problems</NavLink><NavLink to="/admin/delete">Manage problems</NavLink><NavLink to="/admin/video">Editorial videos</NavLink></nav>}
    <main id="main-content" tabIndex={-1}>{children}</main>
  </>;
}
