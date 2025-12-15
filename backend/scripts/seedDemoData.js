const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const dbPath =
  process.env.DB_PATH ||
  path.join(__dirname, '../../database/georgian_menu.db');

if (!fs.existsSync(dbPath)) {
  console.error(
    `Database not found at ${dbPath}. Run "npm run init-db" first to create it.`
  );
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

async function ensureSchema() {
  const requiredTables = [
    'restaurants',
    'admin_users',
    'categories',
    'menu_items',
    'restaurant_tables',
  ];

  const missing = [];
  for (const table of requiredTables) {
    const row = await get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [table]
    );
    if (!row) missing.push(table);
  }

  if (missing.length) {
    throw new Error(
      `Missing tables: ${missing.join(
        ', '
      )}. Did you run "npm run init-db" to apply schema?`
    );
  }
}

async function seed() {
  await ensureSchema();

  const restaurant = {
    name: 'Georgian Delights',
    slug: 'georgian-delights',
    description: 'Authentic Georgian cuisine in the heart of the city',
    address: '123 Main Street, City Center',
    phone: '+995-555-0123',
    email: 'info@georgiandelights.com',
  };

  await run(
    `INSERT INTO restaurants (name, slug, description, address, phone, email)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET
       name=excluded.name,
       description=excluded.description,
       address=excluded.address,
       phone=excluded.phone,
       email=excluded.email,
       updated_at=CURRENT_TIMESTAMP`,
    [
      restaurant.name,
      restaurant.slug,
      restaurant.description,
      restaurant.address,
      restaurant.phone,
      restaurant.email,
    ]
  );

  const restaurantRow = await get(
    'SELECT id FROM restaurants WHERE slug = ?',
    [restaurant.slug]
  );
  const restaurantId = restaurantRow.id;

  const adminUser = await get(
    'SELECT id FROM admin_users WHERE username = ?',
    ['admin']
  );
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await run(
      `INSERT INTO admin_users (restaurant_id, username, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'admin', 1)`,
      [
        restaurantId,
        'admin',
        'admin@georgiandelights.com',
        passwordHash,
        'Restaurant Admin',
      ]
    );
  }

  const categories = [
    { name: 'food', displayName: 'Foods' },
    { name: 'drink', displayName: 'Drinks' },
    { name: 'dessert', displayName: 'Desserts' },
  ];

  for (const cat of categories) {
    await run(
      `INSERT INTO categories (name, display_name)
       VALUES (?, ?)
       ON CONFLICT(name) DO UPDATE SET display_name=excluded.display_name`,
      [cat.name, cat.displayName]
    );
  }

  const categoryMap = {};
  const categoryRows = await get(
    `SELECT GROUP_CONCAT(id || ':' || name) AS data FROM categories`
  );
  if (categoryRows && categoryRows.data) {
    categoryRows.data.split(',').forEach((entry) => {
      const [id, name] = entry.split(':');
      categoryMap[name] = Number(id);
    });
  }

  const menuItems = [
    {
      id: 'khinkali',
      name: 'Khinkali',
      description: 'Traditional Georgian dumplings filled with spiced meat.',
      price: 12.5,
      image: 'khinkali_rc.jpg',
      category: 'food',
      isSpicy: true,
      isVegan: false,
      allergens: 'gluten',
      modifiers: [
        { name: 'Extra sour cream', price: 1.5 },
        { name: 'Extra spice', price: 0.5 },
      ],
    },
    {
      id: 'khachapuri',
      name: 'Khachapuri',
      description: 'Cheese-filled bread, a Georgian classic.',
      price: 10,
      image: 'khachapuri.webp',
      category: 'food',
      isSpicy: false,
      isVegan: false,
      allergens: 'gluten,dairy',
      modifiers: [{ name: 'Add egg', price: 1.0 }],
    },
    {
      id: 'lobio',
      name: 'Lobio',
      description: 'Bean stew with herbs and spices.',
      price: 6,
      image: 'lobio.webp',
      category: 'food',
      isSpicy: false,
      isVegan: true,
      allergens: 'none',
      modifiers: [{ name: 'Add cornbread', price: 1.5 }],
    },
    {
      id: 'chakhokhbili',
      name: 'Chakhokhbili',
      description: 'Chicken stew with tomatoes and herbs.',
      price: 10,
      image:
        'https://upload.wikimedia.org/wikipedia/commons/0/0e/Chakhokhbili.jpg',
      category: 'food',
      isSpicy: true,
      isVegan: false,
      allergens: 'none',
      modifiers: [],
    },
    {
      id: 'wine',
      name: 'Saperavi Wine',
      description: 'Famous dry red wine from Georgia.',
      price: 18,
      image:
        'https://upload.wikimedia.org/wikipedia/commons/7/7b/Saperavi_wine.jpg',
      category: 'drink',
      isSpicy: false,
      isVegan: true,
      allergens: 'sulfites',
      modifiers: [],
    },
    {
      id: 'lemonade',
      name: 'Tarkhuna Lemonade',
      description: 'Traditional tarragon-flavored Georgian lemonade.',
      price: 5,
      image: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Tarkhuna.jpg',
      category: 'drink',
      isSpicy: false,
      isVegan: true,
      allergens: 'none',
      modifiers: [],
    },
    {
      id: 'borjomi',
      name: 'Borjomi Mineral Water',
      description: 'Legendary Georgian mineral water from Borjomi valley.',
      price: 4,
      image:
        'https://upload.wikimedia.org/wikipedia/commons/2/2e/Borjomi_mineral_water.jpg',
      category: 'drink',
      isSpicy: false,
      isVegan: true,
      allergens: 'none',
      modifiers: [],
    },
  ];

  for (const item of menuItems) {
    const categoryId = categoryMap[item.category];
    if (!categoryId) continue;

    await run(
      `INSERT INTO menu_items (id, restaurant_id, name, description, price, image_url, category_id, is_available, is_spicy, is_vegan, allergens, modifiers)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name,
         description=excluded.description,
         price=excluded.price,
         image_url=excluded.image_url,
         category_id=excluded.category_id,
         is_available=1,
         is_spicy=excluded.is_spicy,
         is_vegan=excluded.is_vegan,
         allergens=excluded.allergens,
         modifiers=excluded.modifiers,
         updated_at=CURRENT_TIMESTAMP`,
      [
        item.id,
        restaurantId,
        item.name,
        item.description,
        item.price,
        item.image,
        categoryId,
        item.isSpicy ? 1 : 0,
        item.isVegan ? 1 : 0,
        item.allergens || 'none',
        JSON.stringify(item.modifiers || []),
      ]
    );
  }

  const tables = [
    { tableNumber: 'T01', capacity: 4 },
    { tableNumber: 'T02', capacity: 6 },
    { tableNumber: 'T03', capacity: 2 },
    { tableNumber: 'T04', capacity: 8 },
    { tableNumber: 'T05', capacity: 4 },
  ];

  for (const table of tables) {
    await run(
      `INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, qr_code, is_active)
       VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(restaurant_id, table_number) DO UPDATE SET
         capacity=excluded.capacity,
         qr_code=excluded.qr_code,
         is_active=1`,
      [
        restaurantId,
        table.tableNumber,
        table.capacity,
        `QR_${table.tableNumber}`,
      ]
    );
  }

  console.log('✅ Demo data seeded.');
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  })
  .finally(() => {
    db.close();
  });

