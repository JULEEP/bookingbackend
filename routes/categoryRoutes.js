import express from 'express';
import { createCategory, createGameCategory, deleteCategory, getAllCategories, getAllGameCategories, updateCategory } from '../controllers/categoryController.js';
import { uploadCategoryImage } from '../config/multerConfig.js';

const router = express.Router();

// Route to create a category (with image upload)
router.post('/create-category', uploadCategoryImage.single('image'), createCategory);
router.put('/update-category/:id', uploadCategoryImage.single('image'), updateCategory);
router.delete('/delete-category/:id', deleteCategory);



// Route to get all categories
router.get('/categories', getAllCategories);


// game category
router.post('/create-gamecategory', uploadCategoryImage.single('image'), createGameCategory);
router.get('/gamecategories', getAllGameCategories);



export default router;
