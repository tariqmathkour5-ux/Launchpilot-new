"use client";

import { useState } from "react";
import { Calendar, Filter, Download, X } from "lucide-react";

interface AnalyticsFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  showCategoryFilter?: boolean;
  showCompanyFilter?: boolean;
  showCountryFilter?: boolean;
  showDeviceFilter?: boolean;
  showExport?: boolean;
  onExport?: (format: string) => void;
}

interface FilterValues {
  startDate: string;
  endDate: string;
  categoryId?: string;
  companyId?: string;
  country?: string;
  device?: string;
}

const DATE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last year", days: 365 },
];

export default function AnalyticsFilters({
  onFilterChange,
  showCategoryFilter = false,
  showCompanyFilter = false,
  showCountryFilter = false,
  showDeviceFilter = false,
  showExport = true,
  onExport,
}: AnalyticsFiltersProps) {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [categoryId, setCategoryId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [country, setCountry] = useState("");
  const [device, setDevice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = () => {
    onFilterChange({
      startDate,
      endDate,
      categoryId: categoryId || undefined,
      companyId: companyId || undefined,
      country: country || undefined,
      device: device || undefined,
    });
  };

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-secondary-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input text-sm"
          />
          <span className="text-secondary-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.days}
              onClick={() => setPreset(preset.days)}
              className="text-xs px-2 py-1 rounded bg-secondary-100 text-secondary-600 hover:bg-secondary-200 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {(showCategoryFilter || showCompanyFilter || showCountryFilter || showDeviceFilter) && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(categoryId || companyId || country || device) && (
              <span className="w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </button>
        )}

        <button onClick={applyFilters} className="btn btn-primary">
          Apply
        </button>

        {showExport && onExport && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => onExport("csv")}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => onExport("excel")}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => onExport("pdf")}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-secondary-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          {showCategoryFilter && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input w-full"
              >
                <option value="">All Categories</option>
                <option value="ai-chat">AI Chat</option>
                <option value="ai-image">AI Image</option>
                <option value="ai-productivity">AI Productivity</option>
                <option value="ai-code">AI Code</option>
                <option value="ai-writing">AI Writing</option>
                <option value="ai-audio">AI Audio</option>
                <option value="ai-video">AI Video</option>
                <option value="ai-data">AI Data</option>
                <option value="ai-research">AI Research</option>
              </select>
            </div>
          )}

          {showCompanyFilter && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="Search companies..."
                className="input w-full"
              />
            </div>
          )}

          {showCountryFilter && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input w-full"
              >
                <option value="">All Countries</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="AU">Australia</option>
                <option value="JP">Japan</option>
                <option value="IN">India</option>
              </select>
            </div>
          )}

          {showDeviceFilter && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Device
              </label>
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                className="input w-full"
              >
                <option value="">All Devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
          )}

          <button
            onClick={() => {
              setCategoryId("");
              setCompanyId("");
              setCountry("");
              setDevice("");
            }}
            className="self-end text-sm text-secondary-500 hover:text-secondary-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
