# Georgian AR Menu - Restaurant Digital Ordering System

A comprehensive digital restaurant ordering system featuring AR food previews, real-time table sharing, admin dashboard, and kitchen display system. Built for Georgian restaurants with mobile-first design and professional-grade features.

## 🎯 Project Overview

This is a full-stack restaurant management system consisting of:
- **Customer Web App**: Mobile-optimized ordering interface with AR previews
- **Admin Dashboard**: Restaurant management with order tracking and analytics
- **Kitchen Display System**: Real-time order management for kitchen staff
- **Backend API**: Node.js server with SQLite database and real-time features

## 🏗️ Architecture

### Frontend (React + Vite)
- **Customer Interface**: QR code → table session → menu → AR preview → cart → checkout
- **Admin Dashboard**: Restaurant management, menu editing, table management, order tracking
- **Kitchen Display**: Real-time order queue with status updates
- **Mobile-First**: Optimized for smartphones with haptic feedback and touch gestures

### Backend (Node.js + Express)
- **REST API**: Complete CRUD operations for all entities
- **Real-time Updates**: Socket.IO for live order status and notifications
- **Multi-tenant**: Support for multiple restaurants
- **Authentication**: JWT-based admin authentication

## 🚀 Features

### Customer Experience
- 📱 **Mobile-Optimized**: Touch-friendly interface with haptic feedback
- 🔗 **QR Code Access**: Instant table joining via QR scan
- 🥘 **AR Food Preview**: 3D model viewer for menu items
- 👥 **Table Sharing**: Real-time collaborative ordering
- 🛒 **Smart Cart**: Persistent cart with quantity controls
- 🔔 **Push Notifications**: Real-time order status updates
- 📱 **PWA Ready**: Mobile web app capabilities

### Admin Dashboard
- 📊 **Analytics**: Revenue, orders, and performance metrics
- 🍽️ **Menu Management**: Full CRUD for menu items with categories
- 🪑 **Table Management**: QR code generation and session tracking
- 📋 **Order Management**: Status updates and order history
- 👨‍💼 **Multi-user**: Role-based access control

### Kitchen Display System
- ⏱️ **Real-time Orders**: Live order queue with timers
- 🔄 **Status Updates**: Easy order status management
- 📱 **Mobile-Friendly**: Optimized for kitchen tablets
- 🔔 **Notifications**: Audio/visual alerts for new orders

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **Socket.IO Client** - Real-time communication
- **Model Viewer** - 3D AR model display

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite** - Lightweight database
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd georgian_ar_menu-ar-mvp
```

### 2. Backend Setup
```bash
# Navigate to backend directory (if separate) or root
cd backend  # or stay in root if backend is in root

# Install backend dependencies
npm install

# Copy env template and set your secrets
cp .env.example .env
# then edit .env (PORT, DB_PATH, JWT_SECRET, etc.)

# Initialize database
node database/init.js

# Seed demo data (restaurant, admin user, tables, menu)
npm run seed-demo

# Start backend server
npm run server
# or
node server.js
```

The backend will start on `http://localhost:3001`

### 3. Frontend Setup
```bash
# Navigate to frontend directory (if separate) or root
cd frontend  # or stay in root if frontend is in root

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend  # if backend is in separate folder
npm run server
# Backend runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend  # if frontend is in separate folder
npm run dev
# Frontend runs on http://localhost:5173
```

### Production Build

**Backend:**
```bash
# Backend runs as-is in production
node server.js
```

**Frontend:**
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables
Create `.env` files for configuration:

**Backend (.env):**
```env
PORT=3001
JWT_SECRET=your-secret-key
DB_PATH=./database/restaurant.db
NODE_ENV=development
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## 📱 Usage

### Customer Flow
1. **Scan QR Code**: Customer scans table QR code
2. **Join Table**: Enter name and join/create table session
3. **Browse Menu**: View menu items with categories
4. **AR Preview**: View 3D models of food items
5. **Add to Cart**: Build order with quantity controls
6. **Checkout**: Place order with special requests
7. **Track Order**: Receive real-time status updates

### Admin Flow
1. **Login**: Access admin dashboard (`/admin/login`)
   - Default: `admin` / `admin123`
2. **Dashboard**: View analytics and recent orders
3. **Menu Management**: Add/edit/delete menu items
4. **Table Management**: Create tables and generate QR codes
5. **Order Management**: Track and update order status

### Kitchen Flow
1. **Kitchen Display**: Access kitchen interface (`/admin/kitchen`)
2. **Order Queue**: View incoming orders in real-time
3. **Status Updates**: Mark orders as preparing/ready/delivered
4. **Timer Management**: Track order preparation times

## 🗄️ Database Schema

### Core Tables
- `restaurants` - Multi-tenant restaurant data
- `admin_users` - Admin authentication
- `menu_items` - Restaurant menu with categories
- `restaurant_tables` - Table management with QR codes
- `table_sessions` - Active dining sessions
- `session_customers` - Customers in sessions
- `orders` - Customer orders
- `order_items` - Individual order items

## 🔌 API Endpoints

### Public APIs
- `GET /api/menu` - Get menu items
- `POST /api/orders` - Place new order
- `GET /api/tables/qr/:qrCode` - Get table by QR code

### Admin APIs
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/dashboard/stats` - Dashboard analytics
- `GET /api/admin/orders` - Order management
- `PUT /api/admin/orders/:id/status` - Update order status

## 🎨 Mobile Optimizations

- **Touch Targets**: 44px minimum for all interactive elements
- **Haptic Feedback**: Vibration feedback for interactions
- **Swipe Gestures**: Category navigation with swipes
- **Safe Areas**: Support for notched devices
- **Lazy Loading**: Optimized image loading
- **PWA Features**: Mobile web app capabilities

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
# Build the project
npm run build

# Deploy the dist/ folder
# Vercel: vercel --prod
# Netlify: netlify deploy --prod --dir=dist
```

### Backend (Railway/Heroku/VPS)
```bash
# Ensure all dependencies are installed
npm install --production

# Start the server
node server.js
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Built with ❤️ for Georgian restaurants**
