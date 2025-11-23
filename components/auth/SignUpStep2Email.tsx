import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from '~/constants/Colors'
import Constants from 'expo-constants'
import SpinningLoader from '../other/SpinningLoader'
import * as Haptics from 'expo-haptics';

const API_URL = Constants.expoConfig?.extra?.backendUrl as string

interface SignUpStep2EmailProps {
  email: string
  onEmailChange: (email: string) => void
  onNext: () => void
  onBack: () => void
  onError: (message: string) => void
}

export default function SignUpStep2Email({
  email,
  onEmailChange,
  onNext,
  onBack,
  onError,
}: SignUpStep2EmailProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const isValidEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(val.trim())
  }

  const checkEmailExists = async (val: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: val.trim() }),
      })

      if (!response.ok) {
        console.error('Error response from server:', response.status)
        return false
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received')
        return false
      }

      const data = await response.json()
      return data.exists || false
    } catch (error) {
      console.error('Error checking email:', error)
      return false
    }
  }

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!email.trim()) {
      onError('Please enter your email address')
      return
    }
    if (!isValidEmail(email)) {
      onError('Please enter a valid email address')
      return
    }

    setIsChecking(true)
    const emailExists = await checkEmailExists(email)
    setIsChecking(false)

    if (emailExists) {
      onError('This email is already registered.')
      return
    }

    onNext()
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Text style={styles.title}>What's your email?</Text>
        <Text style={styles.subtitle}>We'll use this to keep your account secure</Text>

        {/* Input wrapper: TextInput sits underneath; overlay BlurView + loader goes on top */}
        <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
          <TextInput
            placeholder="your@email.com"
            placeholderTextColor="rgb(100, 100, 100)"
            style={styles.input}
            value={email}
            onChangeText={onEmailChange}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCorrect={false}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            editable={!isChecking}
          />

          {/* This BlurView sits ABOVE the input and blurs it; spinner is centered */}
          {isChecking && (
            <BlurView tint="light" intensity={80} style={styles.inputOverlay} pointerEvents="auto">
              <SpinningLoader size={28} thickness={3} color={colors.blue} />
            </BlurView>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const RADIUS = 16

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.lightest,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'SpaceMonoSemibold',
    color: colors.darkest,
  },
  subtitle: {
    fontSize: 16,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'SpaceMono',
  },

  // Wrapper defines the visible input chrome, and clips the overlay
  inputWrapper: {
    position: 'relative',
    marginBottom: 32,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.light,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  inputWrapperFocused: {
    borderColor: colors.blue,
  },

  input: {
    padding: 20,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    color: colors.darkest,
  },

  // Absolute overlay that blurs what’s underneath (the input) and shows the loader
  inputOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS, // matches wrapper to keep rounded corners on the blur
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
})
