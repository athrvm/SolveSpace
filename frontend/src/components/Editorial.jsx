import { EmptyState } from './ui/States';
import EditorialPlayer from './EditorialPlayer';
export default function Editorial({ secureUrl, thumbnailUrl }) {
  if (!secureUrl) return <EmptyState title="No editorial yet">A video explanation has not been added to this problem.</EmptyState>;
  return <EditorialPlayer key={secureUrl} src={secureUrl} poster={thumbnailUrl} />;
}
