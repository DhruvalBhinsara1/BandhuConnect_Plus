# BandhuConnect+

## Link of the repository :

- https://github.com/DhruvalBhinsara1/BandhuConnect_Plus

A comprehensive React Native application built with Expo for connecting volunteers and pilgrims during large public events. The app provides real-time location tracking, assignment management, and secure communication with automatic error recovery and cross-app synchronization.

## 🚀 Current Status (Updated September 2025)

**Production Ready Features:**
- ✅ Multi-role authentication (Volunteer/Pilgrim/Admin) with Supabase Auth
- ✅ Real-time location tracking with secure map integration
- ✅ Assignment system with automatic repair and visibility management
- ✅ Interactive maps with Google Maps integration
- ✅ Cross-platform compatibility (iOS/Android)
- ✅ Robust error handling with graceful subscription reconnection
- ✅ Database consistency with automatic assignment repair system

## Features

### For Volunteers
- View and accept pending assignments with "Mark Task Done" functionality
- Real-time location tracking with secure map integration
- Assignment visibility with automatic repair system
- Interactive maps showing pilgrim locations during active assignments
- Graceful error handling with subscription reconnection

### For Pilgrims  
- Create assistance requests with location and description
- Track assigned volunteer progress in real-time
- View assignment status updates automatically
- Secure location sharing during active assignments
- Assignment completion notifications

### For Administrators
- Mobile admin interface for system oversight
- User management and assignment monitoring through mobile app
- Real-time system health and error tracking
- Database maintenance and assignment repair tools
- Analytics and reporting capabilities via mobile interface

## Tech Stack

- **Frontend**: React Native 0.79.5 with Expo SDK 53
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Maps**: Google Maps API with react-native-maps 1.20.1
- **Authentication**: Supabase Auth with role-based access control
- **Real-time**: Supabase Realtime with graceful error handling
- **State Management**: React Context API with AuthContext and LocationContext
- **Location Services**: Expo Location 18.1.6 with background tracking
- **Database**: PostgreSQL with PostGIS for geographic data

## 🔧 Assignment System Architecture

- **Automatic Repair**: Built-in `assignmentRepairService` handles data inconsistencies
- **Visibility Management**: Ensures assignments appear correctly across all apps
- **Status Synchronization**: Real-time updates with `is_active` flag management
- **Error Recovery**: Silent reconnection for subscription failures
- **Constraint Handling**: Prevents duplicate active assignments per pilgrim
- **Cross-App Validation**: Changes validated across pilgrim, volunteer, and admin apps

## Error Handling & Reliability

- **Subscription Management**: Graceful reconnection without UI popups
- **Database Consistency**: Automatic repair for orphaned assignments
- **Location Services**: Robust handling of GPS and permission issues
- **Fallback Systems**: Alternative queries when primary functions fail
- **User-Friendly Messages**: Clear error communication without technical jargon

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd BandhuConnect_Plus
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (see docs/setup/ENVIRONMENT_SETUP.md)

4. Set up database (see database/testing/demo-data-setup.sql)

5. Start the development server
```bash
npx expo start
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components across roles
│   ├── AuthDebugger.tsx # Authentication debugging component
│   └── CustomSelector.tsx # Custom selection components
├── context/            # React Context providers
│   ├── AuthContext.tsx # Authentication state management
│   ├── ChatContext.tsx # Chat functionality context
│   └── LocationContext.tsx # Location tracking context
├── services/           # API and business logic
│   ├── assignmentService.ts # Assignment CRUD operations
│   ├── assignmentRepairService.ts # Automatic repair system
│   └── supabase.ts     # Supabase client configuration
├── constants/          # App constants and configuration
│   ├── appConfig.ts    # Application configuration
│   └── appRole.ts      # Role-based access definitions
└── types/              # TypeScript type definitions

database/
├── schema/             # Database schema files
├── functions/          # SQL functions and procedures
├── testing/            # Test data and scripts
├── maintenance/        # Database maintenance scripts
└── archive/            # Archived/deprecated files

docs/
├── api/                # API documentation
├── components/         # Component documentation
├── guides/             # User and developer guides
└── setup/              # Installation and setup guides
```

## Database Schema

The app uses a consolidated Supabase PostgreSQL schema with:
- User profiles with role-based access control
- Assistance requests with priority and status tracking
- Real-time location tracking with bi-directional visibility
- Assignment system with auto-assignment and skill matching
- Comprehensive RLS policies for data security
- Analytics and reporting functions

**Key Files:**
- `database/consolidated-schema.sql` - Complete database schema
- `database/consolidated-functions.sql` - Essential database functions
- `database/setup-instructions.md` - Setup and deployment guide

## Cross-App Consistency

All changes are validated across:
- **Pilgrim App**: Request creation and volunteer tracking
- **Volunteer App**: Assignment management and pilgrim tracking  
- **Admin App**: System oversight and bulk operations

Changes affecting one app are immediately validated in others to maintain system integrity.

## Development Guidelines

1. **Error Handling**: Always implement graceful error handling with user-friendly messages
2. **Cross-App Testing**: Test changes across all three app types
3. **Real-time Updates**: Ensure location and status changes propagate correctly
4. **Performance**: Optimize for battery life and network efficiency
5. **Security**: Follow RLS policies and role-based access patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper error handling
4. Test across all app types (pilgrim, volunteer, admin)
5. Update documentation if needed
6. Submit a pull request

## License

This project is licensed under the MIT License.

### Android
- Google Maps integration
- Android location services
- Background location tracking


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
- **Color Palette**: Professional blue/green theme
- **Typography**: Clean, readable fonts optimized for mobile
- 
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

### Backend Services
- **Supabase**: Database and real-time services
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

## 📞 Contact at

- **Email**: dhruvalbhinsara460@gmail.com

---

**BandhuConnect+** - Connecting communities, one request at a time. 🤝
