-- Georgian AR Menu Database Schema
-- SQLite database for the restaurant application

-- Restaurants table for multi-tenant support
CREATE TABLE restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin', -- admin, manager, staff
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- Categories table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE menu_items (
    id VARCHAR(50) PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category_id INTEGER NOT NULL,
    is_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Food pairings table (many-to-many relationship)
CREATE TABLE food_pairings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id VARCHAR(50) NOT NULL,
    paired_item_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES menu_items(id),
    FOREIGN KEY (paired_item_id) REFERENCES menu_items(id),
    UNIQUE(item_id, paired_item_id)
);

-- Tables in the restaurant
CREATE TABLE restaurant_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    table_number VARCHAR(10) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    qr_code VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    UNIQUE(restaurant_id, table_number)
);

-- Table sessions for sharing functionality
CREATE TABLE table_sessions (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    table_id INTEGER NOT NULL,
    session_name VARCHAR(100),
    host_name VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    ended_at DATETIME,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
);

-- Customers in a table session
CREATE TABLE session_customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_host BOOLEAN DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES table_sessions(id)
);

-- Orders table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, delivered
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES table_sessions(id)
);

-- Order items table
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    special_requests TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Insert sample restaurant
INSERT INTO restaurants (name, slug, description, address, phone, email) VALUES 
('Georgian Delights', 'georgian-delights', 'Authentic Georgian cuisine in the heart of the city', '123 Main Street, City Center', '+995-555-0123', 'info@georgiandelights.com');

-- Insert default categories
INSERT INTO categories (name, display_name) VALUES 
('food', 'Foods'),
('drink', 'Drinks'),
('dessert', 'Desserts');

-- Insert sample admin user (password: admin123 - should be hashed in production)
INSERT INTO admin_users (restaurant_id, username, email, password_hash, full_name, role) VALUES 
(1, 'admin', 'admin@georgiandelights.com', '$2b$10$rQZ8kqVZ8kqVZ8kqVZ8kqO', 'Restaurant Admin', 'admin');

-- Insert sample menu items (migrating from your existing foods.js)
INSERT INTO menu_items (id, restaurant_id, name, description, price, image_url, category_id) VALUES 
('khinkali', 1, 'Khinkali', 'Traditional Georgian dumplings filled with spiced meat.', 12.50, 'khinkali_rc.jpg', 1),
('khachapuri', 1, 'Khachapuri', 'Cheese-filled bread, a Georgian classic.', 10.00, 'khachapuri.webp', 1),
('lobio', 1, 'Lobio', 'Bean stew with herbs and spices.', 6.00, 'lobio.webp', 1),
('chakhokhbili', 1, 'Chakhokhbili', 'Chicken stew with tomatoes and herbs.', 10.00, 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Chakhokhbili.jpg', 1),
('wine', 1, 'Saperavi Wine', 'Famous dry red wine from Georgia.', 18.00, 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Saperavi_wine.jpg', 2),
('lemonade', 1, 'Tarkhuna Lemonade', 'Traditional tarragon-flavored Georgian lemonade.', 5.00, 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Tarkhuna.jpg', 2),
('borjomi', 1, 'Borjomi Mineral Water', 'Legendary Georgian mineral water from Borjomi valley.', 4.00, 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Borjomi_mineral_water.jpg', 2);

-- Insert food pairings
INSERT INTO food_pairings (item_id, paired_item_id) VALUES 
('khinkali', 'wine'),
('khinkali', 'lemonade'),
('khachapuri', 'wine'),
('khachapuri', 'lemonade'),
('lobio', 'wine'),
('chakhokhbili', 'wine'),
('wine', 'khachapuri'),
('wine', 'khinkali'),
('lemonade', 'khachapuri'),
('lemonade', 'khinkali'),
('borjomi', 'khachapuri'),
('borjomi', 'khinkali');

-- Insert sample restaurant tables
INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, qr_code) VALUES 
(1, 'T01', 4, 'QR_TABLE_01'),
(1, 'T02', 6, 'QR_TABLE_02'),
(1, 'T03', 2, 'QR_TABLE_03'),
(1, 'T04', 8, 'QR_TABLE_04'),
(1, 'T05', 4, 'QR_TABLE_05');
