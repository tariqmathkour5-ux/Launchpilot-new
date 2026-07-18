// =====================================================
// COMPARE CLIENT COMPONENT
// Handles tool selection and comparison display
// =====================================================

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tool } from '@/types';
import { GitCompare, X, Plus, ArrowRight } from 'lucide-react';
import ComparisonTable from '@/components/ComparisonTable';
import Link from 'next/link';

interface CompareClientProps {
  allTools: Tool[];
  toolsForSelect: { id: string; slug: string; name: string }[];
  initialSlugs: string[];
}

export default function CompareClient({ allTools, toolsForSelect, initialSlugs }: CompareClientProps) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);
  
  const selectedTools = selectedSlugs
    .map(slug => allTools.find(t => t.slug === slug))
    .filter(Boolean) as Tool[];

  const handleSelectTool = useCallback((index: number, slug: string) => {
    if (!slug) return;
    const newSlugs = [...selectedSlugs];
    newSlugs[index] = slug;
    setSelectedSlugs([...new Set(newSlugs)]);
    
    // Update URL
    const params = new URLSearchParams();
    const uniqueNewSlugs = [...new Set(newSlugs.filter(Boolean))];
    uniqueNewSlugs.forEach((s, i) => {
      params.set(String.fromCharCode(97 + i), s); // a, b, c, d
    });
    router.push(`/compare?${params.toString()}`);
  }, [selectedSlugs, router]);

  const handleAddTool = useCallback(() => {
    if (selectedSlugs.length < 4) {
      setSelectedSlugs([...selectedSlugs, '']);
    }
  }, [selectedSlugs]);

  const handleRemoveTool = useCallback((slug: string) => {
    const newSlugs = selectedSlugs.filter(s => s !== slug);
    setSelectedSlugs(newSlugs);
    
    // Update URL
    const params = new URLSearchParams();
    newSlugs.filter(Boolean).forEach((s, i) => {
      params.set(String.fromCharCode(97 + i), s);
    });
    router.push(`/compare?${params.toString()}`);
  }, [selectedSlugs, router]);

  // Get available options (exclude already selected)
  const getAvailableOptions = (currentIndex: number) => {
    const selected = selectedSlugs.filter((_, i) => i !== currentIndex && selectedSlugs[i]);
    return toolsForSelect.filter(t => !selected.includes(t.slug));
  };

  return (
    <div className="space-y-6">
      {/* Tool Selectors */}
      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(index => (
            <div key={index} className={`${index >= selectedSlugs.length ? 'opacity-50' : ''}`}>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {index === 0 ? 'Tool A' : index === 1 ? 'Tool B' : index === 2 ? 'Tool C' : 'Tool D'}
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedSlugs[index] || ''}
                  onChange={(e) => handleSelectTool(index, e.target.value)}
                  disabled={index >= selectedSlugs.length}
                  className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-secondary-100"
                >
                  <option value="">Select...</option>
                  {getAvailableOptions(index).map(tool => (
                    <option key={tool.slug} value={tool.slug}>{tool.name}</option>
                  ))}
                </select>
                {selectedSlugs[index] && (
                  <button
                    onClick={() => handleRemoveTool(selectedSlugs[index])}
                    className="p-2 text-secondary-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {selectedSlugs.length < 4 && (
          <button
            onClick={handleAddTool}
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            Add another tool (max 4)
          </button>
        )}
      </div>

      {/* Comparison Results */}
      {selectedTools.length >= 2 ? (
        <ComparisonTable
          tools={selectedTools}
          onRemoveTool={handleRemoveTool}
        />
      ) : selectedTools.length === 1 ? (
        <div className="card p-6 text-center">
          <GitCompare className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Add Another Tool</h3>
          <p className="text-secondary-600">Select a second tool above to start comparing.</p>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <GitCompare className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Select Tools to Compare</h3>
          <p className="text-secondary-600">Choose tools above to see a detailed side-by-side comparison.</p>
        </div>
      )}
    </div>
  );
}