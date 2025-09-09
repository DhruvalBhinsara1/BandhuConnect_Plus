import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Animated, 
  Dimensions,
  StatusBar 
} from 'react-native';
import { useTheme } from '../../theme';

const { width, height } = Dimensions.get('window');

const LoadingScreen: React.FC = () => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo animation sequence
    Animated.sequence([
      // Logo scale and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in after logo
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

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
    
    // Subtle pulse animation for logo
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

    setTimeout(() => {
      progressAnimation.start();
      pulseAnimation.start();
    }, 1000);

    return () => {
      progressAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.theme.background} />
      
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Main content */}
      <View style={styles.content}>
        {/* Logo container with animation */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim }
              ]
            }
          ]}
        >
          <Image
            source={require('../../assets/BandhuConnect+.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App title and subtitle */}
        <Animated.View 
          style={[styles.textContainer, { opacity: textFadeAnim }]}
        >
          <Text style={[styles.title, { color: theme.theme.textPrimary }]}>
            BandhuConnect+
          </Text>
          <Text style={[styles.subtitle, { color: theme.theme.textSecondary }]}>
            Connecting Hearts, Ensuring Safety
          </Text>
          <Text style={[styles.version, { color: theme.theme.textTertiary }]}>
            Version 2.3.2
          </Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View 
          style={[styles.loadingContainer, { opacity: textFadeAnim }]}
        >
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: theme.theme.borderLight }]}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { 
                    backgroundColor: theme.theme.primary,
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
                    backgroundColor: theme.theme.primary,
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
                    backgroundColor: theme.theme.primary,
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
                    backgroundColor: theme.theme.primary,
                    opacity: progressAnim.interpolate({
                      inputRange: [0, 0.33, 0.66, 1],
                      outputRange: [0.3, 0.3, 0.3, 1],
                    })
                  }
                ]} 
              />
            </View>
          </View>
          <Text style={[styles.loadingText, { color: theme.theme.textSecondary }]}>
            Initializing...
          </Text>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View 
        style={[styles.footer, { opacity: textFadeAnim }]}
      >
        <Text style={[styles.footerText, { color: theme.theme.textTertiary }]}>
          Bringing help to those who need it most
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  version: {
    fontSize: 12,
    fontWeight: '300',
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: 'center',
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
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '400',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LoadingScreen;
