require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('Missing required environment variables: MONGO_URI and JWT_SECRET');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const authenticateJWT = require('./middlewares/auth');

app.use('/products', authenticateJWT);
app.use('/orders', authenticateJWT);
app.use('/dashboard', authenticateJWT);

app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/orders', require('./routes/orders'));
app.use('/dashboard', require('./routes/dashboard'));

app.get('/', (req, res) => {
  res.json({
    service: 'Product Sales Dashboard API',
    status: 'ok',
    endpoints: {
      public: ['POST /auth/login'],
      protected: ['GET/POST/PUT/DELETE /products', 'GET/POST /orders', 'GET /dashboard/summary']
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
