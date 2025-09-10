import Category from '../models/categoryModel.js';

// controllers/categoryController.js

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // ✅ Create with default status: "active"
    const newCategory = new Category({
      name,
      image,
      status: 'active'
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        _id: newCategory._id,
        name: newCategory.name,
        image: newCategory.image,
        status: newCategory.status, // ✅ include status in response
        imageUrl: image ? `/uploads/categoryImg/${image}` : null
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get All Categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    const categoriesWithUrl = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      image: cat.image,
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


// Update Category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const image = req.file ? req.file.filename : null;

    // Find existing category
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Update fields if provided
    if (name) category.name = name;
    if (status) category.status = status;
    if (image) category.image = image;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        _id: category._id,
        name: category.name,
        status: category.status,
        image: category.image,
        imageUrl: category.image ? `/uploads/categoryImg/${category.image}` : null
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

