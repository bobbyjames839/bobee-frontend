import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { BlurView } from 'expo-blur'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '~/utils/firebase'
import { router } from 'expo-router'
import { colors } from '~/constants/Colors'
import ErrorBanner from '~/components/banners/ErrorBanner'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = Constants.expoConfig?.extra?.backendUrl as string
const MIN_PASSWORD_LENGTH = 8

export default function SignUpScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


  // 1. Frontend: User fills name, email, password in UI.
  // 2. Frontend: Runs basic validation before sending to backend.
  // 3. Backend: Validates data and creates user with Firebase Admin.
  // 4. Backend: Sets displayName/photoURL and creates Firestore docs.
  // 5. Backend: Sends success response to frontend.
  // 6. Frontend: Logs user in locally and navigates to main screen.
  const handleSignUp = async () => {
    setError('')

    if (!name.trim()) return setError('Please enter your name.')
    if (!email.trim()) return setError('Please enter your email address.')
    if (!password) return setError('Please enter your password.')
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`)
    }
    if (password !== confirmPassword) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: '' }))
        throw new Error(msg || `Signup failed (${res.status})`)
      }

      await signInWithEmailAndPassword(auth, email.trim(), password)
      await AsyncStorage.setItem('showWelcomeOnce', '1');
      router.replace('/journal')
    } catch (err: any) {
      let message = 'An unexpected error occurred.'
      const txt = String(err?.message || '')
      if (txt.includes('email-already-in-use')) message = 'That email is already in use.'
      else if (txt.includes('invalid-email')) message = 'Invalid email address.'
      else if (txt.includes('weak-password')) message = `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const renderBlurInput = ( key: string, placeholder: string, value: string, onChange: (t: string) => void, secure = false, extraProps = {}) => (
    <BlurView key={key} intensity={50} style={[styles.blurInput, focusedField === key && styles.blurInputFocused]}>
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
      {renderBlurInput( 'email', 'Email', email, setEmail, false, { autoCapitalize: 'none', keyboardType: 'email-address' })}
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
