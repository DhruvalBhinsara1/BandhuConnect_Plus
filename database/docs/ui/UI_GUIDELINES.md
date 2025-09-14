# UI/UX Design Guidelines

**Version:** 2.2.0  
**Design System:** Material Design 3  
**Target Platform:** iOS & Android Mobile Apps

## 🎨 **Design Philosophy**

### **Core Principles**

- **Accessibility First**: Designed for users of all ages and technical abilities
- **Cultural Sensitivity**: Respectful of religious and cultural contexts
- **Clarity Under Pressure**: Interface must work during stressful emergency situations
- **Universal Usability**: Minimal learning curve for diverse user backgrounds

### **Material Design 3 Implementation**

- **Dynamic Color**: Role-based theming with consistent color schemes
- **Adaptive Layouts**: Responsive design for 5"-7"+ screen sizes
- **Accessible Typography**: High contrast, readable text at all sizes
- **Touch Optimization**: Minimum 44px touch targets, gesture-friendly navigation

## 🌈 **Color System & Role-Based Theming**

### **Pilgrim App (Red Theme)**

```typescript
primaryColor: "#DC2626"; // Bold red for urgency and help requests
accentColor: "#EF4444"; // Lighter red for secondary actions
surfaceColor: "#FEF2F2"; // Light red background for cards
textColor: "#7F1D1D"; // Dark red for high contrast text
```

**Use Cases:**

- Emergency request buttons (medical, lost person)
- Urgent status indicators
- Help request confirmations
- Priority action items

### **Volunteer App (Green Theme)**

```typescript
primaryColor: "#16A34A"; // Professional green for service and help
accentColor: "#22C55E"; // Bright green for positive actions
surfaceColor: "#F0FDF4"; // Light green background for cards
textColor: "#14532D"; // Dark green for readability
```

**Use Cases:**

- Assignment acceptance buttons
- Success status indicators
- Navigation and routing elements
- Completion confirmations

### **Admin App (Blue Theme)**

```typescript
primaryColor: "#2563EB"; // Authoritative blue for management
accentColor: "#3B82F6"; // Standard blue for secondary actions
surfaceColor: "#EFF6FF"; // Light blue background for cards
textColor: "#1E3A8A"; // Dark blue for professional appearance
```

**Use Cases:**

- Administrative controls
- System management features
- Analytics and reporting
- Override and manual controls

### **Universal Colors**

```typescript
// Status Colors (consistent across all themes)
success: "#10B981"; // Green for completed actions
warning: "#F59E0B"; // Orange for caution and pending states
error: "#EF4444"; // Red for errors and critical issues
info: "#3B82F6"; // Blue for informational messages

// Neutral Colors
gray50: "#F9FAFB"; // Lightest background
gray100: "#F3F4F6"; // Light background
gray500: "#6B7280"; // Medium text
gray900: "#111827"; // Dark text
```

## 📱 **Component Design Standards**

### **Typography Scale**

#### **Headers**

```typescript
// Large Title (App headers)
fontSize: 28;
fontWeight: "700";
lineHeight: 34;
letterSpacing: -0.5;

// Section Headers
fontSize: 20;
fontWeight: "600";
lineHeight: 28;
letterSpacing: 0.2;

// Card Titles
fontSize: 16;
fontWeight: "600";
lineHeight: 24;
letterSpacing: 0.1;
```

#### **Body Text**

```typescript
// Primary Body
fontSize: 16;
fontWeight: "400";
lineHeight: 24;
letterSpacing: 0.1;

// Secondary Body
fontSize: 14;
fontWeight: "400";
lineHeight: 20;
letterSpacing: 0.1;

// Caption Text
fontSize: 12;
fontWeight: "500";
lineHeight: 16;
letterSpacing: 0.2;
```

### **Button Design System**

#### **Primary Buttons (Call-to-Action)**

```typescript
// Emergency/Help Request Buttons
backgroundColor: theme.primary;
borderRadius: 12;
paddingVertical: 16;
paddingHorizontal: 24;
minHeight: 56; // Accessible touch target
shadowOpacity: 0.12;
shadowRadius: 8;
elevation: 4;
```

#### **Secondary Buttons**

```typescript
// Support Actions
backgroundColor: "transparent";
borderWidth: 2;
borderColor: theme.primary;
borderRadius: 12;
paddingVertical: 14;
paddingHorizontal: 20;
```

#### **Icon Buttons**

```typescript
// Map controls, navigation
width: 48;
height: 48;
borderRadius: 24;
backgroundColor: theme.surface;
shadowOpacity: 0.1;
shadowRadius: 4;
```

### **Card Component Standards**

#### **Primary Cards (Main Content)**

```typescript
backgroundColor: '#FFFFFF'
borderRadius: 16
padding: 16
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.12
shadowRadius: 8
elevation: 6
borderWidth: 1
borderColor: '#F0F0F0'
```

#### **Information Cards**

```typescript
backgroundColor: theme.surface;
borderRadius: 12;
padding: 12;
borderWidth: 1;
borderColor: theme.borderLight;
```

## 🗺️ **Map Interface Guidelines**

### **Marker Design**

#### **User Location Markers**

```typescript
// Current User
color: theme.primary;
size: 14;
borderWidth: 3;
borderColor: "#FFFFFF";
shadowRadius: 4;

// Other Users
color: theme.counterpartColor;
size: 12;
borderWidth: 2;
borderColor: "#FFFFFF";
```

#### **Help Request Markers**

```typescript
// Active Requests
color: "#EF4444"; // Red for urgent visibility
size: 16;
pulse: true; // Animated attention-grabber
borderWidth: 2;
borderColor: "#FFFFFF";
```

### **Route Visualization**

```typescript
// Polyline Routes
strokeColor: "#10B981"; // Green for positive direction
strokeWidth: 4;
lineDashPattern: [8, 4]; // Dashed line for clarity
```

### **Distance & ETA Cards**

#### **Professional Tracking Style**

```typescript
// Positioned for accessibility
position: "absolute";
bottom: "8%"; // Lowered for better reach
left: 16;
right: 16;
backgroundColor: "#FFFFFF";
borderRadius: 16;
padding: 16;
shadowOpacity: 0.12;
shadowRadius: 8;
elevation: 6;
```

#### **Role-Specific Content**

```typescript
// Pilgrim Interface
title: "Help is on the way";
distanceLabel: "away";
etaLabel: "mins";

// Volunteer Interface
title: "Heading to help pilgrim";
distanceLabel: "to destination";
etaLabel: "min ETA";
```

## 🔄 **Interactive States**

### **Button States**

#### **Default State**

- Full opacity, standard colors
- Subtle shadow for depth
- Clear text and icons

#### **Pressed State**

```typescript
opacity: 0.8;
scale: 0.95;
shadowOpacity: 0.2;
```

#### **Disabled State**

```typescript
opacity: 0.5;
backgroundColor: theme.gray200;
color: theme.gray500;
```

### **Loading States**

#### **Loading Indicators**

```typescript
// Primary Loading
color: theme.primary;
size: "large";
backgroundColor: "rgba(255, 255, 255, 0.9)";
```

#### **Skeleton Loading**

```typescript
backgroundColor: theme.gray100;
borderRadius: 8;
animation: "pulse";
duration: 1500;
```

## ♿ **Accessibility Standards**

### **Touch Targets**

- **Minimum Size**: 44x44 points (iOS) / 48x48 dp (Android)
- **Spacing**: 8dp minimum between interactive elements
- **Hit Area**: Extend beyond visual boundaries when needed

### **Color Contrast**

- **Text on Background**: 4.5:1 minimum ratio (WCAG AA)
- **Large Text**: 3:1 minimum ratio
- **Icons**: 3:1 minimum ratio
- **Focus Indicators**: 3:1 against adjacent colors

### **Screen Reader Support**

```typescript
// Accessibility Labels
accessibilityLabel: "Emergency help request button"
accessibilityHint: "Double tap to request immediate assistance"
accessibilityRole: "button"
accessibilityState: { selected: false, disabled: false }
```

## 📊 **Layout Patterns**

### **Screen Structure**

#### **Standard Layout**

```typescript
// Header (8% of screen height)
// Content Area (80% of screen height)
// Bottom Navigation (12% of screen height)
```

#### **Map Screen Layout**

```typescript
// Header (6% - minimal for map focus)
// Map Area (88% - maximum map visibility)
// Legend/Controls (6% - overlay positioning)
```

### **Responsive Breakpoints**

#### **Small Phones (5.0" - 5.5")**

- Condensed padding (12dp)
- Single column layouts
- Larger touch targets

#### **Standard Phones (5.5" - 6.5")**

- Standard padding (16dp)
- Default component sizes
- Optimal touch targets

#### **Large Phones (6.5"+)**

- Expanded padding (20dp)
- Two-column layouts where appropriate
- Larger text sizes

## 🎯 **Context-Specific Guidelines**

### **Emergency Situations**

- **High Contrast**: Extra bold colors and text
- **Large Text**: 18sp minimum for critical information
- **Simple Navigation**: Reduce cognitive load
- **Clear Feedback**: Immediate visual confirmation of actions

### **Multi-Cultural Design**

- **Universal Icons**: Use internationally recognized symbols
- **RTL Support**: Layout adaptation for right-to-left languages
- **Cultural Colors**: Avoid culturally sensitive color combinations
- **Symbol Alternatives**: Provide text alternatives for all icons

### **Outdoor Usage**

- **High Contrast**: Optimized for bright sunlight
- **Large Touch Targets**: Compensate for movement and distractions
- **Battery Optimization**: Dark themes available for power saving
- **Offline Indicators**: Clear network status communication

## 🔧 **Implementation Guidelines**

### **Theme Context Usage**

```typescript
// Always use theme colors
const theme = useTheme();

// Good
backgroundColor: theme.surface;
color: theme.textPrimary;

// Avoid hardcoded colors
backgroundColor: "#FFFFFF";
color: "#000000";
```

### **Component Composition**

```typescript
// Reusable components with theme integration
const StyledButton = styled.TouchableOpacity`
  background-color: ${(props) => props.theme.primary};
  border-radius: 12px;
  padding: 16px 24px;
`;
```

### **Performance Considerations**

- **Image Optimization**: Use WebP format, appropriate resolutions
- **Animation Performance**: Use native driver when possible
- **Memory Management**: Proper cleanup of timers and subscriptions
- **Bundle Size**: Tree-shake unused components and utilities

---

**Next:** [Theme System](./THEME_SYSTEM.md) | [Component Architecture](../components/COMPONENT_ARCHITECTURE.md)
