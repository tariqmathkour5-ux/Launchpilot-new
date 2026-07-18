// =====================================================
// SIDEBAR FILTERS & SORTING COMPONENT
// Reusable sidebar with Pricing, Category, Platform filters and sorting
// =====================================================

'use client';

import { useMemo, useCallback } from 'react';
import { Tool } from '@/types';
import { Filter, X, ArrowUpDown, Check } from 'lucide-react';

export type SortOption = 'name-asc' | 'name-desc' | 'rating-desc' | 'rating-asc' | 'newest' | 'oldest';

export interface FilterState {
  query: string;
  category: string;
  pricing: string;
  platform: string;
  hasApi: boolean | null;
  sortBy: SortOption;
}

interface SidebarFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: string[];
  platforms: string[];
  pricingOptions: string[];
  tools: Tool[];
  filteredCount: number;
  totalCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'rating-asc', label: 'Lowest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

export function applySorting(tools: Tool[], sortBy: SortOption): Tool[] {
  const sorted = [...tools];
  switch (sortBy) {
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'rating-desc':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'rating-asc':
      sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'oldest':
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      break;
  }
  return sorted;
}

export function applyFilters(tools: Tool[], filters: FilterState): Tool[] {
  return tools.filter(tool => {
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const matchesText =
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.features?.some(f => f.toLowerCase().includes(query)) ||
        tool.use_cases?.some(u => u.toLowerCase().includes(query));
      if (!matchesText) return false;
    }

    // Category filter
    if (filters.category && tool.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }

    // Pricing filter
    if (filters.pricing && tool.pricing.toLowerCase() !== filters.pricing.toLowerCase()) {
      return false;
    }

    // Platform filter
    if (filters.platform && !tool.platforms?.some(p => p.toLowerCase() === filters.platform?.toLowerCase())) {
      return false;
    }

    // API filter
    if (filters.hasApi === true && !tool.has_api) {
      return false;
    }

    return true;
  });
}

export default function SidebarFilters({
  filters,
  onFilterChange,
  categories,
  platforms,
  pricingOptions,
  filteredCount,
  totalCount,
}: SidebarFiltersProps) {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.pricing) count++;
    if (filters.platform) count++;
    if (filters.hasApi) count++;
    if (filters.sortBy !== 'name-asc') count++;
    return count;
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  }, [filters, onFilterChange]);

  const clearFilters = useCallback(() => {
    onFilterChange({
      query: '',
      category: '',
      pricing: '',
      platform: '',
      hasApi: null,
      sortBy: 'name-asc',
    });
  }, [onFilterChange]);

  return (
    <aside className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-secondary-600" />
          <h3 className="font-semibold text-secondary-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-secondary-500">
        Showing <span className="font-semibold text-secondary-900">{filteredCount}</span> of{' '}
        <span className="font-semibold text-secondary-900">{totalCount.toLocaleString()}</span> tools
      </div>

      {/* Sort By */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpDown className="h-4 w-4 text-secondary-500" />
          <label className="text-sm font-medium text-secondary-700">Sort By</label>
        </div>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value as SortOption)}
          className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div className="card p-4">
        <label className="text-sm font-medium text-secondary-700 mb-3 block">
          Category
        </label>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          <button
            onClick={() => updateFilter('category', '')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              !filters.category
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => updateFilter('category', cat)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                filters.category === cat
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span>{cat}</span>
              {filters.category === cat && (
                <Check className="h-3.5 w-3.5 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Filter */}
      <div className="card p-4">
        <label className="text-sm font-medium text-secondary-700 mb-3 block">
          Pricing
        </label>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('pricing', '')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              !filters.pricing
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            All Pricing
          </button>
          {pricingOptions.map(price => (
            <button
              key={price}
              onClick={() => updateFilter('pricing', price)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between capitalize ${
                filters.pricing === price
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span>{price}</span>
              {filters.pricing === price && (
                <Check className="h-3.5 w-3.5 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Filter */}
      <div className="card p-4">
        <label className="text-sm font-medium text-secondary-700 mb-3 block">
          Platform
        </label>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => updateFilter('platform', '')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              !filters.platform
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            All Platforms
          </button>
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => updateFilter('platform', platform)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                filters.platform === platform
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              <span>{platform}</span>
              {filters.platform === platform && (
                <Check className="h-3.5 w-3.5 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* API Filter */}
      <div className="card p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasApi === true}
            onChange={(e) => updateFilter('hasApi', e.target.checked ? true : null)}
            className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-secondary-700">
            Has API
          </span>
        </label>
      </div>
    </aside>
  );
}