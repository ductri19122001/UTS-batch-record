import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Download, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TemplateSelectionModal from "./TemplateSelectionModal";
import BatchCreationForm from "./BatchCreationForm";
import { useBatchCreation } from "@/hooks/useBatchCreation";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

interface BatchRecord {
  id: string;
  name: string;
  mfg: string;
  exp: string;
  type: string;
  size: string;
  code: string;
  batch: string;
  actualQuantity?: number;
  unit: string;
  productionUnit: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  releasedAt?: string;
  status?: string;
  productName?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  plannedQuantity?: number;
  batchNumber?: string;
  // Additional fields for PDF export
  materialIssuances?: any[];
  processSteps?: any[];
  qualityChecks?: any[];
  samples?: any[];
  envReadings?: any[];
  yieldCalc?: any;
  deviations?: any[];
  attachments?: any[];
  auditLogs?: any[];
  equipmentChecks?: any[];
}

export default function BatchRecords() {
  const navigate = useNavigate();
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const serverPath = import.meta.env.VITE_API_SERVER_URL as string;
  const [search, setSearch] = useState("");
  const [data, setData] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Use the reusable batch creation hook
  const {
    isTemplateModalOpen,
    selectedTemplate,
    products,
    creationForm,
    createError,
    creating,
    handleAddNewBatch,
    closeTemplateModal,
    handleTemplateSelect,
    resetCreationFlow,
    handleCreationInputChange,
    handleCreateBatchRecord,
  } = useBatchCreation();

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  const getAuthToken = async () => {
    const token = getAccessTokenSilently({
      authorizationParams: {
        scope: "openid email profile",
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }
    })
    return token
  }

  // Fetch batch records from server
  const fetchBatchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const serverPath = import.meta.env.VITE_API_SERVER_URL as string;
      const token = await getAuthToken();
      const response = await axios.get(`${serverPath}/api/batchRecords`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const batchRecords = response.data;

      if (!batchRecords || !Array.isArray(batchRecords)) {
        console.error("Batch records is not an array:", batchRecords);
        setData([]);
        return;
      }

      if (batchRecords.length === 0) {
        setData([]);
        return;
      }

      // Transform API data to match the expected format
      const transformedData = batchRecords.map((record: any) => {
        // Helper function to safely get nested values
        const getNestedValue = (
          obj: any,
          path: string,
          fallback: any = "Unknown"
        ) => {
          return (
            path.split(".").reduce((current, key) => current?.[key], obj) ||
            fallback
          );
        };

        return {
          id: record.id, // This is the Prisma ID
          name: getNestedValue(
            record,
            "product.productName",
            "Unknown Product"
          ),
          mfg: new Date(record.manufacturingDate).toISOString().split("T")[0],
          exp: new Date(record.expiryDate).toISOString().split("T")[0],
          type: getNestedValue(record, "product.category", "Unknown"),
          size:
            getNestedValue(record, "product.packSize", "0")?.toString() || "0",
          code: getNestedValue(record, "product.productCode", "Unknown"),
          batch: record.batchNumber,
          actualQuantity: record.actualQuantity,
          unit: record.unit,
          productionUnit: record.productionUnit || "Unknown",
          createdBy: getNestedValue(record, "creator.name", "Unknown"),
          approvedBy: getNestedValue(record, "approver.name"),
          approvedAt: record.approvedAt,
          releasedAt: record.releasedAt,
          status: record.status,
          productName: getNestedValue(record, "product.productName"),
          manufacturingDate: record.manufacturingDate,
          expiryDate: record.expiryDate,
          plannedQuantity: record.plannedQuantity,
          batchNumber: record.batchNumber,
        };
      });

      setData(transformedData);
    } catch (err) {
      console.error("Error fetching batch records:", err);
      setError("Failed to fetch batch records from server");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchBatchRecords();
  }, []);


  const filtered = data.filter((d) => {
    // Search filter
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());

    // Status filter
    const matchesStatus = !statusFilter || d.status === statusFilter;

    // Category filter
    const matchesCategory =
      !categoryFilter ||
      d.type.toLowerCase().includes(categoryFilter.toLowerCase());

    // Date range filter
    const matchesDateRange = (() => {
      if (!dateFromFilter && !dateToFilter) return true;

      const mfgDate = new Date(d.mfg);
      const fromDate = dateFromFilter ? new Date(dateFromFilter) : null;
      const toDate = dateToFilter ? new Date(dateToFilter) : null;

      if (fromDate && toDate) {
        return mfgDate >= fromDate && mfgDate <= toDate;
      } else if (fromDate) {
        return mfgDate >= fromDate;
      } else if (toDate) {
        return mfgDate <= toDate;
      }
      return true;
    })();

    return (
      matchesSearch && matchesStatus && matchesCategory && matchesDateRange
    );
  });

  // Handle record selection
  const handleRecordSelect = (recordId: string) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRecords.length === filtered.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filtered.map((record) => record.id));
    }
  };

  const handleExport = async (record: BatchRecord) => {
    try {
      // Fetch batch record info to get templateId and templateVersionId
      const batchRecordInfoResponse = await axios.get(
        `${serverPath}/api/batchRecords/${record.id}`
      );
      const batchRecordInfo = batchRecordInfoResponse.data;

      if (!batchRecordInfo.templateId || !batchRecordInfo.templateVersionId) {
        console.error("Batch record missing template information");
        alert("Unable to export: Batch record is missing template information");
        return;
      }

      // Fetch the actual template version
      const templateResponse = await axios.get(
        `${serverPath}/api/templates/${batchRecordInfo.templateId}/versions/${batchRecordInfo.templateVersionId}`
      );
      const versionPayload = templateResponse.data;
      const templateData = versionPayload?.data ?? {};

      if (!templateData.sections || !Array.isArray(templateData.sections)) {
        console.error("Template data is missing sections");
        alert("Unable to export: Template data is invalid");
        return;
      }

      const sectionsResponse = await axios.get(
        `${serverPath}/api/batchRecordSections/${record.id}`
      );
      const sectionsData = sectionsResponse.data?.sections ?? {};
      const sectionsMetadata = sectionsResponse.data?.metadata ?? {};

      const flattenSections = (
        sections: Record<string, any>,
        metadata: Record<string, any>
      ): Record<string, any> => {
        const flattened: Record<string, any> = {};

        const visit = (sectionId: string, data: any) => {
          flattened[sectionId] = data;

          if (!data || typeof data !== "object") return;

          Object.entries(data).forEach(([key, value]) => {
            if (
              metadata?.[key] &&
              value !== null &&
              typeof value === "object" &&
              !Array.isArray(value)
            ) {
              visit(key, value);
            }
          });
        };

        Object.entries(sections || {}).forEach(([sectionId, data]) =>
          visit(sectionId, data)
        );

        return flattened;
      };

      const flattenedSections = flattenSections(sectionsData, sectionsMetadata);

      const batchRecordData = {
        id: record.id,
        batchNumber: record.batchNumber || record.batch,
        productId: record.id,
        formulationId: record.id,
        plannedQuantity: record.plannedQuantity || 0,
        actualQuantity: record.actualQuantity || null,
        unit: record.unit,
        status: record.status || "IN_PROGRESS",
        manufacturingDate: record.manufacturingDate || record.mfg,
        expiryDate: record.expiryDate || record.exp,
        productionUnit: record.productionUnit,
        createdBy: record.createdBy,
        approvedBy: record.approvedBy,
        approvedAt: record.approvedAt,
        releasedAt: record.releasedAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        productName: record.productName || record.name,
        product: {
          name: record.productName || record.name,
          description: record.type,
        },
        formulation: {
          version: "1.0",
        },
        sections: flattenedSections,
        sectionsMetadata: sectionsMetadata,
        materialIssuances: record.materialIssuances || [],
        packagingIssuances: [],
        equipmentChecks: record.equipmentChecks || [],
        processSteps: record.processSteps || [],
        qualityChecks: record.qualityChecks || [],
        samples: record.samples || [],
        envReadings: record.envReadings || [],
        yieldCalc: record.yieldCalc,
        deviations: record.deviations || [],
        attachments: record.attachments || [],
        auditLogs: record.auditLogs || [],
      };

      const { generateBatchRecordPDF } = await import("../utils/pdfGenerator");
      await generateBatchRecordPDF(batchRecordData, templateData);

      if (user?.sub && isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              scope: "openid profile email",
            },
          });

          await axios.post(
            `${serverPath}/api/logs`,
            {
              userId: user.sub,
              action: "PDF_EXPORTED",
              entityType: "BatchRecord",
              entityId: record.id,
              batchRecordId: record.id,
              newValue: {
                batchNumber: record.batchNumber || record.batch,
                productName: record.productName || record.name,
                exportType: "PDF",
                timestamp: new Date().toISOString(),
              },
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch (auditError) {
          console.error("Failed to log PDF export to audit log:", auditError);
        }
      }
    } catch (error) {
      console.error("Error exporting batch record:", error);
      alert("Failed to export batch record. Please try again.");
    }
  };

  // Handle edit
  const handleEdit = (record: BatchRecord) => {
    // Navigate to batch record editor with the Prisma ID
    navigate(`/BatchRecordsEditor?id=${record.id}`);
  };


  // Filter functions
  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setCategoryFilter("");
    setDateFromFilter("");
    setDateToFilter("");
  };

  // Get all possible statuses from the database schema
  const getAllStatuses = () => {
    return [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "RELEASED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ];
  };

  // Show batch creation form if template is selected
  if (selectedTemplate) {
    return (
      <BatchCreationForm
        selectedTemplate={selectedTemplate}
        products={products}
        creationForm={creationForm}
        createError={createError}
        creating={creating}
        onInputChange={handleCreationInputChange}
        onSubmit={handleCreateBatchRecord}
        onBack={resetCreationFlow}
      />
    );
  }

  // Get all possible categories from the database schema
  const getAllCategories = () => {
    return ["TABLET", "CAPSULE", "LIQUID", "OINTMENT", "POWDER", "OTHER"];
  };

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top navbar */}
        <header className="flex items-center justify-between bg-white-100 px-4 py-3 shadow">
          <h1 className="text-xl font-bold">Batch Records</h1>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search"
                className="pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleFilterToggle}>
              <Filter className="w-4 h-4 mr-1" /> Filter
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                selectedRecords.length > 0 &&
                handleExport(data.find((d) => d.id === selectedRecords[0])!)
              }
              disabled={selectedRecords.length === 0}
            >
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button variant="default" size="sm" onClick={handleAddNewBatch}>
              Add New Batch
            </Button>
          </div>
        </header>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Status Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Statuses</option>
                  {getAllStatuses().map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Categories</option>
                  {getAllCategories().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="YYYY-MM-DD"
                />
              </div>

              {/* Date To Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="YYYY-MM-DD"
                />
              </div>

              {/* Clear Filters Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-8"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <main className="p-4 overflow-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading batch records...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-500">
                  <p>Error: {error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchBatchRecords}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={
                          selectedRecords.length === filtered.length &&
                          filtered.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Manufacture Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pack Size (kg)</TableHead>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-gray-500"
                      >
                        No batch records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(d.id)}
                            onChange={() => handleRecordSelect(d.id)}
                          />
                        </TableCell>
                        <TableCell>{d.name}</TableCell>
                        <TableCell>{d.mfg}</TableCell>
                        <TableCell>{d.exp}</TableCell>
                        <TableCell>{d.type}</TableCell>
                        <TableCell>{d.size}</TableCell>
                        <TableCell>{d.code}</TableCell>
                        <TableCell>{d.batch}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${d.status === "RELEASED"
                              ? "bg-green-100 text-green-800"
                              : d.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : d.status === "IN_PROGRESS"
                                  ? "bg-purple-100 text-purple-800"
                                  : d.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {d.status || "PENDING"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(d)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport(d)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </main>
      </div>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={closeTemplateModal}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  );
}
