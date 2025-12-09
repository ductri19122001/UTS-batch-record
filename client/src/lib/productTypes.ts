// Product types and interfaces for the product management system

export interface Product {
    id: string;
    productCode: string;
    productName: string;
    category: ProductCategory;
    packSize: number;
    packUnit: string;
    shelfLife: number;
    storageConditions?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductRequest {
    productCode: string;
    productName: string;
    category: ProductCategory;
    packSize: number;
    packUnit: string;
    shelfLife: number;
    storageConditions?: string;
}

export interface UpdateProductRequest {
    productName?: string;
    category?: ProductCategory;
    packSize?: number;
    packUnit?: string;
    shelfLife?: number;
    storageConditions?: string;
    isActive?: boolean;
}

export const ProductCategory = {
    TABLET: 'TABLET',
    CAPSULE: 'CAPSULE',
    LIQUID: 'LIQUID',
    OINTMENT: 'OINTMENT',
    POWDER: 'POWDER',
    OTHER: 'OTHER'
} as const;

export type ProductCategory = typeof ProductCategory[keyof typeof ProductCategory];

export const ProductCategoryLabels = {
    TABLET: 'Tablet',
    CAPSULE: 'Capsule',
    LIQUID: 'Liquid',
    OINTMENT: 'Ointment',
    POWDER: 'Powder',
    OTHER: 'Other'
};

export interface ProductFormData {
    productCode: string;
    productName: string;
    category: ProductCategory;
    packSize: number;
    packUnit: string;
    shelfLife: number;
    storageConditions: string;
}

export interface ProductFilters {
    search?: string;
    category?: ProductCategory;
    isActive?: boolean;
}