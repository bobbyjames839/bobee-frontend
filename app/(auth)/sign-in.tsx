import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Keyboard } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { BlurView } from 'expo-blur';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '~/utils/firebase';
import { useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';
import ErrorBanner from '~/components/banners/ErrorBanner';
import ResetPassword from '~/components/reset/ResetPassword';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDisabled = useMemo(() => {
    return loading || !email.trim() || !password;
  }, [loading, email, password]);

  const handleLogin = async () => {
    // clear any old errors
    setError('');

    // validate BEFORE loading
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      await AsyncStorage.setItem('showWelcomeOnce', '1');
      router.replace('/journal');
    } catch (err: any) {
      let message = 'An unexpected error occurred.';
      switch (err?.code) {
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'Email and password do not match our records.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Try again later.';
          break;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderBlurInput = (
    key: string,
    placeholder: string,
    value: string,
    onChange: (t: string) => void,
    secure = false
  ) => (
    <BlurView
      key={key}
      tint='light'
      intensity={50}
      style={[styles.blurInput, focusedField === key && styles.blurInputFocused]}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="rgb(100, 100, 100)"
        secureTextEntry={secure}
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField(null)}
        autoCapitalize="none"
        keyboardType={secure ? 'default' : 'email-address'}
        autoCorrect={false}
        textContentType={secure ? 'password' : 'emailAddress'}
        returnKeyType={secure ? 'done' : 'next'}
        onSubmitEditing={() => {
          if (!secure) {
          } else {
            if (!isDisabled) handleLogin();
          }
        }}
      />
    </BlurView>
  );

  return (
    <View style={styles.container}>
      <ErrorBanner message={error} onHide={() => setError('')} />

      <View style={styles.topRightCircle} />
      <View style={styles.topLeftCircle} />
      <View style={styles.bottomLeftCircle} />

      <View style={styles.content}>
        <Text style={styles.title}>Sign in</Text>

        {renderBlurInput('email', 'Email', email, setEmail)}
        {renderBlurInput('password', 'Password', password, setPassword, true)}

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {loading ? (
            <SpinningLoader size={20} thickness={3} color='white'/>
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/sign-up')} activeOpacity={0.8}>
          <Text style={styles.footerText}>Don't have an account?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setShowReset(true)} activeOpacity={0.8}>
        <Text style={styles.bottomText}>Forgot your password?</Text>
      </TouchableOpacity>

      <Modal visible={showReset} animationType="slide" transparent>
        <ResetPassword onClose={() => setShowReset(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    paddingBottom: 24,
    position: 'relative',
  },
  content: {
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 22,
    textAlign: 'center',
    fontFamily: 'SpaceMono',
  },
  blurInput: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.light,
  },
  blurInputFocused: {
    borderColor: colors.blue,
  },
  input: {
    backgroundColor: 'transparent',
    padding: 16,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  button: {
    backgroundColor: colors.blue,
    height: 60,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.darkest,
    fontFamily: 'SpaceMono',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.darkest,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  topRightCircle: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: colors.lightestblue,
    top: -160,
    right: -160,
  },
  topLeftCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.blue,
    top: -160,
    left: -60,
  },
  bottomLeftCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.lightestblue,
    bottom: -100,
    left: -100,
  },
});
