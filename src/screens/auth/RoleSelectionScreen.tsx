import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Image, Animated, Dimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isLandscape = width > height;
const isSmallDevice = width < 375;
const scale = width / 375; // Base scale for iPhone 6/7/8

// Responsive functions
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const normalize = (size: number) => size * scale;

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { setUserRole } = useAuth();
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [pressedCard, setPressedCard] = useState<string | null>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRoleSelection = (role: 'admin' | 'volunteer' | 'pilgrim') => {
    // Set the user role and navigate to appropriate login screen
    setUserRole(role);
    
    switch (role) {
      case 'admin':
        navigation.navigate('AdminLogin');
        break;
      case 'volunteer':
        navigation.navigate('VolunteerLogin');
        break;
      case 'pilgrim':
        navigation.navigate('PilgrimLogin');
        break;
      default:
        navigation.navigate('Login', { role });
    }
  };

  const roles = [
    {
      id: 'pilgrim',
      title: 'Pilgrim',
      description: 'Request help and assistance during events',
      backgroundColor: '#FFFBEB',
      gradientColors: ['#FFFBEB', '#FEF3C7'],
      textColor: '#92400E',
      descriptionColor: '#B45309',
      icon: 'help-circle',
      iconColor: '#D97706',
      iconBackground: '#FED7AA',
    },
    {
      id: 'volunteer',
      title: 'Volunteer',
      description: 'Provide help and assistance to pilgrims',
      backgroundColor: '#F0FDF4',
      gradientColors: ['#F0FDF4', '#A7F3D0'],
      textColor: '#065F46',
      descriptionColor: '#047857',
      icon: 'heart',
      iconColor: '#059669',
      iconBackground: '#BBF7D0',
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage and coordinate the platform',
      backgroundColor: '#F8FAFC',
      gradientColors: ['#F8FAFC', '#E2E8F0'],
      textColor: '#1E293B',
      descriptionColor: '#475569',
      icon: 'settings',
      iconColor: '#3B82F6',
      iconBackground: '#DBEAFE',
    },
  ];

  return (
    <SafeAreaView style={[getResponsiveStyles().container, { backgroundColor: theme.theme.background }]}>
      {/* Background decoration inspired by modern design */}
      <Animated.View style={[getResponsiveStyles().backgroundDecoration]} />
      
      <Animated.View 
        style={[
          getResponsiveStyles().content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo and header */}
        <View style={getResponsiveStyles().header}>
          <Image
            source={require('../../../assets/BandhuConnectPlus.png')}
            style={getResponsiveStyles().logo}
            resizeMode="contain"
          />
          <Text 
            style={[getResponsiveStyles().subtitle, { color: theme.theme.textSecondary }]}
            maxFontSizeMultiplier={1.3}
          >
            Choose your role to get started
          </Text>
        </View>
        
        {/* Role selection cards with modern styling */}
        <View style={getResponsiveStyles().roleContainer}>
          {roles.map((role, index) => {
            const responsiveStyles = getResponsiveStyles();
            const currentWidth = Dimensions.get('window').width;
            const isTablet = currentWidth >= 768;
            const iconSize = isTablet ? normalize(36) : normalize(32);
            
            return (
              <Animated.View
                key={role.id}
                style={[
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 50 + index * 20],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    responsiveStyles.roleButton,
                    { 
                      backgroundColor: role.backgroundColor,
                      borderColor: role.iconColor + '30',
                      transform: pressedCard === role.id ? [{ scale: 0.98 }] : [{ scale: 1 }],
                    },
                  ]}
                  onPress={() => handleRoleSelection(role.id as any)}
                  onPressIn={() => setPressedCard(role.id)}
                  onPressOut={() => setPressedCard(null)}
                  activeOpacity={0.9}
                  {...getAccessibilityProps(role)}
                >
                  <View style={responsiveStyles.roleButtonContent}>
                    <View style={responsiveStyles.roleTextSection}>
                      <Text 
                        style={[responsiveStyles.roleTitle, { color: role.textColor }]}
                        maxFontSizeMultiplier={1.2}
                      >
                        {role.title}
                      </Text>
                      <Text 
                        style={[responsiveStyles.roleDescription, { color: role.descriptionColor }]}
                        maxFontSizeMultiplier={1.3}
                      >
                        {role.description}
                      </Text>
                    </View>
                    
                    <View style={[responsiveStyles.iconContainer, { backgroundColor: role.iconBackground }]}>
                      <Ionicons 
                        name={role.icon as any} 
                        size={iconSize}
                        color={role.iconColor}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Footer with app mission */}
        <View style={getResponsiveStyles().footer}>
          <Text 
            style={[getResponsiveStyles().footerText, { color: theme.theme.textTertiary }]}
            maxFontSizeMultiplier={1.2}
          >
            Connecting everyone, one at a time.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// Responsive styles function
const getResponsiveStyles = () => {
  const currentWidth = Dimensions.get('window').width;
  const currentHeight = Dimensions.get('window').height;
  const isCurrentTablet = currentWidth >= 768;
  const isCurrentLandscape = currentWidth > currentHeight;
  const isSmallDevice = currentWidth < 360;
  const currentScale = currentWidth / 375;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundDecoration: {
      position: 'absolute',
      top: isCurrentTablet ? -150 : -100,
      right: isCurrentTablet ? -150 : -100,
      width: isCurrentTablet ? 300 : 200,
      height: isCurrentTablet ? 300 : 200,
      borderRadius: isCurrentTablet ? 150 : 100,
      backgroundColor: 'rgba(37, 99, 235, 0.05)',
    },
    content: {
      flex: 1,
      paddingHorizontal: wp(6),
      paddingTop: hp(0.5), // Reduced top padding for better space utilization
      paddingBottom: hp(3),
      maxWidth: isCurrentTablet ? 600 : '100%',
      alignSelf: 'center',
      width: '100%',
      justifyContent: 'space-between',
    },
    header: {
      alignItems: 'center',
      marginBottom: hp(isCurrentLandscape ? 1.5 : 1.5),
      paddingVertical: hp(0.1),
      paddingHorizontal: wp(4),
    },
    logo: {
      width: isCurrentTablet ? normalize(350) : isCurrentLandscape ? normalize(280) : isSmallDevice ? normalize(220) : normalize(260),
      height: isCurrentTablet ? normalize(350) : isCurrentLandscape ? normalize(280) : isSmallDevice ? normalize(220) : normalize(260),
      marginBottom: hp(-1), // Negative margin to allow text overlap
      borderRadius: normalize(40),
    },
    subtitle: {
      fontSize: isCurrentTablet ? normalize(18) : isSmallDevice ? normalize(13) : normalize(15),
      fontWeight: '600',
      textAlign: 'center',
      opacity: 0.75,
      letterSpacing: 0.2,
      marginTop: hp(0.5), // Reduced margin to overlap with transparent logo area
      paddingHorizontal: wp(8),
      lineHeight: normalize(22),
      textShadowColor: 'rgba(0, 0, 0, 0.08)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    roleContainer: {
      flex: 1,
      justifyContent: 'center',
      gap: hp(2.5),
      paddingHorizontal: wp(1),
      maxWidth: isCurrentTablet ? 500 : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    roleButton: {
      borderRadius: normalize(28),
      padding: isCurrentTablet ? normalize(28) : normalize(24),
      borderWidth: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 10,
      minHeight: normalize(80),
    },
    roleButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: normalize(64),
    },
    roleTextSection: {
      flex: 1,
      paddingRight: wp(5),
      justifyContent: 'center',
    },
    roleTitle: {
      fontSize: isCurrentTablet ? normalize(24) : normalize(22),
      fontWeight: '800',
      marginBottom: hp(1),
      letterSpacing: -0.3,
    },
    roleDescription: {
      fontSize: isCurrentTablet ? normalize(16) : normalize(14),
      fontWeight: '500',
      opacity: 0.85,
      lineHeight: normalize(22),
      letterSpacing: 0.1,
    },
    iconContainer: {
      width: normalize(64),
      height: normalize(64),
      borderRadius: normalize(32),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    footer: {
      alignItems: 'center',
      marginTop: hp(3),
      paddingBottom: hp(2.5),
      paddingHorizontal: wp(6),
      paddingTop: hp(2),
    },
    footerText: {
      fontSize: isCurrentTablet ? normalize(16) : normalize(14),
      fontWeight: '500',
      opacity: 0.65,
      textAlign: 'center',
      letterSpacing: 0.3,
      fontStyle: 'italic',
      lineHeight: normalize(20),
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });
};

// Accessibility and responsive utility functions
const getAccessibilityProps = (role: any) => ({
  accessibilityRole: 'button' as const,
  accessibilityLabel: `Select ${role.title} role`,
  accessibilityHint: role.description,
  accessible: true,
  // Minimum touch target of 48x48 for accessibility
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
});

const getDeviceInfo = () => {
  const { width, height } = Dimensions.get('window');
  return {
    isTablet: width >= 768,
    isLandscape: width > height,
    isSmallDevice: width < 360,
    scale: width / 375, // Base design width
    screenSize: width < 360 ? 'small' : width < 768 ? 'medium' : 'large',
    aspectRatio: width / height,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 20,
  },
  logo: {
    width: 350,
    height: 350,
    marginBottom: 16,
    borderRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.7,
    letterSpacing: 0.3,
    marginTop: 8,
  },
  roleContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 4,
  },
  roleButton: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    marginVertical: 4,
  },
  roleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  roleTextSection: {
    flex: 1,
    paddingRight: 20,
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  roleDescription: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.85,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.5,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default RoleSelectionScreen;
