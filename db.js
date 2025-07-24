const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10), // Port should be an integer
});

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    mobile VARCHAR(15),
    password TEXT NOT NULL,
    city VARCHAR(100),
    gender VARCHAR(10),
    dob DATE
  );
`;


pool.query(createUsersTable)
  .then(() => console.log("✅ users table ready"))
  .catch((err) => console.error("❌ Error creating table", err));

module.exports = pool;
