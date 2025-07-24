const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

// Create a new table session
router.post('/sessions', async (req, res) => {
  try {
    const { tableNumber, hostName, sessionName } = req.body;
    
    if (!tableNumber || !hostName) {
      return res.status(400).json({ error: 'Table number and host name are required' });
    }
    
    // Check if table exists
    const table = await db.get('SELECT id FROM restaurant_tables WHERE table_number = ?', [tableNumber]);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // Check if there's already an active session for this table
    const existingSession = await db.get(`
      SELECT id FROM table_sessions 
      WHERE table_id = ? AND is_active = 1
    `, [table.id]);
    
    if (existingSession) {
      return res.status(409).json({ 
        error: 'Table already has an active session',
        sessionId: existingSession.id
      });
    }
    
    // Create new session
    const sessionId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
    
    await db.run(`
      INSERT INTO table_sessions (id, table_id, session_name, host_name, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `, [sessionId, table.id, sessionName || `${hostName}'s Table`, hostName, expiresAt.toISOString()]);
    
    // Add host as first customer
    await db.run(`
      INSERT INTO session_customers (session_id, customer_name, is_host)
      VALUES (?, ?, 1)
    `, [sessionId, hostName]);
    
    res.status(201).json({
      sessionId,
      tableNumber,
      sessionName: sessionName || `${hostName}'s Table`,
      hostName,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Error creating table session:', error);
    res.status(500).json({ error: 'Failed to create table session' });
  }
});

// Join an existing table session
router.post('/sessions/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { customerName } = req.body;
    
    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    
    // Check if session exists and is active
    const session = await db.get(`
      SELECT ts.*, rt.table_number
      FROM table_sessions ts
      JOIN restaurant_tables rt ON ts.table_id = rt.id
      WHERE ts.id = ? AND ts.is_active = 1 AND ts.expires_at > datetime('now')
    `, [sessionId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }
    
    // Check if customer is already in session
    const existingCustomer = await db.get(`
      SELECT id FROM session_customers 
      WHERE session_id = ? AND customer_name = ?
    `, [sessionId, customerName]);
    
    if (existingCustomer) {
      return res.status(409).json({ error: 'Customer already in session' });
    }
    
    // Add customer to session
    await db.run(`
      INSERT INTO session_customers (session_id, customer_name)
      VALUES (?, ?)
    `, [sessionId, customerName]);
    
    res.json({
      sessionId,
      tableNumber: session.table_number,
      sessionName: session.session_name,
      customerName,
      joinedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error joining table session:', error);
    res.status(500).json({ error: 'Failed to join table session' });
  }
});

// Get session details and customers
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session info
    const session = await db.get(`
      SELECT ts.*, rt.table_number, rt.capacity
      FROM table_sessions ts
      JOIN restaurant_tables rt ON ts.table_id = rt.id
      WHERE ts.id = ?
    `, [sessionId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get customers in session
    const customers = await db.all(`
      SELECT customer_name, joined_at, is_host
      FROM session_customers
      WHERE session_id = ?
      ORDER BY joined_at
    `, [sessionId]);
    
    res.json({
      ...session,
      customers
    });
    
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

// End a table session (host only)
router.post('/sessions/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { hostName } = req.body;
    
    // Verify host
    const session = await db.get(`
      SELECT host_name FROM table_sessions 
      WHERE id = ? AND is_active = 1
    `, [sessionId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.host_name !== hostName) {
      return res.status(403).json({ error: 'Only the host can end the session' });
    }
    
    // Deactivate session
    await db.run(`
      UPDATE table_sessions 
      SET is_active = 0 
      WHERE id = ?
    `, [sessionId]);
    
    res.json({ message: 'Session ended successfully' });
    
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get all available tables
router.get('/', async (req, res) => {
  try {
    const tables = await db.all(`
      SELECT 
        rt.*,
        CASE WHEN ts.id IS NOT NULL THEN 1 ELSE 0 END as has_active_session,
        ts.session_name,
        ts.host_name
      FROM restaurant_tables rt
      LEFT JOIN table_sessions ts ON rt.id = ts.table_id AND ts.is_active = 1
      WHERE rt.is_active = 1
      ORDER BY rt.table_number
    `);
    
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

module.exports = router;
