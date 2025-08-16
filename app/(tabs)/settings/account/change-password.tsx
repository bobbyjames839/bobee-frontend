import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Modal, Animated } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '~/constants/Colors';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import SuccessBanner from '../../../../components/banners/SuccessBanner';
import ErrorBanner from '../../../../components/banners/ErrorBanner';

function BackChevron() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8, marginLeft: -4 }}>
      <Ionicons name="chevron-back" size={24} color={colors.darkest} />
    </TouchableOpacity>
  );
}

export default function ChangePasswordScreen() {
  const auth = getAuth();
  const insets = useSafeAreaInsets();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<null | 'current' | 'new' | 'confirm'>(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const slideY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const visible = Boolean(successMsg || errorMsg);
    if (visible) {
      Animated.timing(slideY, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    } else {
      slideY.setValue(-60);
    }
  }, [successMsg, errorMsg]);

  const getFriendlyError = (code: string) => {
    switch (code) {
      case 'auth/wrong-password':
        return 'The current password you entered is incorrect.';
      case 'auth/weak-password':
        return 'Your new password is too weak. Please choose a stronger one.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/requires-recent-login':
        return 'Please log out and log back in before changing your password.';
      default:
        return 'Something went wrong while changing your password.';
    }
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
  };
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
  };
  const hideBanners = () => {
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleChange = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) return showError('Please fill all fields.');
    if (newPwd.length < 8) return showError('New password must be at least 8 characters.');
    if (newPwd !== confirmPwd) return showError('New passwords do not match.');

    setLoading(true);
    try {
      const user = auth.currentUser!;
      const cred = EmailAuthProvider.credential(user.email!, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);

      showSuccess('Your password has been changed.');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setFocused(null);
    } catch (err: any) {
      const friendlyMsg = getFriendlyError(err?.code || '');
      showError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    currentPwd.length > 0 &&
    newPwd.length >= 8 &&
    confirmPwd.length > 0 &&
    newPwd === confirmPwd;

  const inputStyle = (key: 'current' | 'new' | 'confirm') => [
    styles.input,
    focused === key && styles.inputFocused,
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Change Password',
          headerLeft: () => <BackChevron />,
        }}
      />

      {/* Banner modal above header */}
      <Modal visible={Boolean(successMsg || errorMsg)} transparent animationType="fade" onRequestClose={hideBanners}>
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Animated.View style={[styles.bannerContainer, { paddingTop: insets.top + 8, transform: [{ translateY: slideY }] }]}>
            {successMsg ? <SuccessBanner message={successMsg} onHide={hideBanners} /> : null}
            {errorMsg ? <ErrorBanner message={errorMsg} onHide={hideBanners} /> : null}
          </Animated.View>
        </View>
      </Modal>

      <View style={styles.container}>
        <TextInput
          style={inputStyle('current')}
          placeholder="Current password"
          placeholderTextColor="rgb(100, 100, 100)"
          secureTextEntry
          value={currentPwd}
          onChangeText={setCurrentPwd}
          onFocus={() => setFocused('current')}
          onBlur={() => setFocused(null)}
        />

        <TextInput
          style={inputStyle('new')}
          placeholder="New password"
          placeholderTextColor="rgb(100, 100, 100)"
          secureTextEntry
          value={newPwd}
          onChangeText={setNewPwd}
          onFocus={() => setFocused('new')}
          onBlur={() => setFocused(null)}
        />

        <TextInput
          style={inputStyle('confirm')}
          placeholder="Confirm new password"
          placeholderTextColor="rgb(100, 100, 100)"
          secureTextEntry
          value={confirmPwd}
          onChangeText={setConfirmPwd}
          onFocus={() => setFocused('confirm')}
          onBlur={() => setFocused(null)}
        />

        <TouchableOpacity
          style={[styles.button, (loading || !canSubmit) && styles.buttonDisabled]}
          onPress={handleChange}
          disabled={loading || !canSubmit}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save New Password</Text>}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  bannerContainer: {
    paddingHorizontal: 12,
  },
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lighter,
    backgroundColor: 'white',
    borderRadius: 8,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  inputFocused: {
    borderColor: colors.blue,
    shadowColor: colors.blue,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    backgroundColor: colors.blue,
    padding: 16,
    borderRadius: 8,
    marginTop: 18,
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
