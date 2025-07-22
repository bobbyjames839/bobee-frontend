// src/components/auth/SignUp.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { BlurView } from 'expo-blur'
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '~/utils/firebase'
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { router } from 'expo-router'
import { colors } from '~/constants/Colors'
import ErrorBanner from '~/components/banners/ErrorBanner'

const db = getFirestore()
const MIN_PASSWORD_LENGTH = 8

export default function SignUpScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    setError('')

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      const photoURL = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`
      await updateProfile(user, { displayName: name, photoURL })

      await setDoc(doc(db, 'users', user.uid, 'metrics', 'userInfo'), {
        name,
        email: user.email,
        subscribed: false,
        createdAt: serverTimestamp(),
      })
      const today = new Date().toISOString().split('T')[0]
      await setDoc(doc(db, 'users', user.uid, 'metrics', 'stats'), {
        voiceUsage: { date: today, totalSeconds: 0 },
        totalWords: 0,
        totalEntries: 0,
        currentStreak: 0,
      })

      router.replace('/journal')
    } catch (err: any) {
      let message = 'An unexpected error occurred.'
      switch (err.code) {
        case 'auth/invalid-email':
          message = 'Invalid email address.'
          break
        case 'auth/email-already-in-use':
          message = 'That email is already in use.'
          break
        case 'auth/weak-password':
          message = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
          break
        case 'auth/too-many-requests':
          message = 'Too many attempts. Try again later.'
          break
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const renderBlurInput = (
    key: string,
    placeholder: string,
    value: string,
    onChange: (t: string) => void,
    secure = false,
    extraProps = {}
  ) => (
    <BlurView
      key={key}
      intensity={50}
      style={[styles.blurInput, focusedField === key && styles.blurInputFocused]}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.light}
        secureTextEntry={secure}
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField(null)}
        {...extraProps}
      />
    </BlurView>
  )

  return (
    <View style={styles.container}>
      <ErrorBanner message={error} onHide={() => setError('')} />

      <View style={styles.topRightCircle} />
      <View style={styles.topLeftCircle} />
      <View style={styles.bottomLeftCircle} />

      <Text style={styles.title}>Create Account</Text>

      {renderBlurInput('name', 'Name', name, setName)}
      {renderBlurInput(
        'email',
        'Email',
        email,
        setEmail,
        false,
        { autoCapitalize: 'none', keyboardType: 'email-address' }
      )}
      {renderBlurInput('password', 'Password', password, setPassword, true)}
      {focusedField === 'password' && (
        <Text style={styles.passwordRequirement}>
          Minimum {MIN_PASSWORD_LENGTH} characters
        </Text>
      )}
      {renderBlurInput('confirmPassword', 'Confirm Password', confirmPassword, setConfirmPassword, true)}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/sign-in')}>
        <Text style={styles.footerText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'white',
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
  passwordRequirement: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    fontSize: 12,
    color: '#666',
    fontFamily: 'SpaceMono',
  },
  button: {
    backgroundColor: '#4f50e3',
    height: 60,
    borderRadius: 16,
    marginTop: 12,
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
})
