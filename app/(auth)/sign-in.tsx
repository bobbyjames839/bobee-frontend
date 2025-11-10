import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Keyboard, Animated } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { BlurView } from 'expo-blur';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '~/utils/firebase';
import { useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';
import ErrorBanner from '~/components/banners/ErrorBanner';
import SuccessBanner from '~/components/banners/SuccessBanner';
import ResetPassword from '~/components/reset/ResetPassword';
import SubscriptionPaywall from '~/components/auth/SubscriptionPaywall';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check if user just signed out
    const checkSignOut = async () => {
      try {
        const shouldShow = await AsyncStorage.getItem('showSignOutMessage');
        if (shouldShow === '1') {
          setSuccessMessage('Successfully signed out');
          await AsyncStorage.removeItem('showSignOutMessage');
        }
      } catch (error) {
        console.error('Error checking sign out message:', error);
      }
    };

    checkSignOut();
  }, []);

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
      // Sign in to Firebase
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      
      // Log in to RevenueCat with the user's ID
      await Purchases.logIn(userCredential.user.uid);
      
      // Check subscription status
      const customerInfo = await Purchases.getCustomerInfo();
      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;
      
      if (!hasActiveSubscription) {
        // Show paywall if no active subscription
        setLoading(false);
        setShowPaywall(true);
        return;
      }
      
      // User has active subscription, proceed to app
      await AsyncStorage.setItem('showWelcomeOnce', '1');
      
      // Fade out before navigation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/journal');
      });
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
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = async () => {
    setShowPaywall(false);
    await AsyncStorage.setItem('showWelcomeOnce', '1');
    
    // Fade out before navigation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/journal');
    });
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ErrorBanner message={error} onHide={() => setError('')} />
      {successMessage && (
        <SuccessBanner message={successMessage} onHide={() => setSuccessMessage('')} />
      )}

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

      <SubscriptionPaywall
        visible={showPaywall}
        onSuccess={handleSubscriptionSuccess}
        onClose={() => {
          setShowPaywall(false);
          // Sign out user if they close the paywall
          auth.signOut();
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.lightest,
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
    fontFamily: 'SpaceMonoSemibold',
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
