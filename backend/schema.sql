-- This SQL script creates the table needed to store production logs.
-- You can run this command in your PostgreSQL client (like psql or a GUI tool).

CREATE TABLE production_logs (
    id SERIAL PRIMARY KEY,
    operator_name VARCHAR(255) NOT NULL,
    machine_id VARCHAR(50) NOT NULL,
    die_number VARCHAR(100) NOT NULL,
    shift VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    quantity_produced INTEGER NOT NULL,
    quantity_rejected INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
