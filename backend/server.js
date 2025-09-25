// --- Imports ---
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const functions = require('firebase-functions'); // Import Firebase Functions SDK

// --- Server Setup ---
const app = express();

// --- Middleware ---
// CORS must be configured to allow requests from your web app's origin.
// { origin: true } is a secure default for Firebase Functions.
app.use(cors({ origin: true }));
app.use(express.json());
// Explicitly handle OPTIONS requests for all routes (important for CORS preflight)
app.options('*', cors({ origin: true }));

// --- Database Connection Configuration ---
// Get secrets securely from Firebase's runtime configuration.
// This is the standard way to handle sensitive data in Cloud Functions.
const dbConfig = {
    user: functions.config().database.user,
    password: functions.config().database.password,
    database: functions.config().database.name,
    // Connect via a secure Unix socket, which is the standard for Cloud Functions
    host: `/cloudsql/${functions.config().database.instance_connection_name}`,
};
const pool = new Pool(dbConfig);

pool.on('connect', () => {
    console.log('Successfully connected to the database via Unix socket!');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err.stack);
});


// --- API Endpoints (Routes) ---
// Your existing API logic does not need to change at all.

// GET /api/production-logs
app.get('/api/production-logs', cors({ origin: true }), async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM production_logs ORDER BY date DESC, start_time DESC');
        res.status(200).json(rows);
    } catch (error)        {
        console.error('Error fetching production logs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /api/production-logs
app.post('/api/production-logs', cors({ origin: true }), async (req, res) => {
    try {
        const {
            operatorName, machineId, dieNumber, shift, date, startTime, endTime,
            quantityProduced, quantityRejected, notes
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


// --- Export the API as a single Cloud Function ---
// Instead of app.listen(), we export the entire Express app.
// Firebase will automatically handle starting and stopping the server.
// The name "api" becomes the name of our function.
exports.api = functions.https.onRequest(app);

