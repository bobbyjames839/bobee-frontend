// screens/ResetPassword.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { sendPasswordResetEmail, ActionCodeSettings } from 'firebase/auth'
import { auth } from '~/utils/firebase'
import { useRouter } from 'expo-router'
import { colors } from '~/constants/Colors'
import ErrorBanner from '~/components/banners/ErrorBanner'
import SuccessBanner from '~/components/banners/SuccessBanner'

type Props = {
  onClose?: () => void
}

const actionCodeSettings: ActionCodeSettings = {
  url: 'https://bobee.app',
  handleCodeInApp: false,
}

export default function ResetPassword({ onClose }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleReset = async () => {
    setError('')
    setInfo('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings)
      // show banner and clear the input
      setInfo('A password reset link has been sent to your email.')
      setEmail('')
    } catch (err: any) {
      console.log('[Reset Error]', err)
      let message = 'An unexpected error occurred. Please try again.'

      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-email':
            message = 'Invalid email address.'
            break
          case 'auth/too-many-requests':
            message = 'Too many requests. Try again later.'
            break
          default:
            message = `Error: ${err.message || err.code}`
        }
      }

      setError(message)
    }
  }

  const close = () => {
    if (onClose) return onClose()
    router.replace('/main')
  }

  const renderBlurInput = (
    key: string,
    placeholder: string,
    value: string,
    onChange: (t: string) => void,
    secure = false
  ) => (
    <BlurView
      key={key}
      intensity={50}
      style={[styles.blurInput, focusedField === key && styles.blurInputFocused]}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#333"
        secureTextEntry={secure}
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField(null)}
        autoCapitalize="none"
        keyboardType={secure ? 'default' : 'email-address'}
      />
    </BlurView>
  )

  return (
    <View style={styles.container}>
      <ErrorBanner message={error} onHide={() => setError('')} />
      <SuccessBanner message={info} onHide={() => setInfo('')} />

      <TouchableOpacity style={styles.closeButton} onPress={close}>
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>

      <View style={styles.topRightCircle} />
      <View style={styles.topLeftCircle} />
      <View style={styles.bottomLeftCircle} />

      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        {renderBlurInput('email', 'Email', email, setEmail)}

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 32,
    color: colors.darkest,
    fontFamily: 'SpaceMono',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    marginBottom: 22,
    textAlign: 'center',
    fontFamily: 'SpaceMono',
  },
  blurInput: {
    width: '100%',
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
    backgroundColor: '#4f50e3',
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
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
