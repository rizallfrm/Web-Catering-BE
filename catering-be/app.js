require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.status(200).send({ message: "Ping Successfully" });
});

const userRouter = require("./routes/userRouter");
const menuRouter = require("./routes/menuRouter");
const cartRouter = require("./routes/cartRouter");
const orderRouter = require("./routes/orderRouter");

app.use('/api/menus', menuRouter);;
app.use('/api/carts', cartRouter);
app.use('/api/users/', userRouter);
// app.use('/api/orders', orderRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});