import Link from 'next/link';
import {
  MessageSquare,
  Image,
  Code,
  PenTool,
  Music,
  Video,
  Search,
  BarChart3,
  Zap,
  TrendingUp,
  Layers,
  Cpu
} from 'lucide-react';
import { Category } from '@/types';

const categoryIcons: Record<string, React.ReactNode> = {
  'ai-chat': <MessageSquare className="h-6 w-6" />,
  'ai-image': <Image className="h-6 w-6" />,
  'ai-coding': <Code className="h-6 w-6" />,
  'ai-writing': <PenTool className="h-6 w-6" />,
  'ai-audio': <Music className="h-6 w-6" />,
  'ai-video': <Video className="h-6 w-6" />,
  'ai-research': <Search className="h-6 w-6" />,
  'ai-data': <BarChart3 className="h-6 w-6" />,
  'ai-automation': <Zap className="h-6 w-6" />,
  'ai-marketing': <TrendingUp className="h-6 w-6" />,
  'ai-platform': <Layers className="h-6 w-6" />,
  'ai-productivity': <Cpu className="h-6 w-6" />,
};

interface CategoryCardProps {
  category: Category;
  toolCount?: number;
}

export default function CategoryCard({ category, toolCount }: CategoryCardProps) {
  const icon = categoryIcons[category.slug] || <Layers className="h-6 w-6" />;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group card p-6 flex items-start gap-4"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-secondary-500 mt-1 line-clamp-2">
          {category.description}
        </p>
        <p className="text-xs text-secondary-400 mt-2">
          {toolCount ?? category.tool_count} tools
        </p>
      </div>
    </Link>
  );
}
