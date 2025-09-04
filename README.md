# BandhuConnect+

A comprehensive React Native application built with Expo for managing volunteers, pilgrims, and administrators during large public events. The app provides real-time location tracking, task assignment, and communication features with robust error handling and cross-app consistency.

## Features

### For Volunteers
- Real-time location tracking and sharing with graceful error handling
- Receive and accept assistance requests with smart auto-assignment
- Navigate to pilgrim locations with live updates
- Update task status and provide feedback
- View assigned pilgrims on interactive map with role-based markers

### For Pilgrims
- Request assistance with various categories and priorities
- Track assigned volunteer location in real-time with bi-directional visibility
- Receive updates on request status with user-friendly notifications
- Rate volunteer services and provide feedback

### For Administrators
- Comprehensive dashboard with system overview and analytics
- Manage volunteers and pilgrims with bulk operations
- Auto-assign requests to optimal volunteers with skill matching
- Monitor all activities and locations in real-time
- Bulk completion and system management tools

## Tech Stack

- **Frontend**: React Native with Expo SDK 53
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Maps**: Google Maps API with react-native-maps
- **Authentication**: Supabase Auth with role-based access
- **Real-time**: Supabase Realtime with intelligent filtering
- **State Management**: React Context API with error boundaries
- **UI**: Custom components with modern design and accessibility

## Real-time Location Features

- **Live Tracking**: 10-second interval updates with 25-meter movement threshold
- **Bi-directional Visibility**: Pilgrims see volunteers, volunteers see pilgrims
- **Role-based Markers**: 🔴 Pilgrims, 🟢 Volunteers, 🔵 Admins
- **Smart Navigation**: "Show Me" and "Fit in Frame" buttons with error handling
- **Stale Detection**: Visual indicators for offline users (>5 minutes)
- **Graceful Degradation**: Fallback queries when database functions unavailable
- **Battery Optimization**: Intelligent publishing strategy to preserve battery life

## Error Handling & Reliability

- **Location Service**: Graceful handling of permission denials and GPS issues
- **User-Friendly Messages**: Clear error messages instead of technical jargon
- **Fallback Systems**: Alternative queries when primary functions fail
- **Cross-App Consistency**: All changes validated across pilgrim, volunteer, and admin apps
- **Background Task Management**: Robust handling of location tracking errors

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

3. Set up environment variables (see ENVIRONMENT_SETUP.md)

4. Set up database (see database/setup-instructions.md)

5. Start the development server
```bash
npx expo start
```

## Project Structure

```
src/
├── components/          # Reusable UI components with error boundaries
├── screens/            # Screen components
│   ├── admin/          # Admin-specific screens with bulk operations
│   ├── shared/         # Shared screens across all roles
│   └── volunteer/      # Volunteer-specific screens
├── services/           # API and business logic with error handling
├── context/            # React Context providers with state management
├── constants/          # App constants and configuration
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
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
