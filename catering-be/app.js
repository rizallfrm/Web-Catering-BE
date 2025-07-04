require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "http://localhost:5173", // Ganti dengan domain frontend kamu
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
  
}));
 //cors supaya bisa di hit api
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.status(200).send({ message: "Ping Successfully" });
});
app.use('/uploads', express.static('uploads'));
// Routes
const userRouter = require("./routes/userRouter");
const menuRouter = require("./routes/menuRouter");
const cartRouter = require("./routes/cartRouter");
const orderRouter = require("./routes/orderRouter");
const adminRouter = require("./routes/adminRoutes");
const uploadRouter = require("./routes/uploadRoutes");

app.use('/api/menus', menuRouter);
app.use('/api/carts', cartRouter);
app.use('/api/users', userRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
