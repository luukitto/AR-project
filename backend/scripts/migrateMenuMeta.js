/**
 * Adds new menu metadata columns if they do not exist:
 * - is_spicy (BOOLEAN)
 * - is_vegan (BOOLEAN)
 * - allergens (TEXT)
 * - modifiers (TEXT)
 *
 * Run: node scripts/migrateMenuMeta.js
 */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath =
  process.env.DB_PATH ||
  path.join(__dirname, '../../database/georgian_menu.db');

if (!fs.existsSync(dbPath)) {
  console.error(
    `Database not found at ${dbPath}. Set DB_PATH or run init-db first.`
  );
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

const run = (sql) =>
  new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

const columns = [
  { name: 'is_spicy', sql: "ALTER TABLE menu_items ADD COLUMN is_spicy BOOLEAN DEFAULT 0;" },
  { name: 'is_vegan', sql: "ALTER TABLE menu_items ADD COLUMN is_vegan BOOLEAN DEFAULT 0;" },
  { name: 'allergens', sql: "ALTER TABLE menu_items ADD COLUMN allergens TEXT;" },
  { name: 'modifiers', sql: "ALTER TABLE menu_items ADD COLUMN modifiers TEXT;" },
];

async function migrate() {
  for (const col of columns) {
    const existsSql = `
      SELECT 1 FROM pragma_table_info('menu_items') WHERE name='${col.name}'
    `;
    await new Promise((resolve, reject) => {
      db.get(existsSql, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    }).then(async (row) => {
      if (row) {
        console.log(`✅ Column ${col.name} already exists.`);
      } else {
        console.log(`➕ Adding column ${col.name}...`);
        await run(col.sql);
        console.log(`✅ Added ${col.name}.`);
      }
    });
  }
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  })
  .finally(() => db.close());

