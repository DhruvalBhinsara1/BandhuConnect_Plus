# Quick Start Guide

**Version:** 2.2.0  
**Estimated Time:** 5 minutes  
**Prerequisites:** Node.js 18+, Git

Get BandhuConnect+ running on your development machine in under 5 minutes.

## 🚀 **1-Minute Setup**

```bash
# Clone the repository
git clone https://github.com/DhruvalBhinsara1/BandhuConnect_Plus.git
cd BandhuConnect_Plus

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase and Google Maps credentials

# Install dependencies
npm install

# Start the development server
npm start
```

**⚠️ Important**: You'll need to add your Supabase and Google Maps API credentials to the `.env` file before the app will work properly.

## 📱 **Running on Your Device**

### **Option A: Expo Go App (Recommended)**

1. Install **Expo Go** from your app store ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Scan the QR code shown in your terminal
3. The app will load automatically

### **Option B: Development Build**

```bash
# For Android
npm run android

# For iOS (macOS only)
npm run ios
```

## 🎭 **Choose Your Role**

BandhuConnect+ has three different app configurations:

### **Pilgrim App** (Red Theme)

```bash
# Edit src/constants/appRole.ts
export const APP_ROLE: AppRole = 'pilgrim';
```

### **Volunteer App** (Green Theme)

```bash
# Edit src/constants/appRole.ts
export const APP_ROLE: AppRole = 'volunteer';
```

### **Admin App** (Blue Theme)

```bash
# Edit src/constants/appRole.ts
export const APP_ROLE: AppRole = 'admin';
```

## 🧪 **Demo Environment**

### **Test Users Ready to Use**

| Role          | Email                        | Password      | Name           |
| ------------- | ---------------------------- | ------------- | -------------- |
| **Pilgrim**   | `test.pilgrim@example.com`   | `testpass123` | Test Pilgrim   |
| **Volunteer** | `test.volunteer@example.com` | `testpass123` | Test Volunteer |
| **Admin**     | `test.admin@example.com`     | `testpass123` | Test Admin     |

### **Demo Location: Parul University**

- **Coordinates**: 22.2587° N, 73.2121° E
- **Test Scenarios**: Campus-based help requests and volunteer responses
- **Real Environment**: Actual coordinates for realistic testing

## ⚡ **Quick Feature Test**

### **As a Pilgrim:**

1. Sign in with pilgrim credentials
2. Tap "Need Help" button
3. Select help type (Medical, Navigation, etc.)
4. Submit request
5. Watch volunteer assignment in real-time

### **As a Volunteer:**

1. Sign in with volunteer credentials
2. Go to "Live Map" tab
3. Enable location tracking
4. Wait for assignment notifications
5. Navigate to assigned pilgrim

### **As an Admin:**

1. Sign in with admin credentials
2. View "Analytics Dashboard"
3. Monitor active assignments
4. Manually assign volunteers if needed

## 🔧 **Development Tools**

### **Useful Commands**

```bash
# Clear cache and restart
npm start -- --clear

# Run with specific platform
npm start -- --android
npm start -- --ios

# View logs
npm run logs

# TypeScript check
npm run type-check
```

### **VS Code Extensions (Recommended)**

- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Expo Tools**
- **React Native Tools**

## 🗂️ **Project Structure Overview**

```
src/
├── components/     # Reusable UI components
├── screens/        # App screens (pilgrim/, volunteer/, shared/)
├── services/       # API and business logic
├── navigation/     # Screen routing
├── context/        # React context providers
├── constants/      # App configuration
└── theme/          # Styling and colors
```

## 🎯 **Next Steps**

### **For Development:**

- [Full Installation Guide](./INSTALLATION.md) - Detailed setup instructions
- [Development Guide](../development/DEVELOPMENT_GUIDE.md) - Coding standards and workflow
- [Component Architecture](../components/COMPONENT_ARCHITECTURE.md) - UI structure

### **For Testing:**

- [Demo Environment](../testing/DEMO_ENVIRONMENT.md) - Comprehensive testing scenarios
- [Testing Guide](../testing/TESTING_GUIDE.md) - How to test features

### **For Deployment:**

- [Build Instructions](./BUILD_INSTRUCTIONS.md) - Creating production builds
- [Production Deployment](../deployment/PRODUCTION.md) - Going live

## ❓ **Need Help?**

### **Common Issues**

- **Metro bundler issues**: Try `npm start -- --clear`
- **Dependencies issues**: Delete `node_modules` and run `npm install`
- **Expo Go not connecting**: Ensure same WiFi network

### **Get Support**

- 📚 [Troubleshooting Guide](../reference/TROUBLESHOOTING.md)
- 🐛 [Report Issues](https://github.com/DhruvalBhinsara1/BandhuConnect_Plus/issues)
- 💬 [Discussions](https://github.com/DhruvalBhinsara1/BandhuConnect_Plus/discussions)

---

**Next:** [Installation Guide](./INSTALLATION.md) | [Project Overview](../project/PROJECT_OVERVIEW.md)
