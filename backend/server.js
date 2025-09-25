const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// --- Initialize Express App ---
const app = express();

// --- Middleware ---
// Automatically allow cross-origin requests.
// The { origin: true } setting is a good default for this setup.
app.use(cors({ origin: true }));
app.use(express.json());

// --- Database Connection ---
// The database connection details are pulled from the secure Firebase runtime configuration
// that you set with the 'firebase functions:config:set' command.
const dbConfig = {
  user: functions.config().database.user,
  password: functions.config().database.password,
  database: functions.config().database.name,
  // Securely connect to Cloud SQL using a Unix socket
  host: `/cloudsql/${functions.config().database.instance_connection_name}`,
};
const pool = new Pool(dbConfig);


// --- API Endpoints (Routes) ---

// GET /api/production-logs
app.get('/api/production-logs', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM production_logs ORDER BY date DESC, start_time DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching production logs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /api/production-logs
app.post('/api/production-logs', async (req, res) => {
    try {
        const {
            operatorName,
            machineId,
            dieNumber,
            shift,
            date,
            startTime,
            endTime,
            quantityProduced,
            quantityRejected,
            notes
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

// --- Expose Express API as a single Cloud Function ---
// This is the critical line that Firebase looks for.
// It wraps your entire Express app in a single function named "api".
exports.api = functions.https.onRequest(app);

