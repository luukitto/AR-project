const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/georgian_menu.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
});

// Clear all active sessions
db.run('UPDATE table_sessions SET is_active = 0', (err) => {
  if (err) {
    console.error('Error clearing sessions:', err.message);
  } else {
    console.log('✅ All sessions cleared successfully!');
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
      console.log('🚀 You can now create new table sessions!');
    }
  });
});
