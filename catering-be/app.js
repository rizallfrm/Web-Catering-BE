require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173", // Ganti dengan domain frontend kamu
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);
//cors supaya bisa di hit api
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.status(200).send({ message: "Ping Successfully" });
});
app.use("/uploads", express.static("uploads"));
// Routes
const userRouter = require("./routes/userRouter");
const menuRouter = require("./routes/menuRouter");
const cartRouter = require("./routes/cartRouter");
const orderRouter = require("./routes/orderRouter");
const adminRouter = require("./routes/adminRoutes");
const uploadRouter = require("./routes/uploadRoutes");
const deliveryRouter = require("./routes/deliveryRouter");
const financialRouter = require("./routes/financialRouter");
const expenseRouter = require("./routes/expenseRouter");

app.use("/api/menus", menuRouter);
app.use("/api/carts", cartRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/financial", financialRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/expenses", expenseRouter);

// Test endpoint untuk debug
app.get("/api/test-delivery", (req, res) => {
  res.json({
    message: "Delivery endpoint is working!",
    timestamp: new Date().toISOString(),
  });
});
app.get("/api/test-financial", (req, res) => {
  res.json({
    message: "Financial endpoint is working!",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  console.log("404 - Route not found:", req.method, req.originalUrl);
  res.status(404).json({
    status: "error",
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Available routes:");
  console.log("- GET  /api/test-delivery (test endpoint)");
  console.log("- GET  /api/delivery/areas");
  console.log("- POST /api/delivery/calculate-fee");
  console.log("- GET  /api/delivery/suggest");
  console.log("- POST /api/delivery/validate");
});
