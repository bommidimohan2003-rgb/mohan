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
let adminsCollection;

// --- Connect to MongoDB ---
const client = new MongoClient(mongoUrl);
client.connect()
  .then(() => {
    const db = client.db(dbName);
    usersCollection = db.collection("users");
    ticketsCollection = db.collection("tickets");
    adminsCollection = db.collection("admins");

    // Ensure there is at least one default admin
    adminsCollection.updateOne(
      { username: "admin" },
      { $setOnInsert: { username: "admin", password: "admin123", name: "Super Admin", email: "admin@example.com", phone: "9876543210" } },
      { upsert: true }
    );

    console.log("✅ MongoDB connected. Users, Tickets & Admins collections ready!");
  })
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

/* ---------------- USER ROUTES ---------------- */
// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists!" });

    await usersCollection.insertOne({ name, email, phone, password });
    res.status(201).json({ message: "✅ Registration successful!" });
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
    if (!user) return res.status(401).json({ message: "Invalid email or password!" });

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
    if (!user) return res.status(404).json({ message: "Email/Phone not matched!" });

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
    try {
      const userTickets = await ticketsCollection.find({ userEmail: ticket.userEmail }).toArray();
      res.status(200).json(userTickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  } else {
    try {
      await ticketsCollection.insertOne(ticket);
      res.status(201).json({ message: "✅ Ticket stored successfully!", ticket });
    } catch (err) {
      console.error("Error inserting ticket:", err);
      res.status(500).json({ error: "Failed to store ticket" });
    }
  }
});

/* ---------------- ADMIN ROUTES ---------------- */
// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await adminsCollection.findOne({ username, password });
    if (!admin) return res.status(401).json({ message: "Invalid admin credentials!" });

    res.status(200).json({ message: "✅ Admin login successful!", user: admin });
  } catch (err) {
    console.error("Error logging in admin:", err);
    res.status(500).json({ error: "Admin login failed" });
  }
});

// Add new admin
app.post("/api/admin/add", async (req, res) => {
  try {
    const { username, password, name, email, phone } = req.body;
    if (!username || !password || !name || !email || !phone)
      return res.status(400).json({ message: "All fields are required" });

    const existingAdmin = await adminsCollection.findOne({ username });
    if (existingAdmin) return res.status(409).json({ message: "Admin username already exists!" });

    await adminsCollection.insertOne({ username, password, name, email, phone });
    res.status(201).json({ message: "✅ Admin added successfully!" });
  } catch (err) {
    console.error("Error adding admin:", err);
    res.status(500).json({ error: "Failed to add admin" });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
