"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarPost {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string | null } | null;
}

const STATUS_DOT: Record<CalendarPost["status"], string> = {
  DRAFT: "bg-secondary-400",
  REVIEW: "bg-warning-500",
  PUBLISHED: "bg-success-500",
  ARCHIVED: "bg-error-400",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AdminBlogCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/admin/blog/calendar?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => setPosts(data.posts || []))
      .finally(() => setIsLoading(false));
  }, [year, month]);

  const goToPreviousMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); } else { setMonth((m) => m - 1); }
  };
  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); } else { setMonth((m) => m + 1); }
  };

  // Group posts by day-of-month (using publishedAt if set, else createdAt),
  // computed once per fetch rather than re-scanning `posts` per cell render.
  const postsByDay = useMemo(() => {
    const map = new Map<number, CalendarPost[]>();
    for (const post of posts) {
      const date = new Date(post.publishedAt || post.createdAt);
      const day = date.getUTCDate();
      const list = map.get(day) ?? [];
      list.push(post);
      map.set(day, list);
    }
    return map;
  }, [posts]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Editorial Calendar</h1>
          <p className="text-secondary-500 mt-1">Scheduled, draft, and published posts by date</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={goToPreviousMonth} className="p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-medium text-secondary-900 min-w-[140px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={goToNextMonth} className="p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-xs text-secondary-500">
        {Object.entries(STATUS_DOT).map(([status, color]) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {status}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[700px]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div key={label} className="p-2 text-xs font-semibold text-secondary-500 text-center border-b border-secondary-100">
                {label}
              </div>
            ))}
            {cells.map((day, i) => (
              <div key={i} className="min-h-[100px] border-b border-r border-secondary-100 p-2">
                {day && (
                  <>
                    <p className="text-xs text-secondary-400 mb-1">{day}</p>
                    <div className="space-y-1">
                      {(postsByDay.get(day) ?? []).map((post) => (
                        <Link
                          key={post.id}
                          href={`/admin/blog/${post.id}`}
                          className="flex items-center gap-1 text-xs text-secondary-700 hover:text-primary-600 line-clamp-1"
                          title={post.title}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[post.status]}`} />
                          {post.title}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
