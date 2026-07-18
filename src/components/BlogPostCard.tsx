import Link from 'next/link';
import { FileText, Calendar } from 'lucide-react';

interface BlogPostCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string | null;
    description: string | null;
    coverImage: string | null;
    thumbnailImage?: string | null;
    imageAlt?: string | null;
    publishedAt: Date | null;
    category: { name: string; slug: string } | null;
  };
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const summary = post.excerpt || post.description;
  // Cards show the thumbnail when one is set (it's meant for exactly this
  // context — small, cropped); otherwise fall back to the featured image
  // rather than showing nothing.
  const cardImage = post.thumbnailImage || post.coverImage;
  const imageAlt = post.imageAlt || post.title;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="card flex flex-col overflow-hidden group"
    >
      <div className="aspect-[16/9] bg-secondary-100 flex items-center justify-center overflow-hidden">
        {cardImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cardImage}
            alt={imageAlt}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <FileText className="h-10 w-10 text-secondary-300" />
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        {post.category && (
          <span className="badge badge-primary self-start mb-3">{post.category.name}</span>
        )}

        <h2 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors leading-snug line-clamp-2">
          {post.title}
        </h2>

        {summary && (
          <p className="text-sm text-secondary-500 mt-2 leading-relaxed line-clamp-3 flex-1">
            {summary}
          </p>
        )}

        {post.publishedAt && (
          <div className="flex items-center gap-1.5 text-xs text-secondary-400 mt-4 pt-4 border-t border-secondary-100">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        )}
      </div>
    </Link>
  );
}
