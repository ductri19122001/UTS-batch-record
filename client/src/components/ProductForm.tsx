import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
    Product,
    ProductFormData
} from "@/lib/productTypes";
import { ProductCategory, ProductCategoryLabels } from "@/lib/productTypes";

interface ProductFormProps {
    product?: Product | null;
    onSave: (productData: any) => void;
    onCancel: () => void;
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
    const [formData, setFormData] = useState<ProductFormData>({
        productCode: "",
        productName: "",
        category: ProductCategory.OTHER,
        packSize: 0,
        packUnit: "",
        shelfLife: 0,
        storageConditions: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form data when product prop changes
    useEffect(() => {
        if (product) {
            setFormData({
                productCode: product.productCode,
                productName: product.productName,
                category: product.category, // ✅ category loaded from backend
                packSize: product.packSize,
                packUnit: product.packUnit,
                shelfLife: product.shelfLife,
                storageConditions: product.storageConditions || "",
            });
        }
    }, [product]);




    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.productCode.trim()) {
            newErrors.productCode = "Product code is required";
        }

        if (!formData.productName.trim()) {
            newErrors.productName = "Product name is required";
        }

        if (formData.packSize === undefined || formData.packSize === null || formData.packSize <= 0) {
            newErrors.packSize = "Pack size is required and must be greater than 0";
        }

        if (!formData.packUnit.trim()) {
            newErrors.packUnit = "Pack unit is required";
        }

        if (formData.shelfLife === undefined || formData.shelfLife === null || formData.shelfLife <= 0) {
            newErrors.shelfLife = "Shelf life is required and must be greater than 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const productData = {
            productCode: formData.productCode.trim(),
            productName: formData.productName.trim(),
            category: formData.category,
            packSize: formData.packSize,
            packUnit: formData.packUnit.trim(),
            shelfLife: formData.shelfLife,
            storageConditions: formData.storageConditions.trim() || undefined,
        };

        onSave(productData);
    };

    const handleInputChange = (field: keyof ProductFormData, value: string) => {
        let processedValue: any = value;

        // Guard against empty values for category field
        if (field === 'category' && value === '') {
            return;
        }

        if (field === 'packSize' || field === 'shelfLife') {
            processedValue = value === '' ? 0 : parseFloat(value);
            if (isNaN(processedValue)) processedValue = 0;
        }

        setFormData(prev => ({ ...prev, [field]: processedValue }));
    }


    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>
                    {product ? "Edit Product" : "Add New Product"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product Code */}
                        <div className="space-y-2">
                            <Label htmlFor="productCode">Product Code *</Label>
                            <Input
                                id="productCode"
                                value={formData.productCode}
                                onChange={(e) => handleInputChange("productCode", e.target.value)}
                                placeholder="Enter product code"
                                className={errors.productCode ? "border-red-500" : ""}
                            />
                            {errors.productCode && (
                                <p className="text-sm text-red-500">{errors.productCode}</p>
                            )}
                        </div>

                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label htmlFor="productName">Product Name *</Label>
                            <Input
                                id="productName"
                                value={formData.productName}
                                onChange={(e) => handleInputChange("productName", e.target.value)}
                                placeholder="Enter product name"
                                className={errors.productName ? "border-red-500" : ""}
                            />
                            {errors.productName && (
                                <p className="text-sm text-red-500">{errors.productName}</p>
                            )}
                        </div>

                        {/* Pack Size */}
                        <div className="space-y-2">
                            <Label htmlFor="packSize">Pack Size *</Label>
                            <Input
                                id="packSize"
                                type="number"
                                value={formData.packSize}
                                onChange={(e) => handleInputChange("packSize", e.target.value)}
                                placeholder="Enter pack size"
                                className={errors.packSize ? "border-red-500" : ""}
                            />
                            {errors.packSize && (
                                <p className="text-sm text-red-500">{errors.packSize}</p>
                            )}
                        </div>

                        {/* Pack Unit */}
                        <div className="space-y-2">
                            <Label htmlFor="packUnit">Pack Unit *</Label>
                            <Input
                                id="packUnit"
                                value={formData.packUnit}
                                onChange={(e) => handleInputChange("packUnit", e.target.value)}
                                placeholder="Enter pack unit (e.g., ml, g, tablets)"
                                className={errors.packUnit ? "border-red-500" : ""}
                            />
                            {errors.packUnit && (
                                <p className="text-sm text-red-500">{errors.packUnit}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Shelf Life */}
                        <div className="space-y-2">
                            <Label htmlFor="shelfLife">Shelf Life (months) *</Label>
                            <Input
                                id="shelfLife"
                                type="number"
                                value={formData.shelfLife}
                                onChange={(e) => handleInputChange("shelfLife", e.target.value)}
                                placeholder="Enter shelf life in months"
                                className={errors.shelfLife ? "border-red-500" : ""}
                            />
                            {errors.shelfLife && (
                                <p className="text-sm text-red-500">{errors.shelfLife}</p>
                            )}
                        </div>

                        {/* Product Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Product Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value: string) => handleInputChange("category", value as ProductCategory)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select product category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ProductCategoryLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Storage Conditions */}
                    <div className="space-y-2">
                        <Label htmlFor="storageConditions">Storage Conditions</Label>
                        <Textarea
                            id="storageConditions"
                            value={formData.storageConditions}
                            onChange={(e) => handleInputChange("storageConditions", e.target.value)}
                            placeholder="Enter storage conditions (optional)"
                            rows={3}
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {product ? "Update Product" : "Add Product"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
