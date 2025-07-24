const User = require('../models/userModel');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.createUser(name, email, mobile, hashedPassword);

    res.status(201).json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// 4-digit OTP generator


exports.login = async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await User.findUserByMobile(mobile);

    if (!user) {
      return res.status(401).json({ error: 'Mobile number not registered' });
    }

    // OTP related code completely removed

    res.status(200).json({
      message: 'Login successful',
      user: user  // sending user details in response
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await User.findUserByOTP(otp);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Optional: OTP ko clear karna (security ke liye)
    await User.updateUserOTP(user.mobile, null);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      user
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// controllers/userController.js

exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { city, gender, dob } = req.body;

    const updatedUser = await User.updateUserProfile(userId, city, gender, dob);

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
