const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/verify-otp', userController.verifyOTP);
router.put('/updateprofile/:userId', userController.updateUserProfile);




module.exports = router;
