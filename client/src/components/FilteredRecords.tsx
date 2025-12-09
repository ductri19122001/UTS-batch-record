import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, Download, Edit, ArrowLeft } from "lucide-react";
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
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

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

export default function FilteredRecords() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const [searchParams] = useSearchParams();
  const productCode = searchParams.get('productCode');

  const [search, setSearch] = useState("");
  const [data, setData] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [productName, setProductName] = useState<string>("");

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

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

  const getAuthToken = async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        scope: "openid email profile",
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      },
    });
    return token;
  };

  // Fetch filtered batch records from server
  const fetchFilteredRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!productCode) {
        setError("Product code is required");
        setLoading(false);
        return;
      }

      // Fetch batch records from API
      const response = await axios.get(`${serverUrl}/api/batchRecords`, {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });
      const batchRecords = response.data;

      if (!batchRecords || batchRecords.length === 0) {
        setData([]);
        setProductName("Unknown Product");
        return;
      }

      // Filter batch records by product code
      const filteredRecords = batchRecords.filter((record: any) =>
        record.product?.productCode === productCode
      );

      // Transform API data to match the expected format (same as Records.tsx)
      const transformedData = filteredRecords.map((record: any) => {
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
      setProductName(transformedData[0]?.name || "Unknown Product");
    } catch (err) {
      console.error("Error fetching filtered records:", err);
      setError("Failed to fetch filtered records from server");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchFilteredRecords();
  }, [productCode]);

  const filtered = data.filter((d) => {
    // Search filter (same as Records.tsx - search by product name)
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
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

  // Handle export - export directly without modal
  const handleExport = async (record: BatchRecord) => {
    try {
      // Get template data for export (using dummy template)
      const templateData = {
        id: "vaccine-production-v2",
        title: "Vaccine Manufacturing Batch Record",
        sections: [
          {
            id: "batchInfo",
            title: "Batch Information",
            fields: [
              { id: "batchNumber", label: "Batch Number", type: "text" },
              { id: "productName", label: "Product Name", type: "text" },
              {
                id: "manufacturingDate",
                label: "Manufacturing Date",
                type: "date",
              },
              { id: "expiryDate", label: "Expiry Date", type: "date" },
              {
                id: "plannedQuantity",
                label: "Planned Quantity",
                type: "number",
              },
              {
                id: "actualQuantity",
                label: "Actual Quantity",
                type: "number",
              },
              { id: "status", label: "Status", type: "select" },
            ],
          },
          {
            id: "rawMaterials",
            title: "Raw Materials & Components",
            fields: [
              { id: "materialName", label: "Material Name", type: "text" },
              { id: "supplier", label: "Supplier", type: "text" },
              { id: "lotNumber", label: "Lot Number", type: "text" },
              { id: "quantity", label: "Quantity", type: "number" },
            ],
          },
          {
            id: "processSteps",
            title: "Process Steps",
            fields: [
              { id: "stepName", label: "Step Name", type: "text" },
              { id: "startTime", label: "Start Time", type: "datetime" },
              { id: "endTime", label: "End Time", type: "datetime" },
              { id: "operator", label: "Operator", type: "text" },
            ],
          },
          {
            id: "qualityControl",
            title: "Quality Control",
            fields: [
              { id: "testName", label: "Test Name", type: "text" },
              { id: "result", label: "Result", type: "text" },
              { id: "specification", label: "Specification", type: "text" },
              { id: "status", label: "Status", type: "select" },
            ],
          },
          {
            id: "finalProduct",
            title: "Final Product Specifications",
            fields: [
              {
                id: "theoreticalYield",
                label: "Theoretical Yield",
                type: "number",
              },
              { id: "actualYield", label: "Actual Yield", type: "number" },
              {
                id: "yieldPercentage",
                label: "Yield Percentage",
                type: "number",
              },
            ],
          },
        ],
      };

      // Map BatchRecord to BatchRecordData format
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

      // Generate PDF directly
      const { generateBatchRecordPDF } = await import("../utils/pdfGenerator");
      await generateBatchRecordPDF(
        batchRecordData,
        templateData
      );
    } catch (error) {
      console.error("Error exporting batch record:", error);
    }
  };

  // Handle edit - navigate to batch record editor
  const handleEdit = (record: BatchRecord) => {
    navigate(`/BatchRecordsEditor?id=${record.id}`);
  };

  // Handle back to all records
  const handleBackToRecords = () => {
    navigate(-1);
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

  if (!productCode) {
    return (
      <div className="flex h-screen w-full bg-gray-100">
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between bg-white-100 px-4 py-3 shadow">
            <h1 className="text-xl font-bold">Product Records</h1>
          </header>
          <main className="p-4 overflow-auto">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center text-gray-500">
                <p>No product code specified</p>
                <Button
                  variant="outline"
                  onClick={handleBackToRecords}
                  className="mt-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top navbar */}
        <header className="flex items-center justify-between bg-white-100 px-4 py-3 shadow">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToRecords}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">Batch Records</h1>
              <p className="text-sm text-gray-600">
                Product: {productName} ({productCode})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search records..."
                className="pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
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

        {/* Table */}
        <main className="p-4 overflow-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading records...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-500">
                  <p>Error: {error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchFilteredRecords}
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
