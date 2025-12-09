import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit, Eye, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Product,
  ProductFilters
} from "@/lib/productTypes";
import { ProductCategoryLabels } from "@/lib/productTypes";
import axios from "axios";
import ProductForm from "./ProductForm.tsx";

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});

  const serverUrl = import.meta.env.VITE_API_SERVER_URL || '';
  // Fetch products from server
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch products from API
      const response = await axios.get(`${serverUrl}/api/products`);
      const products = response.data;

      if (!products || products.length === 0) {
        setData([]);
        return;
      }

      setData(products);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products from server");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = data.filter((product) => {
    const matchesSearch = !search ||
      product.productName.toLowerCase().includes(search.toLowerCase()) ||
      product.productCode.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !filters.category || product.category === filters.category;
    const matchesActive = filters.isActive === undefined || product.isActive === filters.isActive;

    return matchesSearch && matchesCategory && matchesActive;
  });

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.length === filtered.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filtered.map((product) => product.id));
    }
  };

  // Handle add new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  // Handle view records for product
  const handleViewRecords = (product: Product) => {
    navigate(`/records/filtered?productCode=${product.productCode}`);
  };

  // Handle delete product
  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${serverUrl}/api/products/${product.id}`);
      console.log('Product deleted successfully');

      // Refresh the product list
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  // Handle form save
  const handleFormSave = async (productData: any) => {
    try {
      setLoading(true);

      if (editingProduct) {
        // Update existing product
        const response = await axios.put(`${serverUrl}/api/products/${editingProduct.id}`, productData);
        console.log('Product updated successfully:', response.data);
      } else {
        // Add new product
        const response = await axios.post(`${serverUrl}/api/products`, productData);
        console.log('Product created successfully:', response.data);
      }

      // Refresh the product list to get the latest data from server
      await fetchProducts();

      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Top navbar */}
        <header className="flex items-center justify-between bg-white-100 px-4 py-3 shadow">
          <h1 className="text-xl font-bold">Products</h1>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-8 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Filter by Product Category */}
            <Select value={filters.category || "all"} onValueChange={(value) =>
              setFilters(prev => ({ ...prev, category: value === "all" ? undefined : value as any }))
            }>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Product Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(ProductCategoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Filter by Active Status */}
            <Select value={filters.isActive === undefined ? "all" : filters.isActive.toString()} onValueChange={(value) =>
              setFilters(prev => ({ ...prev, isActive: value === "all" ? undefined : value === "true" }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="default" size="sm" onClick={handleAddProduct}>
              <Plus className="w-4 h-4 mr-1" /> Add Product
            </Button>
          </div>
        </header>

        {/* Table */}
        <main className="p-4 overflow-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading products...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-500">
                  <p>Error: {error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchProducts}
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
                          selectedProducts.length === filtered.length &&
                          filtered.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pack Size</TableHead>
                    <TableHead>Shelf Life</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-gray-500"
                      >
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductSelect(product.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.productCode}
                        </TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {ProductCategoryLabels[product.category as keyof typeof ProductCategoryLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.packSize} {product.packUnit}</TableCell>
                        <TableCell>{product.shelfLife} months</TableCell>
                        <TableCell>
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                            className={product.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRecords(product)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Records
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
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

      {/* Product Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={editingProduct}
              onSave={handleFormSave}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
