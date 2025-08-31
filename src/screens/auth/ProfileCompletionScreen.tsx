import React, { useState } from 'react';
import { View, Text, SafeAreaView, Alert, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import ControlledInput from '../../components/common/ControlledInput';
import Card from '../../components/common/Card';
import { Picker } from '@react-native-picker/picker';
import { VOLUNTEER_SKILLS } from '../../constants';

const ProfileCompletionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'volunteer' as 'volunteer' | 'pilgrim',
    skills: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (formData.role === 'volunteer' && formData.skills.length === 0) {
      Alert.alert('Error', 'Please select at least one skill');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        ...(formData.role === 'volunteer' && {
          skills: formData.skills,
          volunteer_status: 'available',
          is_active: true,
        }),
      };

      const result = await updateProfile(profileData);
      
      if (result.error) {
        Alert.alert('Error', result.error.message || 'Failed to complete profile');
      } else {
        Alert.alert('Success', 'Profile completed successfully!', [
          { text: 'OK', onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          }) }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Please provide the following information to complete your account setup.
            </Text>
          </View>

          <ControlledInput
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            leftIcon="person-outline"
          />

          <ControlledInput
            label="Phone Number"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                style={styles.picker}
              >
                <Picker.Item label="Volunteer" value="volunteer" />
                <Picker.Item label="Pilgrim" value="pilgrim" />
              </Picker>
            </View>
          </View>

          {formData.role === 'volunteer' && (
            <View style={styles.skillsContainer}>
              <Text style={styles.label}>Skills (Select at least one)</Text>
              <View style={styles.skillsGrid}>
                {VOLUNTEER_SKILLS.map((skill) => (
                  <Button
                    key={skill}
                    title={skill.charAt(0).toUpperCase() + skill.slice(1)}
                    onPress={() => toggleSkill(skill)}
                    variant={formData.skills.includes(skill) ? 'primary' : 'outline'}
                    style={styles.skillButton}
                  />
                ))}
              </View>
            </View>
          )}

          <Button
            title="Complete Profile"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillButton: {
    minWidth: 80,
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 16,
  },
});

export default ProfileCompletionScreen;
