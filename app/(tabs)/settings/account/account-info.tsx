import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '~/constants/Colors';
import SuccessBanner from '../../../../components/banners/SuccessBanner';
import { getAuth, updateProfile, updateEmail as firebaseUpdateEmail } from 'firebase/auth';

function BackChevron() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
      <Ionicons name="chevron-back" size={24} color={colors.darkest} />
    </TouchableOpacity>
  );
}

export default function AccountInfoScreen() {
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [inputName, setInputName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setDisplayName(user.displayName || '');
      setInputName(user.displayName || '');
      setEmail(user.email || '');
      setInputEmail(user.email || '');
    }
    setIsEditingName(false);
    setIsEditingEmail(false);
    setLoading(false);
  }, []);

  const handleNamePress = async () => {
    if (!isEditingName) {
      setIsEditingName(true);
      return;
    }
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser!, { displayName: inputName.trim() });
      setDisplayName(inputName.trim());
      setSuccessMessage('Name updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setInputName(displayName);
    } finally {
      setSavingName(false);
      setIsEditingName(false);
    }
  };

  const handleEmailPress = async () => {
    if (!isEditingEmail) {
      setIsEditingEmail(true);
      return;
    }
    setSavingEmail(true);
    try {
      await firebaseUpdateEmail(auth.currentUser!, inputEmail.trim());
      setEmail(inputEmail.trim());
      setSuccessMessage('Email updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setInputEmail(email);
    } finally {
      setSavingEmail(false);
      setIsEditingEmail(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <SuccessBanner message={successMessage} onHide={() => setSuccessMessage('')} />
      <Stack.Screen
        options={{
          title: 'Account Information',
          headerLeft: () => <BackChevron />,
        }}
      />
      <View style={styles.container}>
        {/* Name Section */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[styles.input, !isEditingName && styles.inputDisabled]}
          value={inputName}
          editable={isEditingName}
          onChangeText={setInputName}
        />
        <TouchableOpacity
          style={[
            styles.button,
            (savingName || (!isEditingName && !inputName.trim())) && styles.buttonDisabled,
          ]}
          onPress={handleNamePress}
          disabled={savingName}
        >
          <Text style={styles.buttonText}>
            {savingName ? 'Saving...' : isEditingName ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>

        {/* Email Section */}
        <Text style={[styles.label, { marginTop: 24 }]}>Email</Text>
        <TextInput
          style={[styles.input, !isEditingEmail && styles.inputDisabled]}
          value={inputEmail}
          editable={isEditingEmail}
          onChangeText={setInputEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[
            styles.button,
            (savingEmail || (!isEditingEmail && !inputEmail.trim())) && styles.buttonDisabled,
          ]}
          onPress={handleEmailPress}
          disabled={savingEmail}
        >
          <Text style={styles.buttonText}>
            {savingEmail ? 'Saving...' : isEditingEmail ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.lightest,
  },
  backButton: {
    paddingHorizontal: 8,
    marginLeft: -4,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.lightest,
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'SpaceMono',
  },
  inputDisabled: {
    backgroundColor: '#f2f2f2',
    color: colors.darkest,
  },
  button: {
    marginTop: 12,
    backgroundColor: colors.blue,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: 'white',
  },
});
