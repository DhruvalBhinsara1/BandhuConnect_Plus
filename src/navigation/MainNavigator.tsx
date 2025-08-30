import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Volunteer Screens
import VolunteerDashboard from '../screens/volunteer/VolunteerDashboard';
import TaskList from '../screens/volunteer/TaskList';
import TaskDetails from '../screens/volunteer/TaskDetails';
import VolunteerProfile from '../screens/volunteer/VolunteerProfile';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import VolunteerManagement from '../screens/admin/VolunteerManagement';
import RequestManagement from '../screens/admin/RequestManagement';
import TaskAssignment from '../screens/admin/TaskAssignment';
import AdminProfile from '../screens/admin/AdminProfile';

// Pilgrim Screens
import PilgrimDashboard from '../screens/pilgrim/PilgrimDashboard';
import CreateRequest from '../screens/pilgrim/CreateRequest';
import RequestStatus from '../screens/pilgrim/RequestStatus';
import PilgrimProfile from '../screens/pilgrim/PilgrimProfile';

// Shared Screens
import ChatScreen from '../screens/shared/ChatScreen';
import MapScreen from '../screens/shared/MapScreen';
import NotificationScreen from '../screens/shared/NotificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const VolunteerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={VolunteerDashboard} />
    <Stack.Screen name="TaskList" component={TaskList} />
    <Stack.Screen name="TaskDetails" component={TaskDetails} />
    <Stack.Screen name="Profile" component={VolunteerProfile} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={AdminDashboard} />
    <Stack.Screen name="VolunteerManagement" component={VolunteerManagement} />
    <Stack.Screen name="RequestManagement" component={RequestManagement} />
    <Stack.Screen name="TaskAssignment" component={TaskAssignment} />
    <Stack.Screen name="Profile" component={AdminProfile} />
  </Stack.Navigator>
);

const ManagementStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VolunteerManagement" component={VolunteerManagement} />
    <Stack.Screen name="TaskAssignment" component={TaskAssignment} />
  </Stack.Navigator>
);

const RequestStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RequestManagement" component={RequestManagement} />
  </Stack.Navigator>
);

const PilgrimStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={PilgrimDashboard} />
    <Stack.Screen name="CreateRequest" component={CreateRequest} />
    <Stack.Screen name="RequestStatus" component={RequestStatus} />
    <Stack.Screen name="Profile" component={PilgrimProfile} />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  const { user } = useAuth();

  const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    switch (routeName) {
      case 'Home':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'Tasks':
        iconName = focused ? 'list' : 'list-outline';
        break;
      case 'Requests':
        iconName = focused ? 'add-circle' : 'add-circle-outline';
        break;
      case 'Management':
        iconName = focused ? 'people' : 'people-outline';
        break;
      case 'Map':
        iconName = focused ? 'map' : 'map-outline';
        break;
      case 'Chat':
        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        break;
      case 'Profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        iconName = 'home-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  if (user?.role === 'volunteer') {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) =>
            getTabBarIcon(route.name, focused, color, size),
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#6b7280',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={VolunteerStack} />
        <Tab.Screen name="Tasks" component={TaskList} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Profile" component={VolunteerProfile} />
      </Tab.Navigator>
    );
  }

  if (user?.role === 'admin') {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) =>
            getTabBarIcon(route.name, focused, color, size),
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#6b7280',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={AdminStack} />
        <Tab.Screen name="Management" component={ManagementStack} />
        <Tab.Screen name="Requests" component={RequestStack} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Profile" component={AdminProfile} />
      </Tab.Navigator>
    );
  }

  // Pilgrim navigation
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={PilgrimStack} />
      <Tab.Screen name="Requests" component={CreateRequest} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={PilgrimProfile} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
