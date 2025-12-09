import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useBatchCreation } from "@/hooks/useBatchCreation";

interface ProductSummary {
    id: string;
    productName: string;
    productCode: string;
}

interface TemplateSummary {
    id: string;
    title: string;
    description?: string;
}

interface BatchCreationFormProps {
    selectedTemplate: TemplateSummary;
    products: ProductSummary[];
    creationForm: ReturnType<typeof useBatchCreation>["creationForm"];
    createError: string | null;
    creating: boolean;
    onInputChange: (field: string, value: string) => void;
    onSubmit: (event: React.FormEvent) => void;
    onBack: () => void;
}

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

export default function BatchCreationForm({
    selectedTemplate,
    products,
    creationForm,
    createError,
    creating,
    onInputChange,
    onSubmit,
    onBack,
}: BatchCreationFormProps) {
    return (
        <div className="flex h-screen w-full bg-gray-100">
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Create Batch Record
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Template:{" "}
                            <span className="font-medium">{selectedTemplate.title}</span>
                        </p>
                    </header>

                    <div className="bg-white shadow rounded-lg p-6">
                        {createError && (
                            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                                {createError}
                            </div>
                        )}

                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="productId">Product</Label>
                                    <Select
                                        value={creationForm.productId}
                                        onValueChange={(value) => onInputChange("productId", value)}
                                    >
                                        <SelectTrigger id="productId">
                                            <SelectValue placeholder="Select a product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.productName} ({product.productCode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="plannedQuantity">Planned Quantity</Label>
                                    <Input
                                        id="plannedQuantity"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={creationForm.plannedQuantity}
                                        onChange={(e) =>
                                            onInputChange("plannedQuantity", e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="actualQuantity">Actual Quantity</Label>
                                    <Input
                                        id="actualQuantity"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={creationForm.actualQuantity}
                                        onChange={(e) =>
                                            onInputChange("actualQuantity", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="unit">Unit</Label>
                                    <Input
                                        id="unit"
                                        value={creationForm.unit}
                                        onChange={(e) => onInputChange("unit", e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="shelfLifeMonths">Shelf Life (months)</Label>
                                    <Input
                                        id="shelfLifeMonths"
                                        type="number"
                                        min="0"
                                        value={creationForm.shelfLifeMonths}
                                        onChange={(e) =>
                                            onInputChange("shelfLifeMonths", e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="manufacturingDate">
                                        Manufacturing Date
                                    </Label>
                                    <Input
                                        id="manufacturingDate"
                                        type="date"
                                        value={creationForm.manufacturingDate}
                                        onChange={(e) =>
                                            onInputChange("manufacturingDate", e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="expiryDate">Expiry Date</Label>
                                    <Input
                                        id="expiryDate"
                                        type="date"
                                        value={creationForm.expiryDate}
                                        onChange={(e) =>
                                            onInputChange("expiryDate", e.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={creationForm.status}
                                        onValueChange={(value) => onInputChange("status", value)}
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAllStatuses().map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Button type="button" variant="outline" onClick={onBack}>
                                    Back
                                </Button>
                                <Button type="submit" disabled={creating}>
                                    {creating ? "Creating..." : "Create Batch Record"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

