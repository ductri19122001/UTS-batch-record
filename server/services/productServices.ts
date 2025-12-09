import { PrismaClient } from "@prisma/client";
import type { Product } from "@prisma/client";


const prisma = new PrismaClient()

export async function fetchProducts(): Promise<Product[]> {
    const products: Product[] = await prisma.product.findMany()
    return products
}

export async function addProduct(data: Product): Promise<Product> {
    const product: Product = await prisma.product.create({ data })
    return product
}

export async function fetchProductById(productId: string): Promise<Product | null> {
    return prisma.product.findUnique({
        where: { id: productId }
    })
}


export async function fetchProductByCode(productCode: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
        where: {
            productCode: productCode
        }
    })
    return product
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<Product | null> {
    const product = await prisma.product.update({
        where: {
            id: productId
        },
        data
    })
    return product
}

export async function deleteProduct(productId: string): Promise<Product | null> {
    const product = await prisma.product.delete({
        where: {
            id: productId
        }
    })
    return product
}
