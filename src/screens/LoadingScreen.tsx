import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../theme';

const { width, height } = Dimensions.get('window');

const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Progress bar animation
    const progressAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    pulseAnimation.start();
    progressAnimation.start();

    return () => {
      pulseAnimation.stop();
      progressAnimation.stop();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background gradient overlay */}
      <View style={styles.gradientOverlay} />
      
      {/* Main content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo with pulse animation */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* App title */}
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          BandhuConnect+
        </Text>
        
        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Connecting Communities in Need
        </Text>
        
        {/* Professional Loading Bar */}
        <View style={styles.loadingContainer}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: theme.borderLight }]}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { 
                    backgroundColor: theme.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>
            <View style={styles.progressDots}>
              <Animated.View 
                style={[
                  styles.progressDot, 
                  { 
                    backgroundColor: theme.primary,
                    opacity: progressAnim.interpolate({
                      inputRange: [0, 0.33, 0.66, 1],
                      outputRange: [0.3, 1, 0.3, 0.3],
                    })
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.progressDot, 
                  { 
                    backgroundColor: theme.primary,
                    opacity: progressAnim.interpolate({
                      inputRange: [0, 0.33, 0.66, 1],
                      outputRange: [0.3, 0.3, 1, 0.3],
                    })
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.progressDot, 
                  { 
                    backgroundColor: theme.primary,
                    opacity: progressAnim.interpolate({
                      inputRange: [0, 0.33, 0.66, 1],
                      outputRange: [0.3, 0.3, 0.3, 1],
                    })
                  }
                ]} 
              />
            </View>
          </View>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Initializing...
          </Text>
        </View>
      </Animated.View>
      
      {/* Version info */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.textTertiary }]}>
          Version 2.2.0
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 50,
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    width: 200,
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    opacity: 0.7,
  },
  versionContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.5,
  },
});

export default LoadingScreen;
