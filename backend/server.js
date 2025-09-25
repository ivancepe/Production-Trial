// 1. --- Import Firebase and Express ---
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// --- Server Setup ---
const app = express();

// --- Middleware ---
// Use cors to allow your frontend to call this API
app.use(cors({ origin: true }));
app.use(express.json());

// --- Database Connection ---
// Securely get the database credentials from Firebase's runtime configuration
const dbConfig = functions.config().database;

const pool = new Pool({
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    // Use a secure Unix socket for the connection in production
    host: `/cloudsql/${dbConfig.instance_connection_name}`
});

// --- API Endpoints (Routes) ---
// (Your GET and POST routes remain exactly the same)

// GET /api/production-logs
app.get('/production-logs', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM production_logs ORDER BY date DESC, start_time DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching production logs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /api/production-logs
app.post('/production-logs', async (req, res) => {
    try {
        const {
            operatorName, machineId, dieNumber, shift, date,
            startTime, endTime, quantityProduced, quantityRejected, notes
        } = req.body;

        if (!operatorName || !machineId || !date || !startTime || !endTime) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const newLog = await pool.query(
            `INSERT INTO production_logs 
             (operator_name, machine_id, die_number, shift, date, start_time, end_time, quantity_produced, quantity_rejected, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [operatorName, machineId, dieNumber, shift, date, startTime, endTime, quantityProduced, quantityRejected, notes]
        );

        res.status(201).json(newLog.rows[0]);
    } catch (error) {
        console.error('Error creating production log:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// 2. --- Remove the app.listen() section ---
// We no longer need this because Firebase will manage the server lifecycle.

// 3. --- Export the Express app as a Cloud Function ---
// This is the "jet engine" part. We name the function 'api'.
// Firebase will automatically handle all requests starting with /api/ and send them here.
exports.api = functions.https.onRequest(app);

