const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

const { uploadCategoryImage } = require('../config/multerConfig');

router.post('/create', uploadCategoryImage.single('image'), categoryController.createCategory);
router.get('/categories', categoryController.getAllCategories);

module.exports = router;
