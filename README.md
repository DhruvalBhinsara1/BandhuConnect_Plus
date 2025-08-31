# BandhuConnect+ - Community Assistance Platform

A comprehensive cross-platform React Native application built with Expo SDK 53 for community assistance during large public events. The platform serves three user types: **Volunteers**, **Admins**, and **Pilgrims/Attendees**.

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React Native 0.75.4 + Expo SDK 53
- **Cross-Platform**: iOS, Android, and Web support
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Navigation**: React Navigation v6
- **Maps**: react-native-maps with Google Maps API
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Context API + Hooks
- **Image Handling**: Expo ImagePicker + Supabase Storage
- **Authentication**: Supabase Auth (Phone OTP + Email/Password)
- **Real-time**: Supabase Realtime for chat and live updates

### Project Structure
```
BandhuConnectPlus/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Common components (Button, Input, etc.)
│   │   ├── maps/           # Map-related components
│   │   └── chat/           # Chat components
│   ├── screens/            # Screen components organized by user type
│   │   ├── auth/           # Authentication screens
│   │   ├── volunteer/      # Volunteer-specific screens
│   │   ├── admin/          # Admin-specific screens
│   │   └── pilgrim/        # Pilgrim-specific screens
│   ├── navigation/         # Navigation configuration
│   ├── context/            # React Context providers
│   ├── services/           # API services and Supabase client
│   ├── utils/              # Utility functions
│   ├── constants/          # App constants and configurations
│   └── types/              # TypeScript type definitions
├── assets/                 # Images, fonts, and other assets
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # NativeWind configuration
└── .env                   # Environment variables
```

## 🎯 Core Features (Current Implementation Status)

### 👥 User Types & Capabilities

#### 🚀 Volunteers (Mobile App) - ✅ IMPLEMENTED
- **Authentication**: ✅ Phone OTP and email login with role-based access
- **Dashboard**: ✅ View assigned tasks, status management, live statistics
- **Task Management**: ✅ Accept/complete assignments with status updates
- **Profile Management**: ✅ Update skills, availability, contact information
- **Real-time Updates**: ✅ Live volunteer status and assignment tracking

#### 👑 Admins (Mobile/Web Interface) - ✅ FULLY OPERATIONAL
- **Volunteer Management**: ✅ Monitor all volunteers, update profiles, manage status
- **Request Management**: ✅ View/create/delete assistance requests
- **Task Assignment**: ✅ Manual and auto-assignment with skill matching (76% success rate)
- **Analytics Dashboard**: ✅ Real-time statistics, volunteer counts, request tracking
- **Profile Editing**: ✅ Full CRUD operations on volunteer profiles with persistence
- **Auto-Assignment System**: ✅ Intelligent matching based on skills, location, availability

#### 🙏 Pilgrims/Attendees (Mobile App) - 🚧 BASIC IMPLEMENTATION
- **Authentication**: ✅ Registration and login system
- **Request Creation**: ✅ Submit assistance requests with details
- **Status Tracking**: ✅ Monitor request progress
- **Profile Management**: ✅ Basic profile functionality

## 🗄️ Database Schema

### Core Tables (Supabase PostgreSQL)

#### `profiles` Table
```sql
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- name (text)
- email (text)
- phone (text)
- role (enum: 'volunteer', 'admin', 'pilgrim')
- skills (text[])
- age (integer)
- location (geography)
- status (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `assistance_requests` Table
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- type (enum: 'medical', 'safety', 'lost_child', 'sanitation', 'general')
- title (text)
- description (text)
- photo_url (text)
- location (geography)
- status (enum: 'pending', 'assigned', 'in_progress', 'completed', 'cancelled')
- priority (enum: 'low', 'medium', 'high', 'emergency')
- created_at (timestamp)
- updated_at (timestamp)
```

#### `assignments` Table
```sql
- id (uuid, primary key)
- request_id (uuid, references assistance_requests)
- volunteer_id (uuid, references profiles)
- status (enum: 'assigned', 'accepted', 'on_duty', 'completed')
- assigned_at (timestamp)
- accepted_at (timestamp)
- started_at (timestamp)
- completed_at (timestamp)
```

#### `messages` Table
```sql
- id (uuid, primary key)
- sender_id (uuid, references profiles)
- receiver_id (uuid, references profiles, nullable)
- channel_id (text)
- content (text)
- message_type (enum: 'text', 'image', 'location')
- created_at (timestamp)
```

## 🔄 User Journeys

### Volunteer Journey
1. **Sign Up** → Enter details, select skills, verify phone/email
2. **Dashboard** → View assigned tasks, check current status
3. **Accept Task** → Review request details, accept assignment
4. **Navigate** → Use integrated maps to reach location
5. **Check In** → Update status to "on duty" at location
6. **Complete Task** → Mark task as completed, add notes
7. **Chat** → Communicate with admins and other volunteers

### Admin Journey
1. **Login** → Access web dashboard with admin credentials
2. **Monitor** → View real-time volunteer status and requests
3. **Assign Tasks** → Match volunteers to incoming requests
4. **Track Progress** → Monitor task completion and volunteer locations
5. **Analytics** → Review performance metrics and reports
6. **Communicate** → Send broadcasts and manage chat channels

### Pilgrim Journey
1. **Sign Up** → Quick registration with basic details
2. **Request Help** → Select issue type, add description and photo
3. **Share Location** → Allow GPS access for precise location
4. **Track Status** → Monitor request progress and volunteer ETA
5. **Receive Help** → Interact with assigned volunteer
6. **Provide Feedback** → Rate service and add comments

## 🔧 Technical Implementation

### State Management
- **AuthContext**: User authentication and session management
- **LocationContext**: GPS tracking and location services
- **ChatContext**: Real-time messaging and notifications
- **RequestContext**: Request creation and status updates

### API Services
- **authService**: Authentication operations
- **profileService**: User profile management
- **requestService**: Request CRUD operations
- **assignmentService**: Task assignment management
- **chatService**: Real-time messaging
- **locationService**: GPS and mapping utilities

### Security Features
- **Row Level Security (RLS)**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **Environment Variables**: Secure credential management
- **Input Validation**: Client and server-side validation
- **Image Upload Security**: Secure file handling with Supabase Storage

### Real-time Features
- **Live Chat**: Instant messaging with Supabase Realtime
- **Status Updates**: Real-time task and volunteer status changes
- **Location Tracking**: Live GPS updates for volunteers
- **Push Notifications**: Expo Push Notifications for alerts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account and project
- Google Maps API key (for maps functionality)

### Installation
1. **Clone and Setup**
   ```bash
   cd BandhuConnectPlus
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ywntkafcfuugzgcduekj.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

3. **Database Setup**
   - Run SQL migrations in Supabase dashboard
   - Configure Row Level Security policies
   - Set up Storage buckets for image uploads

4. **Development**
   ```bash
   # Start development server
   npx expo start
   
   # Run on specific platforms
   npx expo start --ios
   npx expo start --android
   npx expo start --web
   ```

### Testing
- **Mobile**: Use Expo Go app to scan QR code
- **Web**: Open localhost:8081 in browser
- **Device Testing**: Test on physical devices for location features

## 📱 Platform-Specific Features

### iOS
- Native map integration with Apple Maps fallback
- iOS-specific location permissions
- Push notification support

### Android
- Google Maps integration
- Android location services
- Background location tracking

### Web
- Responsive design for desktop/tablet
- Web-based maps (Google Maps JavaScript API)
- Progressive Web App (PWA) capabilities

## 🔒 Security & Privacy

### Data Protection
- End-to-end encryption for sensitive data
- Secure image upload with file type validation
- Location data anonymization options
- GDPR compliance considerations

### Access Control
- Role-based permissions (Volunteer/Admin/Pilgrim)
- API rate limiting
- Secure authentication flows
- Session management

## 🎨 UI/UX Design Principles

### Design System
- **Color Palette**: Professional blue/green theme with dark mode support
- **Typography**: Clean, readable fonts optimized for mobile
- **Icons**: Vector icons only (no emojis) using @expo/vector-icons
- **Spacing**: Consistent spacing using Tailwind CSS utilities
- **Accessibility**: WCAG compliant with screen reader support

### User Experience
- **Intuitive Navigation**: Clear, simple navigation patterns
- **Loading States**: Skeleton screens and loading indicators
- **Error Handling**: User-friendly error messages
- **Offline Support**: Basic offline functionality for critical features

## 📊 Performance Optimization

### App Performance
- **Code Splitting**: Lazy loading for non-critical screens
- **Image Optimization**: Compressed images with caching
- **Bundle Size**: Optimized dependencies and tree shaking
- **Memory Management**: Efficient state management and cleanup

### Network Optimization
- **Caching**: Smart caching for API responses
- **Compression**: Gzip compression for API calls
- **Batching**: Batch API requests where possible
- **Offline Sync**: Queue operations for offline scenarios

## 🚀 Deployment

### Mobile Apps
- **Expo EAS Build**: Production builds for app stores
- **App Store**: iOS App Store submission
- **Google Play**: Android Play Store submission

### Web Application
- **Vercel**: Web deployment for admin dashboard
- **CDN**: Static asset delivery
- **SSL**: HTTPS encryption

## 🔄 Future Enhancements

### Phase 2 Features
- **Advanced Analytics**: Detailed reporting and insights
- **Multi-language**: Full i18n support
- **Offline Mode**: Complete offline functionality
- **AI Integration**: Smart task assignment algorithms

### Scalability
- **Microservices**: Break down into smaller services
- **Caching Layer**: Redis for improved performance
- **Load Balancing**: Handle increased user load
- **Monitoring**: Application performance monitoring

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Testing**: Unit and integration tests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **Email**: support@bandhuconnect.com
- **Documentation**: [docs.bandhuconnect.com](https://docs.bandhuconnect.com)
- **Issues**: GitHub Issues tab

---

**BandhuConnect+** - Connecting communities, one request at a time. 🤝
