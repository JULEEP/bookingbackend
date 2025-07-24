const pool = require('../db');

exports.createUser = async (name, email, mobile) => {
  const result = await pool.query(
    'INSERT INTO users (name, email, mobile) VALUES ($1, $2, $3) RETURNING *',
    [name, email, mobile]
  );
  return result.rows[0];
};



exports.findUserByMobile = async (mobile) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE mobile = $1',
    [mobile]
  );
  return result.rows[0];
};

exports.updateUserOTP = async (mobile, otp) => {
  const result = await pool.query(
    'UPDATE users SET otp = $1 WHERE mobile = $2 RETURNING *',
    [otp, mobile]
  );
  return result.rows[0];
};



exports.findUserByOTP = async (otp) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE otp = $1',
    [otp]
  );
  return result.rows[0];
};
