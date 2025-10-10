const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

const port = 5000;

// ------------------- MongoDB Connection -------------------
const url = "mongodb://localhost:27017/";
const dbname = "pay";
let top; // collection reference

const connection = new MongoClient(url);

connection
  .connect()
  .then(() => {
    const database = connection.db(dbname);
    top = database.collection("top10");
    console.log("✅ Database connected to " + dbname);
  })
  .catch((err) => {
    console.log("❌ Database connection failed:", err);
  });

// ------------------- Razorpay Setup -------------------
const razorpay = new Razorpay({
  key_id: "YOUR_KEY_ID", // Replace with your Razorpay key_id
  key_secret: "YOUR_KEY_SECRET", // Replace with your Razorpay key_secret
});

// ✅ Create an order
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // amount in paise (₹500 -> 50000)
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };
    const order = await razorpay.orders.create(options);

    // (Optional) Save order to DB
    if (top) {
      await top.insertOne({
        orderId: order.id,
        amount: options.amount,
        status: "created",
        createdAt: new Date(),
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send(error);
  }
});

// ✅ Verify payment signature
app.post("/verify-payment", async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    const sign = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (sign === signature) {
      // Update DB after successful payment
      if (top) {
        await top.updateOne(
          { orderId: order_id },
          { $set: { paymentId: payment_id, status: "paid", paidAt: new Date() } }
        );
      }

      res.json({ success: true, message: "✅ Payment verified successfully!" });
    } else {
      res.json({ success: false, message: "❌ Payment verification failed." });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send(error);
  }
});

// ------------------- Start Server -------------------
app.listen(port, () => {
  console.log("🚀 Server running at http://localhost:" + port);
});
