import { Tool } from '@/types';
import ToolCard from './ToolCard';

interface ToolGridProps {
  tools: Tool[];
  showRating?: boolean;
  columns?: 2 | 3 | 4;
}

export default function ToolGrid({ tools, showRating = true, columns = 3 }: ToolGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">No tools found.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} showRating={showRating} />
      ))}
    </div>
  );
}
