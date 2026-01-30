# EcoCart 🌿
**Sustainable Community Marketplace**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://ecocartproject.onrender.com)
[![Status](https://img.shields.io/badge/Status-Deployed-success)](https://ecocartproject.onrender.com)

EcoCart is a community-driven platform designed to promote the circular economy. It connects people who have usable household items to give away with those who need them—reducing waste and building community connections.

---
### 🚀 **Live Link: [https://ecocartproject.onrender.com](https://ecocartproject.onrender.com)**
---

## ✨ Features

### 👤 User Features
- **Give & Get**: Post items you no longer need and claim items you can use.
- **User Dashboard**: Track your impact (Items Shared, Waste Saved) and view your recent activity.
- **Smart Search**: Filter items by category or search by keyword.
- **Profile Hub**: Manage your posted items and view your claim history.

### 🛡️ Admin Features ("God Mode")
- **Admin Panel**: Dedicated dashboard to view platform statistics (Total Users, Items, Claims).
- **User Management**: Admins can view all registered users and **delete any user** from the system.
- **Content Moderation**: Admins can view all items and **delete any item** directly from the item details page, regardless of ownership.

## 🛠️ Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (JSON Web Tokens)
- **Images**: Cloudinary Integration
- **Deployment**: Render

## 🏗️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/EcoCart.git
   cd EcoCart
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run Locally**
   ```bash
   # Start the backend server
   cd backend
   node server.js
   
   # Open frontend/index.html in your browser
   ```

## 🧪 Test Credentials

**Admin Account:**
- **Email:** `admin@ecocart.com`
- **Password:** `admin123`

**Demo User:**
- **Email:** `alice@mail.com`
- **Password:** `123456`

## 🤝 Contribution
Contributions are welcome! Please fork the repository and submit a pull request for any improvements.

---
*Built with 💚 for a cleaner planet.*
