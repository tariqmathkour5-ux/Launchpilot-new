// =====================================================
// COMPARISON TABLE COMPONENT
// Side-by-side tool comparison with feature highlighting
// =====================================================

'use client';

import { useMemo, useState } from 'react';
import { Tool } from '@/types';
import { Check, X, Minus, Star, ExternalLink, ChevronDown, ChevronUp, Search } from 'lucide-react';
import Link from 'next/link';

interface ComparisonTableProps {
  tools: Tool[];
  onRemoveTool?: (slug: string) => void;
  maxTools?: number;
}

type ComparisonField = 'overview' | 'features' | 'pricing' | 'platforms' | 'pros' | 'cons' | 'useCases';

interface FieldConfig {
  key: ComparisonField;
  label: string;
  icon: string;
}

const FIELDS: FieldConfig[] = [
  { key: 'overview', label: 'Overview', icon: '📋' },
  { key: 'features', label: 'Features', icon: '⚡' },
  { key: 'pricing', label: 'Pricing', icon: '💰' },
  { key: 'platforms', label: 'Platforms', icon: '💻' },
  { key: 'pros', label: 'Pros', icon: '✅' },
  { key: 'cons', label: 'Cons', icon: '⚠️' },
  { key: 'useCases', label: 'Use Cases', icon: '🎯' },
];

function ValueDiff({ values }: { values: (string | boolean | null)[] }) {
  const uniqueValues = new Set(values.map(v => String(v)));
  
  if (uniqueValues.size === 1) {
    const val = values[0];
    if (typeof val === 'boolean') {
      return val ? <Check className="h-5 w-5 text-accent-500" /> : <X className="h-5 w-5 text-red-400" />;
    }
    return <span className="text-secondary-900">{val || '-'}</span>;
  }

  return (
    <div className="space-y-1">
      {values.map((val, i) => {
        const isDifferent = i > 0 && String(val) !== String(values[0]);
        return (
          <div key={i} className={`text-sm ${isDifferent ? 'text-primary-600 font-medium' : 'text-secondary-600'}`}>
            {typeof val === 'boolean' 
              ? (val ? <Check className="h-4 w-4 text-accent-500" /> : <X className="h-4 w-4 text-red-400" />)
              : (val || '-')
            }
            {isDifferent && <span className="ml-1 text-xs text-primary-400">(different)</span>}
          </div>
        );
      })}
    </div>
  );
}

function ListDiff({ lists }: { lists: string[][] }) {
  // Find items that appear in all lists
  const allItems = lists.map(list => new Set(list.map(i => i.toLowerCase())));
  const commonItems = lists.length > 0
    ? [...allItems[0]].filter(item => allItems.every(set => set.has(item)))
    : [];

  return (
    <div className="space-y-2">
      {lists.map((list, toolIdx) => (
        <div key={toolIdx} className="space-y-0.5">
          {list.length === 0 ? (
            <span className="text-secondary-400 text-sm">-</span>
          ) : (
            list.map((item, itemIdx) => {
              const isCommon = commonItems.includes(item.toLowerCase());
              return (
                <div
                  key={itemIdx}
                  className={`text-sm flex items-center gap-1.5 ${
                    isCommon ? 'text-accent-600' : 'text-secondary-600'
                  }`}
                >
                  {isCommon && <Check className="h-3 w-3 text-accent-500 flex-shrink-0" />}
                  <span>{item}</span>
                  {isCommon && <span className="text-xs text-accent-400">(all)</span>}
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}

export default function ComparisonTable({ tools, onRemoveTool, maxTools = 4 }: ComparisonTableProps) {
  const [expandedSections, setExpandedSections] = useState<Set<ComparisonField>>(new Set(['overview', 'features', 'pricing']));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (field: ComparisonField) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    const q = searchQuery.toLowerCase();
    return tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [tools, searchQuery]);

  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Select tools to compare</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search within comparison */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
        <input
          type="text"
          placeholder="Filter within comparison..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-secondary-300 bg-white pl-10 pr-4 py-2 text-sm text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-48 p-4 text-left text-sm font-medium text-secondary-500 bg-secondary-50 border border-secondary-200">
                Field
              </th>
              {filteredTools.map(tool => (
                <th key={tool.slug} className="p-4 text-left bg-secondary-50 border border-secondary-200 min-w-[200px]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="text-base font-semibold text-secondary-900 hover:text-primary-600 transition-colors"
                      >
                        {tool.name}
                      </Link>
                      <p className="text-xs text-secondary-500 mt-0.5">{tool.category}</p>
                    </div>
                    {onRemoveTool && (
                      <button
                        onClick={() => onRemoveTool(tool.slug)}
                        className="text-secondary-400 hover:text-red-500 transition-colors"
                        title="Remove from comparison"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {tool.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-3.5 w-3.5 text-primary-500 fill-primary-500" />
                      <span className="text-sm font-medium text-primary-700">{tool.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {tool.website_url && (
                    <a
                      href={tool.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary-600 hover:text-primary-700"
                    >
                      Visit website <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELDS.map(field => {
              const isExpanded = expandedSections.has(field.key);
              return (
                <>
                  {/* Section Header */}
                  <tr key={field.key} className="group">
                    <td
                      colSpan={filteredTools.length + 1}
                      className="p-3 bg-secondary-50 border border-secondary-200"
                    >
                      <button
                        onClick={() => toggleSection(field.key)}
                        className="flex items-center gap-2 text-sm font-semibold text-secondary-700 hover:text-secondary-900 transition-colors w-full"
                      >
                        <span>{field.icon}</span>
                        <span>{field.label}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                      </button>
                    </td>
                  </tr>

                  {/* Section Content */}
                  {isExpanded && renderFieldContent(field.key, filteredTools)}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderFieldContent(field: ComparisonField, tools: Tool[]) {
  switch (field) {
    case 'overview':
      return (
        <>
          <tr>
            <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white">Description</td>
            {tools.map(t => (
              <td key={t.slug} className="p-3 text-sm text-secondary-600 border border-secondary-200">
                <ValueDiff values={tools.map(tt => tt.description)} />
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white">Category</td>
            {tools.map(t => (
              <td key={t.slug} className="p-3 text-sm border border-secondary-200">
                <ValueDiff values={tools.map(tt => tt.category)} />
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white">Has API</td>
            {tools.map(t => (
              <td key={t.slug} className="p-3 border border-secondary-200">
                <ValueDiff values={tools.map(tt => tt.has_api)} />
              </td>
            ))}
          </tr>
        </>
      );

    case 'features':
      return (
        <tr>
          <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white align-top">Features</td>
          {tools.map(t => (
            <td key={t.slug} className="p-3 border border-secondary-200 align-top">
              <ListDiff lists={tools.map(tt => tt.features || [])} />
            </td>
          ))}
        </tr>
      );

    case 'pricing':
      return (
        <>
          <tr>
            <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white">Model</td>
            {tools.map(t => (
              <td key={t.slug} className="p-3 text-sm border border-secondary-200">
                <ValueDiff values={tools.map(tt => tt.pricing)} />
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white">Free Tier</td>
            {tools.map(t => (
              <td key={t.slug} className="p-3 border border-secondary-200">
                <ValueDiff values={tools.map(tt => tt.has_free_tier)} />
              </td>
            ))}
          </tr>
        </>
      );

    case 'platforms':
      return (
        <tr>
          <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white align-top">Platforms</td>
          {tools.map(t => (
            <td key={t.slug} className="p-3 border border-secondary-200 align-top">
              <ListDiff lists={tools.map(tt => tt.platforms || [])} />
            </td>
          ))}
        </tr>
      );

    case 'pros':
      return (
        <tr>
          <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white align-top">Pros</td>
          {tools.map(t => (
            <td key={t.slug} className="p-3 border border-secondary-200 align-top">
              <ListDiff lists={tools.map(tt => tt.pros || [])} />
            </td>
          ))}
        </tr>
      );

    case 'cons':
      return (
        <tr>
          <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white align-top">Cons</td>
          {tools.map(t => (
            <td key={t.slug} className="p-3 border border-secondary-200 align-top">
              <ListDiff lists={tools.map(tt => tt.cons || [])} />
            </td>
          ))}
        </tr>
      );

    case 'useCases':
      return (
        <tr>
          <td className="p-3 text-sm font-medium text-secondary-600 border border-secondary-200 bg-white align-top">Use Cases</td>
          {tools.map(t => (
            <td key={t.slug} className="p-3 border border-secondary-200 align-top">
              <ListDiff lists={tools.map(tt => tt.use_cases || [])} />
            </td>
          ))}
        </tr>
      );

    default:
      return null;
  }
}