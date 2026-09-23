import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

interface MonthlyRevenue {
  label: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface RecentOrder {
  _id: string;
  customerName: string;
  totalAmount: number;
  orderDate: string;
}

interface SummaryData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  monthlyRevenue: MonthlyRevenue[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  rangeDays: number | 'all';
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeDays, setRangeDays] = useState<'30' | '90' | '365' | 'all'>('90');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = rangeDays === 'all' ? {} : { rangeDays };
      const response = await api.get('/dashboard/summary', { params });
      setData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxRevenue = useMemo(() => {
    if (!data?.monthlyRevenue?.length) {
      return 0;
    }
    return Math.max(...data.monthlyRevenue.map((entry) => entry.revenue));
  }, [data]);

  if (loading) {
    return <div className="section-state">Loading dashboard...</div>;
  }

  if (error || !data) {
    return <div className="section-state section-error">{error || 'Unable to render dashboard.'}</div>;
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Business Overview</h1>
          <p>Track product performance, customer activity, and sales movement.</p>
        </div>

        <div className="filter-group">
          <label htmlFor="rangeDays">Date Range</label>
          <select
            id="rangeDays"
            value={rangeDays}
            onChange={(event) => setRangeDays(event.target.value as '30' | '90' | '365' | 'all')}
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      <div className="kpi-grid">
        <article className="kpi-card accent-blue">
          <h3>Active Products</h3>
          <p>{data.totalProducts}</p>
        </article>
        <article className="kpi-card accent-orange">
          <h3>Total Orders</h3>
          <p>{data.totalOrders}</p>
        </article>
        <article className="kpi-card accent-green">
          <h3>Total Revenue</h3>
          <p>${data.totalRevenue.toFixed(2)}</p>
        </article>
        <article className="kpi-card accent-rose">
          <h3>Avg. Order Value</h3>
          <p>${data.averageOrderValue.toFixed(2)}</p>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Revenue Trend</h2>
          </div>
          <div className="trend-list">
            {data.monthlyRevenue.length === 0 && <p className="muted">No trend data available.</p>}
            {data.monthlyRevenue.map((entry) => (
              <div key={entry.label} className="trend-item">
                <div className="trend-label">{entry.label}</div>
                <div className="trend-bar-wrap">
                  <div
                    className="trend-bar"
                    style={{ width: maxRevenue ? `${(entry.revenue / maxRevenue) * 100}%` : '0%' }}
                  />
                </div>
                <div className="trend-value">
                  ${entry.revenue.toFixed(2)} ({entry.orders})
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Top Selling Products</h2>
          </div>
          <div className="list-table">
            {data.topProducts.length === 0 && <p className="muted">No sales data available.</p>}
            {data.topProducts.map((product) => (
              <div key={product.productId} className="list-row">
                <div>
                  <strong>{product.productName}</strong>
                </div>
                <div>{product.totalQuantity} units</div>
                <div>${product.totalRevenue.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel panel-span-2">
          <div className="panel-head">
            <h2>Recent Orders</h2>
            <span className="panel-tag">{data.uniqueCustomers} unique customers</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-cell">No recent orders found.</td>
                  </tr>
                )}
                {data.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id.slice(-6)}</td>
                    <td>{order.customerName}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>${order.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
