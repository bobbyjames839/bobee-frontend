import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, Animated } from 'react-native';
import { router, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '~/constants/Colors';
import SuccessBanner from '../../../../components/banners/SuccessBanner';
import { getAuth, updateProfile, updateEmail as firebaseUpdateEmail } from 'firebase/auth';
import Header from '~/components/Header';

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
  const insets = useSafeAreaInsets();

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

  // animation for the modal banner
  const slideY = useRef(new Animated.Value(-60)).current;
  useEffect(() => {
    if (successMessage) {
      // slide in
      Animated.timing(slideY, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    } else {
      // reset for next time
      slideY.setValue(-60);
    }
  }, [successMessage]);

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
    <>
    <Header
        title='Change Email'
        leftIcon="chevron-back"
        onLeftPress={() => (router.back())}/>
    <View style={styles.wrapper}>
      {/* Banner as a modal overlay above everything (incl. header) */}
      <Modal
        visible={Boolean(successMessage)}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessMessage('')}
      >
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.bannerContainer,
              { paddingTop: insets.top + 8, transform: [{ translateY: slideY }] },
            ]}
          >
            <SuccessBanner message={successMessage} onHide={() => setSuccessMessage('')} />
          </Animated.View>
        </View>
      </Modal>

      <Stack.Screen
        options={{
          title: 'Account Information',
          headerLeft: () => <BackChevron />,
        }}
      />

      <View style={styles.container}>
        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[
            styles.input,
            isEditingName ? styles.inputEditing : styles.inputDisabled,
          ]}
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

        {/* Email */}
        <Text style={[styles.label, { marginTop: 24 }]}>Email</Text>
        <TextInput
          style={[
            styles.input,
            isEditingEmail ? styles.inputEditing : styles.inputDisabled,
          ]}
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
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.lightest,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  bannerContainer: {
    paddingHorizontal: 12,
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
    borderColor: colors.lighter,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontFamily: 'SpaceMono',
  },
  inputDisabled: {
    color: colors.darkest,
    backgroundColor: 'white',
  },
  inputEditing: {
    borderColor: colors.blue,
    shadowColor: colors.blue,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
