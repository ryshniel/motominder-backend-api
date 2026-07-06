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

// AUTOMATIC DATABASE UPDATER
// This runs safely every time the server starts up directly on Render
const autoUpdateDatabase = async () => {
    try {
        const queryText = `
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS service_type VARCHAR(100),
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
            ADD COLUMN IF NOT EXISTS additional_notes TEXT;
        `;
        await pool.query(queryText);
        console.log("🚀 DATABASE SUCCESS: Columns checked and updated automatically!");
    } catch (err) {
        console.error("❌ DATABASE ERROR on startup:", err.message);
    }
};
autoUpdateDatabase();

// Base Route
app.get('/', (req, res) => {
    res.status(200).json({ message: "MotoMinder In-House Web Service is active!" });
});

// Create a Booking (POST)
app.post('/api/bookings', async (req, res) => {
    const { user_email, workshop_name, booking_date, booking_time, service_type, phone_number, additional_notes } = req.body;
    
    if (!user_email || !workshop_name || !booking_date || !booking_time || !service_type || !phone_number) {
        return res.status(400).json({ success: false, error: "Missing required booking fields" });
    }
    
    try {
        const queryText = 'INSERT INTO bookings (user_email, workshop_name, booking_date, booking_time, service_type, phone_number, additional_notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        const values = [user_email, workshop_name, booking_date, booking_time, service_type, phone_number, additional_notes];
        
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
        const queryText = 'SELECT * VALUES WHERE user_email = $1 ORDER BY id DESC';
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