import { Plus, Pencil, Trash2, Video, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
const options = [
  { title: 'Update a problem', description: 'Edit existing statements, examples and language templates.', route: '/admin/update', icon: Pencil },
  { title: 'Create a problem', description: 'Write a statement, test cases and language templates.', route: '/admin/create', icon: Plus },
  { title: 'Manage problems', description: 'Review the library and remove problems.', route: '/admin/delete', icon: Trash2 },
  { title: 'Editorial videos', description: 'Upload or remove video explanations for problems.', route: '/admin/video', icon: Video },
];
export default function Admin() { return <div className="page-container admin-overview"><div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Content workspace</h1><p>Maintain the problem library and learning resources.</p></div></div><div className="admin-options">{options.map(({ title, description, route, icon: Icon }) => <Link key={route} to={route} className="admin-option"><Icon size={23} /><div><h2>{title}</h2><p>{description}</p></div><ArrowUpRight size={20} /></Link>)}</div></div>; }
