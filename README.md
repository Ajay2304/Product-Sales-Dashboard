# Product & Sales Management Dashboard

Full-stack dashboard for managing products, sales orders, and business analytics.

## Highlights
- JWT-based authentication (`admin / password` demo credentials).
- Product management with validation, soft delete, search, and server-side pagination.
- Order management with multi-item support, validation, and server-side pagination.
- Business analytics dashboard:
  - total products
  - total orders
  - total revenue
  - average order value
  - unique customers
  - top-selling products
  - monthly revenue trend
- Professional responsive UI with a unified design system.

## Tech Stack
- **Frontend:** React 19, TypeScript, Axios, React Router
- **Backend:** Node.js, Express 5
- **Database:** MongoDB (Mongoose)
- **Auth:** JSON Web Tokens + bcryptjs

## Project Structure
```text
product_sales_dashboard/
  backend/
    controllers/
    models/
    routes/
    middlewares/
  frontend/
    src/
      components/
      services/
```

## Setup

### 1. Backend
```bash
cd backend
npm install
```

Create `.env` in `backend`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/product_sales_dashboard
JWT_SECRET=your_secret_key
PORT=5000
```

Run backend:
```bash
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

Optional frontend env (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
```

## Core API Endpoints

### Public
- `POST /auth/login`

### Protected
- `GET /products?page=1&limit=10&search=...`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id`
- `GET /orders?page=1&limit=10&search=...`
- `POST /orders`
- `GET /dashboard/summary?rangeDays=30|90|365`

## Report Content
A ready-to-fill professional report draft is available at:
- [FINAL_YEAR_PROJECT_REPORT_CONTENT.md](D:\product_sales_dashboard\FINAL_YEAR_PROJECT_REPORT_CONTENT.md)

Use it to populate your `internship report format.doc`.
