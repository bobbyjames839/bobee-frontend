import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from '~/constants/Colors'
import TermsModal from './TermsModal'
import PrivacyModal from './PrivacyModal'
const MIN_PASSWORD_LENGTH = 8

interface SignUpStep4PasswordProps {
  name: string
  email: string
  gender: string
  password: string
  onPasswordChange: (password: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (confirmPassword: string) => void
  accepted: boolean
  onAcceptedChange: (accepted: boolean) => void
  onNext: () => void
  onBack: () => void
}

export default function SignUpStep4Password({ 
  name, 
  email, 
  gender, 
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  accepted,
  onAcceptedChange,
  onNext,
  onBack 
}: SignUpStep4PasswordProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // Disable button until fields are valid, terms accepted
  const isDisabled = useMemo(() => {
    const hasBasics = !!password && !!confirmPassword
    const strongEnough = password.length >= MIN_PASSWORD_LENGTH
    const matches = password === confirmPassword
    return !hasBasics || !strongEnough || !matches || !accepted
  }, [password, confirmPassword, accepted])

  const handleContinue = () => {
    // Validate before continuing
    if (!password) return
    if (password.length < MIN_PASSWORD_LENGTH) return
    if (password !== confirmPassword) return
    if (!accepted) return
    
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
          if (key === 'confirmPassword' && !isDisabled) {
            handleContinue()
          }
        }}
      />
    </BlurView>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>4 of 5</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create a password</Text>
        <Text style={styles.subtitle}>Keep your account secure</Text>

        {renderBlurInput('password', 'Password', password, onPasswordChange, true)}

        {focusedField === 'password' && (
          <Text style={styles.passwordRequirement}>Minimum {MIN_PASSWORD_LENGTH} characters</Text>
        )}

        {renderBlurInput('confirmPassword', 'Confirm Password', confirmPassword, onConfirmPasswordChange, true)}

        {/* Terms acceptance row with inline links that open in-page docs */}
        <View style={styles.termsRow}>
          <TouchableOpacity
            onPress={() => onAcceptedChange(!accepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            activeOpacity={0.8}
            style={[styles.checkbox, accepted && styles.checkboxChecked]}
          >
            {accepted ? <Text style={styles.checkboxTick}>✓</Text> : null}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.link} onPress={() => setShowTerms(true)}>
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text style={styles.link} onPress={() => setShowPrivacy(true)}>
              Privacy Statement
            </Text>
            .
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.lightest,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.blue,
    fontFamily: 'SpaceMono',
  },
  stepIndicator: {
    fontSize: 14,
    color: colors.dark,
    fontFamily: 'SpaceMono',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'SpaceMono',
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
    backgroundColor: 'white',
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.blue,
  },
  checkboxTick: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -1,
  },
  termsText: {
    flexShrink: 1,
    fontSize: 13,
    color: colors.darkest,
    fontFamily: 'SpaceMono',
  },
  link: {
    color: colors.blue,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: colors.blue,
    height: 60,
    borderRadius: 16,
    marginTop: 12,
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
})