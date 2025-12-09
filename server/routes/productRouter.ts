import express from 'express';
import {
    getProducts,
    getProductById,
    getProductByCode,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

// Get all products
router.get('/', getProducts);

// Get product by ID
router.get('/:id', getProductById);

// Get product by code
router.get('/code/:code', getProductByCode);

// Create new product
router.post('/', createProduct);

// Update product
router.put('/:id', updateProduct);

// Delete product
router.delete('/:id', deleteProduct);

export default router;
