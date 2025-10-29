'use client';

import { useState } from 'react';

interface FilterCounts {
  status: Array<{ status: string; count: number }>;
  type: Array<{ type: string; count: number }>;
}

interface Filters {
  status: string;
  type: string;
  search: string;
  page: number;
  limit: number;
}

interface ContactMessagesFiltersProps {
  filters: Filters;
  filterCounts: FilterCounts;
  onFilterChange: (filters: Partial<Filters>) => void;
  onRefresh: () => void;
}

export default function ContactMessagesFilters({
  filters,
  filterCounts,
  onFilterChange,
  onRefresh
}: ContactMessagesFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: localSearch });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFilterChange({
      status: 'all',
      type: 'all',
      search: ''
    });
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'all': 'All Messages',
      'new': 'New',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return statusMap[status] || status;
  };

  const getTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'all': 'All Types',
      'general': 'General',
      'parts': 'Parts',
      'seller': 'Seller',
      'technical': 'Technical',
      'billing': 'Billing'
    };
    return typeMap[type] || type;
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') {
      return filterCounts.status.reduce((total, item) => total + item.count, 0);
    }
    return filterCounts.status.find(item => item.status === status)?.count || 0;
  };

  const getTypeCount = (type: string) => {
    if (type === 'all') {
      return filterCounts.type.reduce((total, item) => total + item.count, 0);
    }
    return filterCounts.type.find(item => item.type === type)?.count || 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
            >
              <option value="all">
                All Status ({getStatusCount('all')})
              </option>
              {filterCounts.status.map(({ status, count }) => (
                <option key={status} value={status}>
                  {getStatusDisplay(status)} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type-filter"
              value={filters.type}
              onChange={(e) => onFilterChange({ type: e.target.value })}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
            >
              <option value="all">
                All Types ({getTypeCount('all')})
              </option>
              {filterCounts.type.map(({ type, count }) => (
                <option key={type} value={type}>
                  {getTypeDisplay(type)} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Badges */}
      <div className="flex flex-wrap gap-2 mt-4">
        {filters.status !== 'all' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Status: {getStatusDisplay(filters.status)}
            <button
              onClick={() => onFilterChange({ status: 'all' })}
              className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
            >
              ×
            </button>
          </span>
        )}
        {filters.type !== 'all' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Type: {getTypeDisplay(filters.type)}
            <button
              onClick={() => onFilterChange({ type: 'all' })}
              className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
            >
              ×
            </button>
          </span>
        )}
        {filters.search && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Search: {filters.search}
            <button
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ search: '' });
              }}
              className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
}