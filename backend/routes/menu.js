const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Get all menu items with categories
router.get('/items', async (req, res) => {
  try {
    const { category } = req.query;
    
    let sql = `
      SELECT 
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.is_available,
        c.name as category,
        c.display_name as category_display
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.is_available = 1
    `;
    
    const params = [];
    if (category) {
      sql += ' AND c.name = ?';
      params.push(category);
    }
    
    sql += ' ORDER BY c.id, mi.name';
    
    const items = await db.all(sql, params);
    
    // Get pairings for each item
    for (let item of items) {
      const pairings = await db.all(`
        SELECT paired_item_id as id
        FROM food_pairings 
        WHERE item_id = ?
      `, [item.id]);
      
      item.pairings = pairings.map(p => p.id);
    }
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get single menu item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await db.get(`
      SELECT 
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.is_available,
        c.name as category,
        c.display_name as category_display
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.id = ? AND mi.is_available = 1
    `, [id]);
    
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    // Get pairings
    const pairings = await db.all(`
      SELECT paired_item_id as id
      FROM food_pairings 
      WHERE item_id = ?
    `, [id]);
    
    item.pairings = pairings.map(p => p.id);
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.all(`
      SELECT id, name, display_name
      FROM categories
      ORDER BY id
    `);
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
