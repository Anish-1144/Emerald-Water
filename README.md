# Custom Bottle E-commerce Platform

A complete e-commerce platform for designing and ordering custom bottle labels with a 3D design engine.

## Features

- 🎨 **3D Design Engine**: Interactive 3D bottle preview using Three.js
- 🖼️ **Label Editor**: Full-featured label editor with text, images, colors, and gradients
- 🛒 **Shopping Cart**: Add designs to cart with quantity selection
- 💳 **Checkout Flow**: Complete checkout process with shipping information
- 📦 **Order Management**: Track orders with status updates
- 👨‍💼 **Admin Dashboard**: Comprehensive admin panel for managing orders and users
- 🔐 **Authentication**: Secure user authentication with JWT

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- Next.js 16 (React 19)
- TypeScript
- Three.js + React Three Fiber for 3D rendering
- Zustand for state management
- Tailwind CSS for styling
- React Color for color picker

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URL_DEVELOPMENT=mongodb://localhost:27017/bottle-ecommerce
# Or for MongoDB Atlas:
# MONGODB_URL_DEVELOPMENT=mongodb+srv://username:password@cluster.mongodb.net/database-name
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. **IMPORTANT: Make sure MongoDB is running!**
   - For local MongoDB: Start MongoDB service
   - For MongoDB Atlas: Use your Atlas connection string in `.env`
   - Test connection: `npm run check-db`

5. Start the backend server:
```bash
npm run dev
```

**Note:** If you get a MongoDB connection timeout error, see `backend/MONGODB_SETUP.md` for detailed troubleshooting.

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
e-commers/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js app directory
│   │   ├── admin/          # Admin dashboard
│   │   ├── cart/           # Shopping cart
│   │   ├── checkout/       # Checkout page
│   │   ├── design/         # Design engine
│   │   ├── login/          # Login/signup
│   │   ├── orders/         # Order history
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   │   └── Bottle3D.tsx   # 3D bottle viewer
│   ├── lib/               # Utilities
│   │   ├── api.ts         # API client
│   │   └── store.ts       # Zustand stores
│   └── public/
│       └── bottle3.glb    # 3D bottle model
└── README.md
```

## User Flow

1. **Landing Page** → User clicks "Start Designing"
2. **Login/Signup** → User authenticates
3. **Design Engine** → User creates custom label design
4. **Save Design** → Design is saved to database
5. **Add to Cart** → User adds design to cart with quantity
6. **Checkout** → User fills shipping information
7. **Order Created** → Order is created and saved
8. **Admin Dashboard** → Admin manages orders

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user (protected)

### Designs
- `POST /api/designs` - Save design (protected)
- `GET /api/designs` - Get user's designs (protected)
- `GET /api/designs/:id` - Get single design (protected)
- `DELETE /api/designs/:id` - Delete design (protected)

### Orders
- `POST /api/orders` - Create order (protected)
- `GET /api/orders` - Get user's orders (protected)
- `GET /api/orders/:id` - Get single order (protected)

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats (admin only)
- `GET /api/admin/orders` - Get all orders (admin only)
- `PUT /api/admin/orders/:id/status` - Update order status (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/:id` - Get user details (admin only)

## Design Engine Features

- ✅ Change cap color
- ✅ Add text with custom fonts
- ✅ Font selection and sizing
- ✅ Color picker for text and background
- ✅ Upload and crop images
- ✅ Resize and rotate images
- ✅ Drag & drop positioning
- ✅ Background color and gradient
- ✅ 3D preview with bottle3.glb model
- ✅ Save draft functionality

## Order Status Flow

1. `pending_production` - Order created, awaiting production
2. `printing` - Order is being printed
3. `packed` - Order is packed and ready
4. `shipped` - Order has been shipped
5. `cancelled` - Order has been cancelled

## Creating an Admin User

To create an admin user, you can either:
1. Manually update the user document in MongoDB to set `role: 'admin'`
2. Or use MongoDB shell:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Notes

- Payment integration is not implemented yet (marked as TODO in PRD)
- Email notifications are not implemented yet (can be added with nodemailer)
- PDF generation for print files uses placeholder (can be enhanced with jsPDF or similar)
- Image quality detection for print quality warnings is not implemented yet

## Development

### Backend
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend
```bash
cd frontend
npm run dev  # Next.js development server
```

## Production Build

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## License

ISC

