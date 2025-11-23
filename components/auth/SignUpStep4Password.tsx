import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from '~/constants/Colors'
import * as Haptics from 'expo-haptics';


interface SignUpStep4PasswordProps {
  password: string
  onPasswordChange: (password: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (confirmPassword: string) => void
  onNext: () => void
  onError: (message: string) => void
}

export default function SignUpStep4Password({ 
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onNext,
  onError
}: SignUpStep4PasswordProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleContinue = () => {
    // Validate before continuing
    if (!password) {
      onError('Please enter a password')
      return
    }
    if (password.length < 8) {
      onError(`Password must be at least 8 characters`)
      return
    }
    if (!confirmPassword) {
      onError('Please confirm your password')
      return
    }
    if (password !== confirmPassword) {
      onError('Passwords do not match')
      return
    }
    
    onNext()
  }

  const renderBlurInput = (
    key: string,
    placeholder: string,
    value: string,
    onChange: (t: string) => void,
    secure = false,
  ) => (
    <BlurView key={key} tint='light' intensity={50} style={[styles.blurInput, focusedField === key && styles.blurInputFocused]}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor='rgb(100, 100, 100)'
        secureTextEntry={secure}
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField(null)}
        autoCapitalize="none"
        textContentType={key === 'password' || key === 'confirmPassword' ? 'newPassword' : 'none'}
        autoCorrect={false}
        returnKeyType={key === 'confirmPassword' ? 'done' : 'next'}
        onSubmitEditing={() => {
          if (key === 'confirmPassword') {
            handleContinue()
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }
        }}
      />
    </BlurView>
  )

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Text style={styles.title}>Create a password</Text>
        <Text style={styles.subtitle}>Keep your account secure (Minimum 8 characters)</Text>

        {renderBlurInput('password', 'Password', password, onPasswordChange, true)}

        {renderBlurInput('confirmPassword', 'Confirm Password', confirmPassword, onConfirmPasswordChange, true)}

      </KeyboardAvoidingView>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.lightest,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
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
    marginBottom: 32,
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
    padding: 20,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  }
})