const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for secure cloud hosting connections
});

// Base Route
app.get('/', (req, res) => {
    res.status(200).json({ message: "MotoMinder In-House Web Service is active!" });
});

// Create a Booking (POST)
app.post('/api/bookings', async (req, res) => {
    const { user_email, workshop_name, booking_date, booking_time } = req.body;
    if (!user_email || !workshop_name || !booking_date || !booking_time) {
        return res.status(400).json({ success: false, error: "Missing required booking fields" });
    }
    try {
        const queryText = 'INSERT INTO bookings (user_email, workshop_name, booking_date, booking_time) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [user_email, workshop_name, booking_date, booking_time];
        const result = await pool.query(queryText, values);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: "Database transaction failure" });
    }
});

// Fetch Bookings by User Email (GET)
app.get('/api/bookings/:email', async (req, res) => {
    const userEmail = req.params.email;
    try {
        const queryText = 'SELECT * FROM bookings WHERE user_email = $1 ORDER BY id DESC';
        const result = await pool.query(queryText, [userEmail]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: "Database retrieval failure" });
    }
});

app.listen(PORT, () => {
    console.log(`Server executing successfully on port ${PORT}`);
});