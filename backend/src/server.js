const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// Import routes
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const salesRoutes = require('./routes/salesRoutes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sales', salesRoutes);

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));