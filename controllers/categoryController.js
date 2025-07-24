const Category = require('../models/categoryModel');

// Create category controller with multer
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const image = req.file ? req.file.filename : null;  // filename only

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await Category.createCategory(name, image);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        ...category,
        imageUrl: image ? `/uploads/categoryImg/${image}` : null // yeh client ko dikhana hai
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all categories controller (no change)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getAllCategories();

    // Har category ke liye image URL banake bhejo
    const categoriesWithUrl = categories.map(cat => ({
      ...cat,
      imageUrl: cat.image ? `/uploads/categoryImg/${cat.image}` : null
    }));

    res.status(200).json({
      success: true,
      categories: categoriesWithUrl
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



