import { fetchProductById, fetchProducts, addProduct, fetchProductByCode, updateProduct as updateProductService, deleteProduct as deleteProductService } from "../services/productServices.js";
import type { Request, Response } from 'express'

export const listProducts = async (req: Request, resp: Response) => {
    try {
        const products = await fetchProducts()
        return resp.status(200).json(products)
    } catch (error) {
        console.error(`Error fetching Products`, error)
        return resp.status(500).json({ error: `Failed to fetch products` })
    }
}

export const createProduct = async (req: Request, resp: Response) => {
    try {
        const product = await addProduct(req.body)
        return resp.status(201).json(product)
    } catch (error) {
        console.error('Error creating product:', error)
        return resp.status(500).json({ error: 'Failed to create product' })
    }
}

export const getProductById = async (req: Request, resp: Response) => {
    if (!req.params.id) {
        return resp.status(400).json({ error: "No Product ID Provided" })
    }
    try {
        const product = await fetchProductById(req.params.id) // Ensure fetchProductById includes `category`
        if (!product) {
            return resp.status(404).json({ error: "Product not found" })
        }
        return resp.status(200).json(product)
    } catch (error) {
        console.error(`Error fetching product`, error)
        return resp.status(500).json({ error: `Failed to fetch product` })
    }
}


// Alias for listProducts to match router import
export const getProducts = listProducts;

export const getProductByCode = async (req: Request, resp: Response) => {
    if (!req.params.code) {
        return resp.status(400).json({ error: "No Product Code Provided" })
    }
    try {
        const product = await fetchProductByCode(req.params.code)

        if (!product) {
            return resp.status(404).json({ error: "Product not found" })
        }

        return resp.status(200).json(product)
    } catch (error) {
        console.error(`Error fetching product by code`, error)
        return resp.status(500).json({ error: `Failed to fetch product` })
    }
}

export const updateProduct = async (req: Request, resp: Response) => {
    if (!req.params.id) {
        return resp.status(400).json({ error: "No Product ID Provided" });
    }

    try {
        const product = await updateProductService(req.params.id, req.body);

        if (!product) {
            return resp.status(404).json({ error: "Product not found" });
        }

        return resp.status(200).json(product);
    } catch (error) {
        console.error(`Error updating product`, error);
        return resp.status(500).json({ error: `Failed to update product` });
    }
};

export const deleteProduct = async (req: Request, resp: Response) => {
    if (!req.params.id) {
        return resp.status(400).json({ error: "No Product ID Provided" })
    }
    try {
        const product = await deleteProductService(req.params.id)

        if (!product) {
            return resp.status(404).json({ error: "Product not found" })
        }

        return resp.status(200).json({ message: "Product deleted successfully", product })
    } catch (error) {
        console.error(`Error deleting product`, error)
        return resp.status(500).json({ error: `Failed to delete product` })
    }
}