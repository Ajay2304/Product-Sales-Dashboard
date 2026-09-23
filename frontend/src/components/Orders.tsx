import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  isActive: boolean;
}

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  customerName: string;
  orderDate: string;
  items: OrderItem[];
  totalAmount: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number }[]>([]);

  const itemsPerPage = 10;

  const fetchOrders = useCallback(async (requestedPage: number, requestedSearch: string) => {
    try {
      setLoading(true);
      const response = await api.get<PaginatedResponse<Order>>('/orders', {
        params: {
          page: requestedPage,
          limit: itemsPerPage,
          search: requestedSearch || undefined
        }
      });
      setOrders(response.data.data);
      setTotalPages(response.data.meta.totalPages || 1);
    } catch (err) {
      alert('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveProducts = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<Product>>('/products', {
        params: { page: 1, limit: 100 }
      });
      setProducts(response.data.data.filter((product) => product.isActive));
    } catch (err) {
      alert('Failed to load products');
    }
  }, []);

  useEffect(() => {
    fetchActiveProducts();
  }, [fetchActiveProducts]);

  useEffect(() => {
    fetchOrders(page, search);
  }, [fetchOrders, page, search]);

  const total = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const product = products.find((entry) => entry._id === item.productId);
      if (!product) {
        return sum;
      }
      return sum + product.price * item.quantity;
    }, 0);
  }, [orderItems, products]);

  const addItemRow = () => {
    setOrderItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  };

  const updateItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      if (field === 'productId') {
        updated[index].productId = value as string;
      } else {
        updated[index].quantity = Math.max(1, Number(value) || 1);
      }
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Customer name is required');
      return;
    }

    if (orderItems.length === 0) {
      alert('Add at least one order item');
      return;
    }

    if (orderItems.some((item) => !item.productId || item.quantity < 1)) {
      alert('Please select valid products and quantities');
      return;
    }

    try {
      await api.post('/orders', {
        customerName: customerName.trim(),
        items: orderItems
      });
      setShowModal(false);
      setCustomerName('');
      setOrderItems([]);
      fetchOrders(page, search);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create order');
    }
  };

  if (loading) {
    return <div className="section-state">Loading orders...</div>;
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Create orders and track customer purchase history.</p>
        </div>
        <button
          onClick={() => {
            setCustomerName('');
            setOrderItems([]);
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + New Order
        </button>
      </div>

      <div className="controls-row">
        <input
          type="text"
          placeholder="Search by customer name..."
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
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-cell">No orders found.</td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id.slice(-6)}</td>
                <td>{order.customerName}</td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>
                  {order.items.map((item, index) => (
                    <div key={`${order._id}-${index}`}>
                      {item.productName} x {item.quantity}
                    </div>
                  ))}
                </td>
                <td>${order.totalAmount.toFixed(2)}</td>
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
          <div className="modal-card modal-card-wide">
            <h2>Create New Order</h2>
            <form onSubmit={handleCreateOrder}>
              <div className="field">
                <label htmlFor="customerName">Customer Name</label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                />
              </div>

              <div className="order-items">
                <div className="order-items-head">
                  <h3>Order Items</h3>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addItemRow}>
                    + Add Item
                  </button>
                </div>

                {orderItems.length === 0 && (
                  <p className="muted">No items added yet.</p>
                )}

                {orderItems.map((item, index) => (
                  <div className="order-item-row" key={index}>
                    <select
                      value={item.productId}
                      onChange={(event) => updateItem(index, 'productId', event.target.value)}
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} (${product.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateItem(index, 'quantity', Number(event.target.value))}
                      required
                    />
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="order-total">Order Total: ${total.toFixed(2)}</div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Create Order</button>
                <button type="button" className="btn btn-muted" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
