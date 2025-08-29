# BandhuConnect+ Admin Dashboard

A React-based admin dashboard for managing the BandhuConnect+ platform.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
1. Go to your [Supabase project dashboard](https://supabase.com/dashboard)
2. Navigate to Settings → API
3. Copy your Project URL and anon/public key
4. Update the `.env` file with your actual values:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the Application
```bash
npm start
```

The application will open at `http://localhost:3000`

## Features

- **Authentication**: Secure admin login using Supabase Auth
- **Dashboard**: Admin interface for managing the platform
- **Responsive Design**: Works on desktop and mobile devices

## Troubleshooting

- **Missing environment variables**: Ensure your `.env` file has valid Supabase credentials
- **Router errors**: Make sure `react-router-dom` is installed
- **Build errors**: Run `npm install` to ensure all dependencies are installed

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── LoginPage.js    # Admin login page
│   └── DashboardPage.js # Main dashboard
├── App.js              # Main app component with routing
├── index.js            # App entry point
└── supabase.js         # Supabase client configuration
```
