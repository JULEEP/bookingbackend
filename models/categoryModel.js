const pool = require('../db');

// Category create karne ka function
exports.createCategory = async (name, image) => {
  const result = await pool.query(
    'INSERT INTO categories (name, image) VALUES ($1, $2) RETURNING *',
    [name, image]
  );
  return result.rows[0];
};

// Saari categories fetch karne ka function
exports.getAllCategories = async () => {
  const result = await pool.query('SELECT * FROM categories');
  return result.rows;
};
