# Quick Start Guide

Get your Online Bookstore up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- A web browser (Chrome, Firefox, Safari, or Edge)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Appwrite

### Option A: Use Mock Data (No Setup Required)

The app works out of the box with mock data! Just skip to Step 3.

### Option B: Connect to Appwrite (Recommended)

1. **Create Appwrite Account**
   - Go to https://cloud.appwrite.io
   - Sign up for free account
   - Create a new project

2. **Get Your Credentials**
   - Copy your Project ID from the dashboard
   - Your endpoint is: `https://cloud.appwrite.io/v1`

3. **Create Environment File**
   ```bash
   cp .env.example .env
   ```

4. **Update `.env` file**
   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_actual_project_id
   ```

5. **Enable Email/Password Auth in Appwrite**
   - Go to your Appwrite project
   - Navigate to "Auth" section
   - Enable "Email/Password" provider

## Step 3: Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Step 4: Create Your First Account

1. Click "Sign up"
2. Enter your details:
   - Full Name: `Admin User`
   - Email: `admin@bookstore.com`
   - Password: `password123` (or stronger)
3. Click "Create Account"

## Step 5: Make Yourself Admin (Optional)

To access admin features:

### If using Appwrite:
1. Go to Appwrite Console
2. Navigate to Auth > Users
3. Find your user
4. Click on Preferences tab
5. Add JSON:
   ```json
   {
     "role": "admin"
   }
   ```
6. Save and reload the app

### If using mock data:
- Edit `/src/lib/api.ts`
- In the `register` method, change:
  ```typescript
  role: 'user',  // Change to 'admin'
  ```

## Step 6: Explore the Features

### As a Customer:
- 📚 Browse books in the catalog
- 🔍 Search for books by title or author
- 🏷️ Filter by category
- 🛒 Add books to cart
- 📦 Place orders
- 👤 Manage your profile

### As an Admin:
- 📊 View dashboard analytics
- ➕ Add new books
- ✏️ Edit book information
- 🗑️ Delete books
- 👥 View all users
- 📈 Access sales reports

## Default Test Accounts

If you want to quickly test features, use these credentials:

**Customer Account:**
```
Email: customer@bookstore.com
Password: password123
```

**Admin Account:**
```
Email: admin@bookstore.com
Password: password123
```

_(Note: These only work if you create them first!)_

## Common First-Time Issues

### Issue: "Appwrite Project ID not configured"
**Solution:** Create a `.env` file with your Appwrite credentials or use mock data

### Issue: Can't login after registration
**Solution:** 
- Check that Email/Password auth is enabled in Appwrite
- Verify your Project ID is correct in `.env`
- Make sure you're using the same email you registered with

### Issue: Admin dashboard shows "Permission denied"
**Solution:** Update user role to 'admin' in Appwrite Console (see Step 5)

### Issue: CORS error in browser console
**Solution:** 
- Go to Appwrite Console > Settings
- Add your app URL to "Platforms" (e.g., `http://localhost:5173`)

## Quick Command Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Seed database (if using Appwrite)
node scripts/seed-data.js
```

## Project Structure Overview

```
/
├── src/
│   ├── app/
│   │   ├── components/ui/    # Reusable UI components
│   │   ├── App.tsx           # Main app component
│   │   └── routes.tsx        # Route configuration
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication state
│   ├── lib/
│   │   ├── api.ts           # API service layer
│   │   ├── appwrite.ts      # Appwrite config
│   │   └── encryption.ts    # AES-256-GCM encryption
│   └── pages/
│       ├── Login.tsx        # Login page
│       ├── Register.tsx     # Registration page
│       ├── Books.tsx        # Book catalog
│       ├── BookDetail.tsx   # Book details
│       ├── Cart.tsx         # Shopping cart
│       ├── Orders.tsx       # Order history
│       ├── Profile.tsx      # User profile
│       └── Admin.tsx        # Admin dashboard
├── .env                     # Environment variables
└── package.json             # Dependencies
```

## Next Steps

Now that you're up and running:

1. ✅ **Customize the Design**
   - Edit Tailwind theme in `/src/styles/theme.css`
   - Update component styles

2. ✅ **Add Real Data**
   - Set up Appwrite database (see APPWRITE_SETUP.md)
   - Run seed script to populate books
   - Connect to real API endpoints

3. ✅ **Enhance Security**
   - Review encryption implementation
   - Set up proper authentication rules
   - Configure CORS properly

4. ✅ **Deploy to Production**
   - See README.md for deployment guides
   - Set up environment variables on your host
   - Configure production Appwrite project

## Learning Resources

- 📖 [Full Documentation](./README.md)
- 🔧 [Appwrite Setup Guide](./APPWRITE_SETUP.md)
- ✨ [Feature Documentation](./FEATURES.md)
- 🎯 [API Documentation](./src/lib/api.ts)

## Getting Help

If you run into issues:

1. Check the documentation files
2. Review the console for error messages
3. Verify your `.env` configuration
4. Check Appwrite Console for issues
5. Review the code comments

## Pro Tips

💡 **Enable React DevTools** - Install the React Developer Tools browser extension for easier debugging

💡 **Use Mock Data First** - Get familiar with the app using mock data before setting up Appwrite

💡 **Check the Network Tab** - Use browser DevTools Network tab to debug API calls

💡 **Read the Code** - The codebase is well-commented and organized for learning

## What's Next?

Once you're comfortable with the basics:

- Add payment processing
- Implement email notifications
- Create a recommendation engine
- Add book reviews
- Build a mobile app
- Integrate with external APIs

---

**Happy coding! 🚀**

Need help? Check the docs or open an issue on GitHub.
