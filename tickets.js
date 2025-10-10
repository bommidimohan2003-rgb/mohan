const express = require('express');
const bodyparser = require('body-parser');
const cookiesparser = require('cookie-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(bodyparser.json());
app.use(cookiesparser());
app.use(cors());

const port = 5000;
const url = 'mongodb://localhost:27017/';
const dbname = 'tickets';

let ticketsCollection;

const connection = new MongoClient(url);

connection.connect().then(() => {
  const database = connection.db(dbname);
  ticketsCollection = database.collection('top10'); // storing tickets here
  console.log('✅ Database connected to ' + dbname);
}).catch(() => {
  console.log('❌ Database not connected');
});

// --- API to save tickets ---
app.post('/api/tickets', async (req, res) => {
  try {
    const ticket = req.body;
    await ticketsCollection.insertOne(ticket);
    res.status(201).json({ message: 'Ticket stored in MongoDB', ticket });
  } catch (err) {
    console.error('Error inserting ticket:', err);
    res.status(500).json({ error: 'Failed to store ticket' });
  }
});

// --- API to fetch all tickets ---
app.get('/api/tickets', async (req, res) => {
  try {
    const allTickets = await ticketsCollection.find().toArray();
    res.json(allTickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.listen(port, () => {
  console.log("🚀 Server is running at: " + port);
});
