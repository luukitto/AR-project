const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath =
  process.env.DB_PATH ||
  path.join(__dirname, '../../database/georgian_menu.db');

if (!fs.existsSync(dbPath)) {
  console.error(
    `Database not found at ${dbPath}. Nothing to clear. Set DB_PATH or run init first.`
  );
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });

async function clearOrders() {
  const deletedItems = await run('DELETE FROM order_items');
  const deletedOrders = await run('DELETE FROM orders');
  await run(
    `DELETE FROM sqlite_sequence WHERE name IN ('orders', 'order_items')`
  );

  console.log(
    `✅ Cleared orders. Removed ${deletedOrders.changes} orders and ${deletedItems.changes} order items.`
  );
}

clearOrders()
  .catch((err) => {
    console.error('Clear orders failed:', err.message);
    process.exit(1);
  })
  .finally(() => db.close());

