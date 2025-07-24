const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Create a new order
router.post('/', async (req, res) => {
  try {
    const { sessionId, customerName, items, notes } = req.body;
    
    if (!sessionId || !customerName || !items || items.length === 0) {
      return res.status(400).json({ error: 'Session ID, customer name, and items are required' });
    }
    
    // Verify session exists and customer is in it
    const customer = await db.get(`
      SELECT sc.id
      FROM session_customers sc
      JOIN table_sessions ts ON sc.session_id = ts.id
      WHERE sc.session_id = ? AND sc.customer_name = ? AND ts.is_active = 1
    `, [sessionId, customerName]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found in active session' });
    }
    
    // Calculate total amount
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const menuItem = await db.get(`
        SELECT id, name, price FROM menu_items 
        WHERE id = ? AND is_available = 1
      `, [item.menuItemId]);
      
      if (!menuItem) {
        return res.status(400).json({ error: `Menu item ${item.menuItemId} not found or unavailable` });
      }
      
      const quantity = parseInt(item.quantity) || 1;
      const subtotal = menuItem.price * quantity;
      totalAmount += subtotal;
      
      validatedItems.push({
        menuItemId: menuItem.id,
        quantity,
        unitPrice: menuItem.price,
        subtotal,
        specialRequests: item.specialRequests || null
      });
    }
    
    // Create order
    const orderResult = await db.run(`
      INSERT INTO orders (session_id, customer_name, total_amount, notes)
      VALUES (?, ?, ?, ?)
    `, [sessionId, customerName, totalAmount, notes || null]);
    
    const orderId = orderResult.id;
    
    // Add order items
    for (const item of validatedItems) {
      await db.run(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, special_requests)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, item.menuItemId, item.quantity, item.unitPrice, item.subtotal, item.specialRequests]);
    }
    
    res.status(201).json({
      orderId,
      sessionId,
      customerName,
      totalAmount,
      status: 'pending',
      items: validatedItems,
      createdAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get orders for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session exists
    const session = await db.get(`
      SELECT id FROM table_sessions WHERE id = ?
    `, [sessionId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get orders with items
    const orders = await db.all(`
      SELECT 
        o.id,
        o.customer_name,
        o.status,
        o.total_amount,
        o.notes,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.session_id = ?
      ORDER BY o.created_at DESC
    `, [sessionId]);
    
    // Get items for each order
    for (let order of orders) {
      const items = await db.all(`
        SELECT 
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
          oi.special_requests,
          mi.id as menu_item_id,
          mi.name as menu_item_name,
          mi.description as menu_item_description
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
    }
    
    res.json(orders);
    
  } catch (error) {
    console.error('Error fetching session orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get orders for a specific customer in a session
router.get('/session/:sessionId/customer/:customerName', async (req, res) => {
  try {
    const { sessionId, customerName } = req.params;
    
    const orders = await db.all(`
      SELECT 
        o.id,
        o.status,
        o.total_amount,
        o.notes,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.session_id = ? AND o.customer_name = ?
      ORDER BY o.created_at DESC
    `, [sessionId, customerName]);
    
    // Get items for each order
    for (let order of orders) {
      const items = await db.all(`
        SELECT 
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
          oi.special_requests,
          mi.id as menu_item_id,
          mi.name as menu_item_name,
          mi.description as menu_item_description
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `, [order.id]);
      
      order.items = items;
    }
    
    res.json(orders);
    
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

// Update order status
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await db.run(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, orderId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated successfully', status });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get session order summary (for bill splitting)
router.get('/session/:sessionId/summary', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session info
    const session = await db.get(`
      SELECT ts.session_name, rt.table_number
      FROM table_sessions ts
      JOIN restaurant_tables rt ON ts.table_id = rt.id
      WHERE ts.id = ?
    `, [sessionId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get order summary by customer
    const customerSummary = await db.all(`
      SELECT 
        o.customer_name,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent
      FROM orders o
      WHERE o.session_id = ?
      GROUP BY o.customer_name
      ORDER BY o.customer_name
    `, [sessionId]);
    
    // Get overall totals
    const overallTotal = await db.get(`
      SELECT 
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as grand_total
      FROM orders o
      WHERE o.session_id = ?
    `, [sessionId]);
    
    res.json({
      session: session,
      customerSummary,
      overallTotal: overallTotal || { total_orders: 0, grand_total: 0 }
    });
    
  } catch (error) {
    console.error('Error fetching order summary:', error);
    res.status(500).json({ error: 'Failed to fetch order summary' });
  }
});

module.exports = router;
