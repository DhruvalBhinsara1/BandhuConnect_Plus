/**
 * Theme Demo Screen for BandhuConnect+
 * Showcases light/dark theme switching and design system components
 * Aligned with Front End Guidelines by Amogh
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useTheme,
  useThemeMode,
  getTextStyles,
  getLayoutStyles,
  SPACING,
} from '../theme';
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  OutlineButton,
  Input,
  EmailInput,
  PasswordInput,
  SearchInput,
  useToast,
} from '../components/ui';

const { width } = Dimensions.get('window');

export const ThemeDemoScreen = () => {
  const { theme, isLight, isDark, followSystemTheme, setFollowSystemTheme } = useTheme();
  const { themeMode, toggleTheme } = useThemeMode();
  const toast = useToast();
  
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const textStyles = getTextStyles(theme);
  const layoutStyles = getLayoutStyles(theme);

  // Enhanced header component
  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: theme.background.primary }]}>
      <StatusBar 
        barStyle={isLight ? 'dark-content' : 'light-content'}
        backgroundColor={theme.background.primary}
      />
      <View style={styles.headerContent}>
        <View style={styles.titleSection}>
          <Text style={[textStyles.h1, styles.mainTitle]}>
            Design System
          </Text>
          <Text style={[textStyles.bodySecondary, styles.subtitle]}>
            BandhuConnect+ Theme Components
          </Text>
        </View>
        
        <View style={styles.themeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.themeToggleButton,
              { 
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
              }
            ]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isLight ? 'moon' : 'sunny'}
              size={24}
              color={theme.text.inverse}
            />
          </TouchableOpacity>
          <Text style={[textStyles.caption, styles.themeLabel]}>
            {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );

  // Enhanced theme controls section
  const renderThemeControls = () => (
    <View style={[styles.section, styles.themeControlsSection]}>
      <Text style={[textStyles.h4, styles.sectionTitle]}>
        Theme Controls
      </Text>
      
      <View style={[styles.controlCard, { backgroundColor: theme.surface.primary }]}>
        <View style={styles.controlRow}>
          <View style={styles.controlInfo}>
            <Text style={[textStyles.body, styles.controlTitle]}>
              System Theme
            </Text>
            <Text style={[textStyles.caption, styles.controlDescription]}>
              Automatically match device settings
            </Text>
          </View>
          <Switch
            value={followSystemTheme}
            onValueChange={setFollowSystemTheme}
            trackColor={{
              false: theme.surface.disabled,
              true: theme.primary + '40',
            }}
            thumbColor={followSystemTheme ? theme.primary : theme.text.tertiary}
            ios_backgroundColor={theme.surface.disabled}
          />
        </View>
      </View>

      <View style={[styles.colorPalette, { backgroundColor: theme.surface.primary }]}>
        <Text style={[textStyles.h6, styles.paletteTitle]}>
          Color Palette
        </Text>
        <View style={styles.colorGrid}>
          {[
            { name: 'Primary', color: theme.primary },
            { name: 'Success', color: theme.success },
            { name: 'Warning', color: theme.warning },
            { name: 'Error', color: theme.error },
          ].map((item, index) => (
            <View key={index} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
              <Text style={[textStyles.caption, styles.colorName]}>
                {item.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // Enhanced typography section
  const renderTypography = () => (
    <View style={styles.section}>
      <Text style={[textStyles.h4, styles.sectionTitle]}>
        Typography Scale
      </Text>
      
      <View style={[styles.controlCard, { backgroundColor: theme.surface.primary }]}>
        <Text style={textStyles.h1}>Heading 1 - Main Title</Text>
        <Text style={textStyles.h2}>Heading 2 - Section Title</Text>
        <Text style={textStyles.h3}>Heading 3 - Subsection</Text>
        <Text style={textStyles.h4}>Heading 4 - Card Title</Text>
        <Text style={textStyles.h5}>Heading 5 - Small Header</Text>
        <Text style={textStyles.h6}>Heading 6 - Label</Text>
        <Text style={[textStyles.body, { marginTop: SPACING[3] }]}>
          Body text for regular content and descriptions. This demonstrates 
          the primary text style used throughout the application.
        </Text>
        <Text style={textStyles.bodySecondary}>
          Secondary body text for less important information.
        </Text>
        <Text style={textStyles.caption}>
          Caption text for metadata and small details.
        </Text>
        <Text style={textStyles.link}>
          Link text example for navigation elements.
        </Text>
      </View>
    </View>
  );

  // Enhanced buttons section
  const renderButtons = () => (
    <View style={styles.section}>
      <Text style={[textStyles.h4, styles.sectionTitle]}>
        Button Components
      </Text>
      
      <View style={[styles.controlCard, { backgroundColor: theme.surface.primary }]}>
        <Text style={[textStyles.h6, styles.paletteTitle]}>
          Button Variants
        </Text>
        
        <View style={{ gap: SPACING[3] }}>
          <PrimaryButton
            title="Primary Action"
            onPress={() => toast.showSuccess('Success', 'Primary button pressed')}
          />
          
          <SecondaryButton
            title="Secondary Action"
            onPress={() => toast.showInfo('Info', 'Secondary button pressed')}
          />
          
          <OutlineButton
            title="Outline Action"
            onPress={() => toast.showInfo('Info', 'Outline button pressed')}
          />
          
          <DangerButton
            title="Destructive Action"
            onPress={() => toast.showError('Warning', 'Danger button pressed')}
          />
        </View>

        <Text style={[textStyles.h6, styles.paletteTitle, { marginTop: SPACING[5] }]}>
          Button Sizes & Icons
        </Text>
        
        <View style={{ gap: SPACING[3] }}>
          <Button
            title="Small Button"
            size="sm"
            onPress={() => toast.showInfo('Info', 'Small button')}
          />
          
          <Button
            title="Medium Button"
            size="md"
            onPress={() => toast.showInfo('Info', 'Medium button')}
          />
          
          <Button
            title="Large Button"
            size="lg"
            onPress={() => toast.showInfo('Info', 'Large button')}
          />
          
          <Button
            title="With Icon"
            icon="download"
            onPress={() => toast.showSuccess('Success', 'Download started')}
          />
        </View>
      </View>
    </View>
  );

  // Enhanced inputs section
  const renderInputs = () => (
    <View style={styles.section}>
      <Text style={[textStyles.h4, styles.sectionTitle]}>
        Input Components
      </Text>
      
      <View style={[styles.controlCard, { backgroundColor: theme.surface.primary }]}>
        <View style={{ gap: SPACING[4] }}>
          <Input
            label="Standard Input"
            placeholder="Enter text here..."
            value={inputValue}
            onChangeText={setInputValue}
          />
          
          <EmailInput
            label="Email Input"
            placeholder="your.email@example.com"
            value={emailValue}
            onChangeText={setEmailValue}
          />
          
          <PasswordInput
            label="Password Input"
            placeholder="Enter secure password"
            value={passwordValue}
            onChangeText={setPasswordValue}
          />
          
          <SearchInput
            placeholder="Search components..."
            value={searchValue}
            onChangeText={setSearchValue}
          />
        </View>
      </View>
    </View>
  );

  // Surface showcase section
  const renderSurfaces = () => (
    <View style={styles.section}>
      <Text style={[textStyles.h4, styles.sectionTitle]}>
        Surface Variations
      </Text>
      
      <View style={[styles.controlCard, { backgroundColor: theme.surface.primary }]}>
        <Text style={[textStyles.h6, styles.paletteTitle]}>
          Primary Surface
        </Text>
        <Text style={textStyles.bodySecondary}>
          Main content background with primary surface styling.
        </Text>
      </View>

      <View style={[
        styles.controlCard,
        { 
          backgroundColor: theme.surface.secondary,
          borderWidth: 1,
          borderColor: theme.border.primary,
        }
      ]}>
        <Text style={[textStyles.h6, styles.paletteTitle]}>
          Secondary Surface
        </Text>
        <Text style={textStyles.bodySecondary}>
          Alternative surface for content differentiation.
        </Text>
      </View>

      <View style={[
        styles.controlCard,
        { 
          backgroundColor: theme.surface.elevated,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }
      ]}>
        <Text style={[textStyles.h6, styles.paletteTitle]}>
          Elevated Surface
        </Text>
        <Text style={textStyles.bodySecondary}>
          Raised surface with enhanced shadow for modals and cards.
        </Text>
      </View>
    </View>
  );

  const demoSections = [
    {
      title: 'Inputs',
      content: () => (
        <View style={styles.section}>
          <Text style={[textStyles.h6, { marginBottom: SPACING[3] }]}>
            Input Components
          </Text>
          
          <Input
            label="Basic Input"
            placeholder="Enter some text"
            value={inputValue}
            onChangeText={setInputValue}
            helperText="This is a helper text"
            style={{ marginBottom: SPACING[4] }}
          />
          
          <EmailInput
            label="Email Address"
            placeholder="your@email.com"
            value={emailValue}
            onChangeText={setEmailValue}
            required
            style={{ marginBottom: SPACING[4] }}
          />
          
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={passwordValue}
            onChangeText={setPasswordValue}
            helperText="Password must be at least 8 characters"
            style={{ marginBottom: SPACING[4] }}
          />
          
          <SearchInput
            placeholder="Search something..."
            value={searchValue}
            onChangeText={setSearchValue}
            style={{ marginBottom: SPACING[4] }}
          />
          
          <Input
            label="Error State"
            placeholder="This input has an error"
            error
            errorMessage="This field is required"
            style={{ marginBottom: SPACING[4] }}
          />
          
          <Input
            label="Disabled Input"
            placeholder="This input is disabled"
            disabled
            value="Disabled value"
          />
        </View>
      ),
    },
    {
      title: 'Surfaces & Cards',
      content: () => (
        <View style={styles.section}>
          <Text style={[textStyles.h6, { marginBottom: SPACING[3] }]}>
            Surface Examples
          </Text>
          
          <View style={[
            layoutStyles.card,
            { marginBottom: SPACING[3] }
          ]}>
            <Text style={textStyles.h6}>Card Title</Text>
            <Text style={textStyles.bodySecondary}>
              This is a card with the default elevation and styling.
            </Text>
          </View>
          
          <View style={[
            layoutStyles.surface,
            {
              padding: SPACING[4],
              borderRadius: 12,
              marginBottom: SPACING[3],
            }
          ]}>
            <Text style={textStyles.h6}>Surface Container</Text>
            <Text style={textStyles.bodySecondary}>
              This is a surface container with custom styling.
            </Text>
          </View>
          
          <View style={layoutStyles.separator} />
          
          <View style={[
            {
              backgroundColor: theme.background.secondary,
              padding: SPACING[4],
              borderRadius: 8,
            }
          ]}>
            <Text style={textStyles.body}>Secondary Background</Text>
            <Text style={textStyles.caption}>
              This container uses the secondary background color.
            </Text>
          </View>
        </View>
      ),
    },
  ];

  return (
    <SafeAreaView style={[layoutStyles.container, { flex: 1 }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING[4] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={textStyles.h2}>Theme System Demo</Text>
          <Text style={textStyles.bodySecondary}>
            Explore BandhuConnect+'s design system with light and dark theme support.
            The light theme is the default.
          </Text>
        </View>

        {demoSections.map((section, index) => (
          <View key={index} style={styles.demoSection}>
            <Text style={[textStyles.h4, { marginBottom: SPACING[4] }]}>
              {section.title}
            </Text>
            {section.content()}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  // Header styles
  headerContainer: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  titleSection: {
    flex: 1,
  },
  mainTitle: {
    fontWeight: '700' as const,
    marginBottom: SPACING[1],
  },
  subtitle: {
    opacity: 0.7,
  },
  themeToggleContainer: {
    alignItems: 'center' as const,
    gap: SPACING[2],
  },
  themeToggleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  themeLabel: {
    fontWeight: '600' as const,
  },
  
  // Section styles
  section: {
    marginBottom: SPACING[6],
  },
  sectionTitle: {
    fontWeight: '600' as const,
    marginBottom: SPACING[4],
  },
  themeControlsSection: {
    // Specific styles for theme controls
  },
  
  // Control styles
  controlCard: {
    padding: SPACING[4],
    borderRadius: 12,
    marginBottom: SPACING[4],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  controlRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  controlInfo: {
    flex: 1,
    marginRight: SPACING[3],
  },
  controlTitle: {
    fontWeight: '600' as const,
    marginBottom: SPACING[1],
  },
  controlDescription: {
    opacity: 0.7,
  },
  
  // Color palette styles
  colorPalette: {
    padding: SPACING[4],
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paletteTitle: {
    fontWeight: '600' as const,
    marginBottom: SPACING[3],
  },
  colorGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: SPACING[3],
  },
  colorItem: {
    alignItems: 'center' as const,
    width: (width - SPACING[8] - SPACING[4]) / 4 - SPACING[3],
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: SPACING[2],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorName: {
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  
  // Legacy styles
  header: {
    marginBottom: SPACING[6],
  },
  demoSection: {
    marginBottom: SPACING[6],
  },
  themeControl: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: SPACING[3],
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  colorPreview: {
    marginTop: SPACING[4],
  },
  colorRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING[1],
  },
};
