const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

const PORT = 5000;
const mongoUrl = "mongodb://localhost:27017";
const dbName = "travelAgency";

let usersCollection;
let ticketsCollection;

// --- Connect to MongoDB ---
const client = new MongoClient(mongoUrl);
client.connect()
  .then(() => {
    const db = client.db(dbName);
    usersCollection = db.collection("users");
    ticketsCollection = db.collection("tickets");
    console.log("✅ MongoDB connected. Users & Tickets collections ready!");
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

/* ---------------- USER ROUTES ---------------- */

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists!" }); // Use 409 Conflict
    }

    await usersCollection.insertOne({ name, email, phone, password });
    res.status(201).json({ message: "✅ Registration successful!" }); // Use 201 Created
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await usersCollection.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password!" });
    }

    res.status(200).json({ message: "✅ Login successful!", user });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Forgot Password
app.post("/api/forgot", async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;
    const user = await usersCollection.findOne({ email, phone });
    if (!user) {
      return res.status(404).json({ message: "Email/Phone not matched!" });
    }

    await usersCollection.updateOne({ email }, { $set: { password: newPassword } });
    res.status(200).json({ message: "✅ Password reset successful!" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

/* ---------------- TICKETS ROUTES ---------------- */

app.post("/api/tickets", async (req, res) => {
  const ticket = req.body;
  if (ticket.hasOwnProperty('userEmail')) {
    // If the request body contains a userEmail, this is a request to fetch tickets
    try {
      const userTickets = await ticketsCollection.find({ userEmail: ticket.userEmail }).toArray();
      res.status(200).json(userTickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  } else {
    // Otherwise, this is a request to save a new ticket
    try {
      await ticketsCollection.insertOne(ticket);
      res.status(201).json({ message: "✅ Ticket stored successfully!", ticket });
    } catch (err) {
      console.error("Error inserting ticket:", err);
      res.status(500).json({ error: "Failed to store ticket" });
    }
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});