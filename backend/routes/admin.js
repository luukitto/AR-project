const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    // Get various stats for the dashboard
    const [menuItemsCount, tablesCount, todayOrders, activeSessionsCount] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM menu_items WHERE restaurant_id = ?', [restaurantId]),
      db.get('SELECT COUNT(*) as count FROM restaurant_tables WHERE restaurant_id = ?', [restaurantId]),
      db.get(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
              FROM orders o 
              JOIN table_sessions ts ON o.session_id = ts.id 
              JOIN restaurant_tables rt ON ts.table_id = rt.id 
              WHERE rt.restaurant_id = ? AND DATE(o.created_at) = DATE('now')`, [restaurantId]),
      db.get(`SELECT COUNT(*) as count FROM table_sessions ts 
              JOIN restaurant_tables rt ON ts.table_id = rt.id 
              WHERE rt.restaurant_id = ? AND ts.is_active = 1`, [restaurantId])
    ]);

    res.json({
      menuItems: menuItemsCount.count,
      tables: tablesCount.count,
      todayOrders: todayOrders.count,
      todayRevenue: todayOrders.revenue,
      activeSessions: activeSessionsCount.count
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent orders
router.get('/dashboard/recent-orders', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const limit = parseInt(req.query.limit) || 10;

    const orders = await db.all(`
      SELECT o.*, rt.table_number, ts.session_name
      FROM orders o
      JOIN table_sessions ts ON o.session_id = ts.id
      JOIN restaurant_tables rt ON ts.table_id = rt.id
      WHERE rt.restaurant_id = ?
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [restaurantId, limit]);

    res.json(orders);

  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// Menu Management Routes

// Get all menu items
router.get('/menu', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    const menuItems = await db.all(`
      SELECT mi.*, c.name as category_name, c.display_name as category_display_name
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.restaurant_id = ?
      ORDER BY c.id, mi.name
    `, [restaurantId]);

    res.json(menuItems);

  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Create new menu item
router.post('/menu', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { id, name, description, price, imageUrl, categoryId } = req.body;

    if (!id || !name || !price || !categoryId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await db.run(`
      INSERT INTO menu_items (id, restaurant_id, name, description, price, image_url, category_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, restaurantId, name, description, price, imageUrl, categoryId]);

    res.status(201).json({ message: 'Menu item created successfully' });

  } catch (error) {
    console.error('Create menu item error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(400).json({ error: 'Menu item ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  }
});

// Update menu item
router.put('/menu/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { id } = req.params;
    const { name, description, price, imageUrl, categoryId, isAvailable } = req.body;

    const result = await db.run(`
      UPDATE menu_items 
      SET name = ?, description = ?, price = ?, image_url = ?, category_id = ?, 
          is_available = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND restaurant_id = ?
    `, [name, description, price, imageUrl, categoryId, isAvailable, id, restaurantId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ message: 'Menu item updated successfully' });

  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item
router.delete('/menu/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { id } = req.params;

    const result = await db.run(`
      DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?
    `, [id, restaurantId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });

  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Table Management Routes

// Get all tables
router.get('/tables', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    const tables = await db.all(`
      SELECT rt.*, 
             COUNT(ts.id) as active_sessions_count,
             MAX(ts.created_at) as last_session_time
      FROM restaurant_tables rt
      LEFT JOIN table_sessions ts ON rt.id = ts.table_id AND ts.is_active = 1
      WHERE rt.restaurant_id = ?
      GROUP BY rt.id
      ORDER BY rt.table_number
    `, [restaurantId]);

    res.json(tables);

  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Create new table
router.post('/tables', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { tableNumber, capacity } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({ error: 'Table number and capacity are required' });
    }

    // Generate QR code (simple for now)
    const qrCode = `QR_${restaurantId}_${tableNumber}_${Date.now()}`;

    await db.run(`
      INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, qr_code)
      VALUES (?, ?, ?, ?)
    `, [restaurantId, tableNumber, capacity, qrCode]);

    res.status(201).json({ message: 'Table created successfully', qrCode });

  } catch (error) {
    console.error('Create table error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Table number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create table' });
    }
  }
});

// Update table
router.put('/tables/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { id } = req.params;
    const { tableNumber, capacity, isActive } = req.body;

    const result = await db.run(`
      UPDATE restaurant_tables 
      SET table_number = ?, capacity = ?, is_active = ?
      WHERE id = ? AND restaurant_id = ?
    `, [tableNumber, capacity, isActive, id, restaurantId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ message: 'Table updated successfully' });

  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

// Delete table
router.delete('/tables/:id', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { id } = req.params;

    const result = await db.run(`
      DELETE FROM restaurant_tables WHERE id = ? AND restaurant_id = ?
    `, [id, restaurantId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({ message: 'Table deleted successfully' });

  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// Order Management Routes

// Get all orders with filters
router.get('/orders', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { status, date, limit = 50 } = req.query;

    let query = `
      SELECT o.*, rt.table_number, ts.session_name,
             GROUP_CONCAT(mi.name || ' x' || oi.quantity) as items
      FROM orders o
      JOIN table_sessions ts ON o.session_id = ts.id
      JOIN restaurant_tables rt ON ts.table_id = rt.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE rt.restaurant_id = ?
    `;
    
    const params = [restaurantId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND DATE(o.created_at) = ?';
      params.push(date);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const orders = await db.all(query, params);
    res.json(orders);

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify order belongs to this restaurant
    const order = await db.get(`
      SELECT o.id FROM orders o
      JOIN table_sessions ts ON o.session_id = ts.id
      JOIN restaurant_tables rt ON ts.table_id = rt.id
      WHERE o.id = ? AND rt.restaurant_id = ?
    `, [id, restaurantId]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await db.run(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [status, id]);

    res.json({ message: 'Order status updated successfully' });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
