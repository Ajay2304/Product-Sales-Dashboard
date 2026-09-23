import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

interface ProductResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', sku: '', price: '' });

  const itemsPerPage = 10;

  const fetchProducts = useCallback(async (requestedPage: number, requestedSearch: string) => {
    try {
      setLoading(true);
      const response = await api.get<ProductResponse>('/products', {
        params: {
          page: requestedPage,
          limit: itemsPerPage,
          search: requestedSearch || undefined
        }
      });
      setProducts(response.data.data);
      setTotalPages(response.data.meta.totalPages || 1);
      setError('');
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page, search);
  }, [fetchProducts, page, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      price: Number(formData.price)
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: '', sku: '', price: '' });
      fetchProducts(page, search);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      fetchProducts(page, search);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: '' });
    setShowModal(true);
  };

  if (loading) {
    return <div className="section-state">Loading products...</div>;
  }

  if (error) {
    return <div className="section-state section-error">{error}</div>;
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Create, update, and manage your active catalog.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-success">
          + Add Product
        </button>
      </div>

      <div className="controls-row">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">No matching products found.</td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>
                  <span className={product.isActive ? 'status-pill active' : 'status-pill inactive'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="link-btn" onClick={() => handleEdit(product)}>Edit</button>
                    <button type="button" className="link-btn danger" onClick={() => handleDelete(product._id)}>Deactivate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
          Next
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="sku">SKU</label>
                <input
                  id="sku"
                  type="text"
                  value={formData.sku}
                  onChange={(event) => setFormData({ ...formData, sku: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="price">Price</label>
                <input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price}
                  onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-muted" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
