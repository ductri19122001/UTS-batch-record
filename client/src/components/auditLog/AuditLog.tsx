import React, { useState, useEffect } from "react";
import { Search, Filter, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Type definition for audit log entry
interface AuditLogEntry {
  id: number;
  timestamp: string;
  user: string;
  batchName: string;
  batchCode: string;
  templateName?: string;
  templateId?: string;
  entityType?: string;
  action: string;
  details?: {
    [key: string]: any;
  };
}

// Type definition for API response
interface AuditLogResponse {
  success: boolean;
  data: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

// Type definition for filters
interface Filters {
  user: string;
  batchName: string;
  batchCode: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}

const AuditLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [auditData, setAuditData] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    user: "",
    batchName: "",
    batchCode: "",
    action: "",
    dateFrom: "",
    dateTo: "",
  });
  const [activeFilters, setActiveFilters] = useState<Filters>({
    user: "",
    batchName: "",
    batchCode: "",
    action: "",
    dateFrom: "",
    dateTo: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
    null
  );
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  // Fetch audit logs from server
  const fetchAuditLogs = async (search?: string, filters?: Filters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) {
        params.append("search", search);
      }

      // Add filter parameters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value);
          }
        });
      }

      const response = await axios.get<AuditLogResponse>(
        `http://localhost:3001/api/logs?${params.toString()}`
      );

      if (response.data.success) {
        setAuditData(response.data.data);
      } else {
        setError("Failed to fetch audit logs");
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to fetch audit logs from server");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Fetch data when search term or filters change (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAuditLogs(searchTerm, activeFilters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeFilters]);

  // Filter functions
  const applyFilters = () => {
    setActiveFilters(filters);
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      user: "",
      batchName: "",
      batchCode: "",
      action: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setIsFilterOpen(false);
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (value) => value !== ""
  );

  // Handle row click to show details
  const handleRowClick = async (entry: AuditLogEntry) => {
    try {
      const response = await axios.get<{
        success: boolean;
        data: AuditLogEntry;
      }>(`http://localhost:3001/api/logs/${entry.id}`);

      if (response.data.success) {
        setSelectedEntry(response.data.data);
        setIsSidePanelOpen(true);
      }
    } catch (err) {
      console.error("Error fetching audit log detail:", err);
    }
  };

  // Close side panel
  const closeSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedEntry(null);
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content Area */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header with title and search */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Audit log</h1>

              <div className="flex items-center space-x-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {/* Filter Button */}
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={hasActiveFilters ? "default" : "outline"}
                      size="sm"
                      className={
                        hasActiveFilters ? "bg-blue-600 hover:bg-blue-700" : ""
                      }
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {hasActiveFilters && (
                        <span className="ml-2 bg-white text-blue-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                          {
                            Object.values(activeFilters).filter((v) => v !== "")
                              .length
                          }
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Filter Audit Logs
                        </h3>
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Clear All
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            User
                          </label>
                          <Input
                            value={filters.user}
                            onChange={(e) =>
                              setFilters({ ...filters, user: e.target.value })
                            }
                            placeholder="Filter by user"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Batch Name
                          </label>
                          <Input
                            value={filters.batchName}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                batchName: e.target.value,
                              })
                            }
                            placeholder="Filter by batch name"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Batch Code
                          </label>
                          <Input
                            value={filters.batchCode}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                batchCode: e.target.value,
                              })
                            }
                            placeholder="Filter by batch code"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Action
                          </label>
                          <Input
                            value={filters.action}
                            onChange={(e) =>
                              setFilters({ ...filters, action: e.target.value })
                            }
                            placeholder="Filter by action"
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date From
                          </label>
                          <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                dateFrom: e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date To
                          </label>
                          <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) =>
                              setFilters({ ...filters, dateTo: e.target.value })
                            }
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsFilterOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={applyFilters}>
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">
                    Active Filters:
                  </span>
                  {Object.entries(activeFilters).map(([key, value]) => {
                    if (value) {
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {key}: {value}
                          <button
                            onClick={() => {
                              const newFilters = {
                                ...activeFilters,
                                [key]: "",
                              };
                              setActiveFilters(newFilters);
                              setFilters(newFilters);
                            }}
                            className="ml-1 hover:text-blue-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading audit logs...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditData.map((entry: AuditLogEntry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(entry)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.templateName || entry.batchName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono text-xs">
                        {entry.templateId || entry.batchCode || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{entry.action}</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Show total count */}
          {!loading && !error && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {auditData.length} audit log entries
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side Panel for Audit Log Details */}
      {isSidePanelOpen && selectedEntry && (
        <div className="fixed inset-y-0 right-0 w-1/3 bg-white shadow-2xl border-l border-gray-200 z-50">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Audit Log Entry
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Detailed information
                </p>
              </div>
              <button
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                onClick={closeSidePanel}
              >
                <span className="text-gray-500 text-lg">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Basic Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timestamp
                      </label>
                      <p className="text-base text-gray-900">
                        {formatTimestamp(selectedEntry.timestamp)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User
                      </label>
                      <p className="text-base text-gray-900">
                        {selectedEntry.user}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Action
                      </label>
                      <p className="text-base text-gray-900">
                        {selectedEntry.action}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedEntry.entityType === 'BatchRecordTemplate' || selectedEntry.entityType === 'TemplateVersion' || selectedEntry.entityType === 'TemplateRule' 
                          ? 'Template Name' 
                          : 'Batch Name'}
                      </label>
                      <p className="text-base text-gray-900">
                        {selectedEntry.templateName || selectedEntry.batchName || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {selectedEntry.entityType === 'BatchRecordTemplate' || selectedEntry.entityType === 'TemplateVersion' || selectedEntry.entityType === 'TemplateRule' 
                          ? 'Template ID' 
                          : 'Batch Code'}
                      </label>
                      <p className="text-base text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                        {selectedEntry.templateId || selectedEntry.batchCode || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Information */}
                {selectedEntry.details && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Additional Details
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(selectedEntry.details).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="border-b border-gray-100 pb-4 last:border-b-0"
                          >
                            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </label>
                            <div className="text-base text-gray-900">
                              {Array.isArray(value) ? (
                                <div className="flex flex-wrap gap-2">
                                  {value.map((item, index) => (
                                    <span
                                      key={index}
                                      className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : typeof value === "object" && value !== null ? (
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                  {Object.entries(value).map(
                                    ([subKey, subValue]) => (
                                      <div
                                        key={subKey}
                                        className="flex flex-col space-y-1"
                                      >
                                        <span className="text-sm font-medium text-gray-600">
                                          {subKey}:
                                        </span>
                                        <pre className="text-xs text-gray-900 font-mono bg-white p-2 rounded border overflow-x-auto">
                                          {typeof subValue === "object" && subValue !== null
                                            ? JSON.stringify(subValue, null, 2)
                                            : String(subValue)}
                                        </pre>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <p className="text-base text-gray-900 leading-relaxed">
                                  {String(value)}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
