'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Tool } from '@/types';
import ToolGrid from './ToolGrid';
import SidebarFilters, { FilterState, applyFilters, applySorting, SortOption } from './SidebarFilters';
import { ChevronDown, Filter, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { enhancedSearch, getAutocompleteSuggestions, AutocompleteSuggestion } from '@/lib/search-synonyms';

interface AdvancedSearchProps {
  tools: Tool[];
  categories: string[];
  platforms: string[];
  pricingOptions: string[];
}

const ITEMS_PER_PAGE = 60;

export default function AdvancedSearch({ 
  tools, 
  categories, 
  platforms, 
  pricingOptions 
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    category: '',
    pricing: '',
    platform: '',
    hasApi: null,
    sortBy: 'name-asc',
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showSidebar, setShowSidebar] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and sort tools
  const filteredTools = useMemo(() => {
    let result = applyFilters(tools, filters);
    result = applySorting(result, filters.sortBy);
    return result;
  }, [tools, filters]);

  // Apply synonym-enhanced search when query is present
  const searchEnhancedTools = useMemo(() => {
    if (!filters.query.trim()) return filteredTools;
    return enhancedSearch(filteredTools, filters.query, { limit: filteredTools.length });
  }, [filteredTools, filters.query]);

  // Paginate
  const paginatedTools = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchEnhancedTools.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [searchEnhancedTools, currentPage]);

  // Update autocomplete suggestions
  const handleQueryChange = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query }));
    setCurrentPage(1);
    
    if (query.trim().length >= 2) {
      const suggestions = getAutocompleteSuggestions(tools, query, 6);
      setAutocompleteSuggestions(suggestions);
      setShowAutocomplete(suggestions.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  }, [tools]);

  const selectAutocomplete = useCallback((suggestion: AutocompleteSuggestion) => {
    setFilters(prev => ({ ...prev, query: suggestion.text }));
    setShowAutocomplete(false);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      category: '',
      pricing: '',
      platform: '',
      hasApi: null,
      sortBy: 'name-asc',
    });
    setCurrentPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.pricing) count++;
    if (filters.platform) count++;
    if (filters.hasApi) count++;
    if (filters.sortBy !== 'name-asc') count++;
    return count;
  }, [filters]);

  const totalPages = Math.ceil(searchEnhancedTools.length / ITEMS_PER_PAGE);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50"
      >
        <Filter className="h-4 w-4" />
        Filters & Sorting
        {activeFilterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Sidebar Filters */}
      <div className={`${showSidebar ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
        <SidebarFilters
          filters={filters}
          onFilterChange={(newFilters) => {
            setFilters(newFilters);
            setCurrentPage(1);
          }}
          categories={categories}
          platforms={platforms}
          pricingOptions={pricingOptions}
          tools={tools}
          filteredCount={searchEnhancedTools.length}
          totalCount={tools.length}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Search Bar with Autocomplete */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search AI tools by name, description, or features..."
              value={filters.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => {
                if (autocompleteSuggestions.length > 0) setShowAutocomplete(true);
              }}
              className="w-full rounded-lg border border-secondary-300 bg-white px-4 py-3 pl-10 pr-10 text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {filters.query && (
              <button
                onClick={() => handleQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <div
              ref={autocompleteRef}
              className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg overflow-hidden"
            >
              {autocompleteSuggestions.map((suggestion, idx) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${idx}`}
                  onClick={() => selectAutocomplete(suggestion)}
                  className="w-full text-left px-4 py-2.5 hover:bg-secondary-50 flex items-center gap-3 transition-colors"
                >
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    suggestion.type === 'tool' ? 'bg-primary-100 text-primary-700' :
                    suggestion.type === 'category' ? 'bg-accent-100 text-accent-700' :
                    suggestion.type === 'feature' ? 'bg-secondary-100 text-secondary-700' :
                    'bg-secondary-100 text-secondary-700'
                  }`}>
                    {suggestion.type === 'tool' ? 'Tool' :
                     suggestion.type === 'category' ? 'Category' :
                     suggestion.type === 'feature' ? 'Feature' : 'Keyword'}
                  </span>
                  <span className="text-sm text-secondary-900">{suggestion.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Summary and Pagination */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-secondary-500">
            Showing <span className="font-medium text-secondary-900">{paginatedTools.length}</span> of{' '}
            <span className="font-medium text-secondary-900">{searchEnhancedTools.length}</span> tools
            {filters.query && (
              <span className="ml-2 text-secondary-400">
                (synonym-enhanced search)
              </span>
            )}
            {totalPages > 1 && (
              <span className="ml-2 text-secondary-400">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-secondary-300 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-secondary-300 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tool Grid */}
        <ToolGrid tools={paginatedTools} columns={3} />
      </div>
    </div>
  );
}
