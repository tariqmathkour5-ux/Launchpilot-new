"use client";

import { useState, useEffect } from 'react';
import { Tool } from '@/types';
import { Send, Mail, CheckCircle, AlertCircle, Loader2, Gift } from 'lucide-react';

interface DealSubscriptionFormProps {
  availableTools: Tool[];
}

export default function DealSubscriptionForm({ availableTools }: DealSubscriptionFormProps) {
  const [email, setEmail] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || selectedTools.length === 0) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/deals/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          favoriteToolSlugs: selectedTools,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setEmail('');
        setSelectedTools([]);
      } else {
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('[DealSubscriptionForm] Error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleToolSelection = (toolSlug: string) => {
    setSelectedTools(prev => {
      if (prev.includes(toolSlug)) {
        return prev.filter(t => t !== toolSlug);
      }
      if (prev.length >= 5) {
        return prev; // Limit to 5 selections
      }
      return [...prev, toolSlug];
    });
  };

  const filteredTools = availableTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-50 text-warning-600">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-secondary-900">Get Deal Alerts</h3>
          <p className="text-secondary-500">Receive email notifications when your favorite tools have deals</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting || submitStatus === 'success'}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
            />
          </div>
        </div>

        {/* Favorite Tools Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-secondary-700">
              Select Favorite Tools (up to 5)
            </label>
            <span className="text-xs text-secondary-500">
              {selectedTools.length}/5 selected
            </span>
          </div>
          
          {/* Search Input */}
          <div className="relative mb-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="w-full pl-4 pr-4 py-2 rounded-lg border border-secondary-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Tool Selection Grid */}
          <div className="bg-white rounded-lg border border-secondary-200 p-3 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredTools.slice(0, 20).map((tool) => (
                <button
                  key={tool.slug}
                  type="button"
                  onClick={() => toggleToolSelection(tool.slug)}
                  disabled={isSubmitting || submitStatus === 'success'}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedTools.includes(tool.slug)
                      ? 'bg-primary-100 text-primary-800 border border-primary-300'
                      : 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border border-transparent'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selectedTools.includes(tool.slug)
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-secondary-300'
                  }`}>
                    {selectedTools.includes(tool.slug) && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="truncate">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || submitStatus === 'success' || selectedTools.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Subscribing...
            </>
          ) : submitStatus === 'success' ? (
            <>
              <CheckCircle className="h-5 w-5" />
              Subscribed! Check your email.
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Subscribe to Deal Alerts
            </>
          )}
        </button>

        {/* Status Messages */}
        {submitStatus === 'error' && (
          <div className="flex items-center gap-2 p-4 bg-error-50 text-error-700 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to subscribe. Please try again.</span>
          </div>
        )}

        {submitStatus === 'success' && (
          <div className="p-4 bg-success-50 text-success-700 rounded-lg">
            <p className="font-medium mb-1">Success! 🎉</p>
            <p className="text-sm">You'll now receive email alerts when your favorite tools have active deals.</p>
          </div>
        )}
      </form>
    </div>
  );
}