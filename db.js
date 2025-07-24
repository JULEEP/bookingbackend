const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    mobile VARCHAR(15),
    password TEXT NOT NULL,
    otp VARCHAR(6) -- Adding the otp column here
  );
`;

pool.query(createUsersTable)
  .then(() => console.log("✅ users table ready"))
  .catch((err) => console.error("❌ Error creating table", err));

module.exports = pool;
