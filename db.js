const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,        // User for DB connection
  host: process.env.DB_HOST,        // Host for DB connection (like `localhost` or remote host)
  database: process.env.DB_NAME,    // Database name
  password: process.env.DB_PASSWORD, // Password for the DB user
  port: process.env.DB_PORT,        // Port (default is 5432 for PostgreSQL)
});

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    mobile VARCHAR(15),
    password TEXT NOT NULL,
  );
`;

pool.query(createUsersTable)
  .then(() => console.log("✅ users table ready"))
  .catch((err) => console.error("❌ Error creating table", err));

module.exports = pool;
