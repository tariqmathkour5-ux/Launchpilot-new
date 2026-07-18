"use client";

import { useState } from "react";
import { Search, Wrench, Users, Building2, MessageSquare, FolderTree, Ticket, Megaphone } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  type: string;
  id: string;
  name: string;
  description?: string;
  href: string;
}

const typeIcons: Record<string, React.ElementType> = {
  tool: Wrench,
  user: Users,
  company: Building2,
  review: MessageSquare,
  category: FolderTree,
  coupon: Ticket,
  ad: Megaphone,
};

const typeColors: Record<string, string> = {
  tool: "bg-primary-100 text-primary-700",
  user: "bg-accent-100 text-accent-700",
  company: "bg-secondary-100 text-secondary-700",
  review: "bg-warning-100 text-warning-700",
  category: "bg-accent-100 text-accent-700",
  coupon: "bg-success-100 text-success-700",
  ad: "bg-warning-100 text-warning-700",
};

export default function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Global Search</h1>
        <p className="text-secondary-500 mt-1">Search across all resources</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools, users, companies, reviews..."
          className="w-full pl-12 pr-4 py-3 text-lg border border-secondary-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Results */}
      {Object.keys(groupedResults).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([type, items]) => {
            const Icon = typeIcons[type] || Search;
            return (
              <div key={type}>
                <h2 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="card p-4 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-secondary-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-secondary-500 truncate">{item.description}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[type] || "bg-secondary-100"}`}>
                          {type}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && query && !isSearching && (
        <div className="card p-12 text-center">
          <Search className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-500">No results found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
