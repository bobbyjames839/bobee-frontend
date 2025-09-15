import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '~/utils/firebase'
import { router } from 'expo-router'
import { colors } from '~/constants/Colors'
import ErrorBanner from '~/components/banners/ErrorBanner'
import SpinningLoader from '~/components/other/SpinningLoader';
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = Constants.expoConfig?.extra?.backendUrl as string
const MIN_PASSWORD_LENGTH = 8

export default function SignUpScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // inline docs
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // Disable button until fields are valid, terms accepted, and not loading
  const isDisabled = useMemo(() => {
    const trimmedEmail = email.trim()
    const hasBasics = !!name.trim() && !!trimmedEmail && !!password && !!confirmPassword
    const strongEnough = password.length >= MIN_PASSWORD_LENGTH
    const matches = password === confirmPassword
    return loading || !hasBasics || !strongEnough || !matches || !accepted
  }, [name, email, password, confirmPassword, loading, accepted])

  const handleSignUp = async () => {
    setError('')

    // validate BEFORE loading
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) return setError('Please enter your name.')
    if (!trimmedEmail) return setError('Please enter your email address.')
    if (!password) return setError('Please enter your password.')
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`)
    }
    if (password !== confirmPassword) return setError('Passwords do not match.')
    if (!accepted) return setError('Please agree to the Terms & Conditions and Privacy Statement.')

    setLoading(true)
    Keyboard.dismiss()

    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: '' }))
        throw new Error(msg || `Signup failed (${res.status})`)
      }

      await signInWithEmailAndPassword(auth, trimmedEmail, password)
      await AsyncStorage.setItem('showWelcomeOnce', '1')
      // Removed automatic tutorial start to avoid immediate popup
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
        autoCapitalize={key === 'email' ? 'none' : 'words'}
        keyboardType={key === 'email' ? 'email-address' : 'default'}
        textContentType={
          key === 'email' ? 'emailAddress' : key === 'password' || key === 'confirmPassword' ? 'newPassword' : 'name'
        }
        autoCorrect={false}
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
      {renderBlurInput('email', 'Email', email, setEmail)}
      {renderBlurInput('password', 'Password', password, setPassword, true)}

      {focusedField === 'password' && (
        <Text style={styles.passwordRequirement}>Minimum {MIN_PASSWORD_LENGTH} characters</Text>
      )}

      {renderBlurInput('confirmPassword', 'Confirm Password', confirmPassword, setConfirmPassword, true)}

      {/* Terms acceptance row with inline links that open in-page docs */}
      <View style={styles.termsRow}>
        <TouchableOpacity
          onPress={() => setAccepted(a => !a)}
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
        onPress={handleSignUp}
        disabled={isDisabled}
        activeOpacity={0.85}
      >
  {loading ? <SpinningLoader size={20} thickness={3} color='white'/> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/sign-in')} activeOpacity={0.8}>
        <Text style={styles.footerText}>Already have an account? Sign in</Text>
      </TouchableOpacity>

      {/* TERMS MODAL */}
      <Modal visible={showTerms} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bobee Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)} activeOpacity={0.8}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.sectionTitle}>Last Updated:</Text>
              <Text style={styles.dateText}>10 August 2025</Text>

              <Text style={styles.modalText}>
                <Text style={styles.sectionTitle}>Overview</Text>{'\n'}
                These Terms & Conditions govern your access to and use of Bobee. By using the app, you agree to these terms. If you do not agree, do not use Bobee.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Who We Are</Text>{'\n'}
                Bobee is provided on an as-is, as-available basis by “Bobee” (unregistered). You can contact us at contact@bobee.co.uk for any questions about these terms.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Eligibility & Accounts</Text>{'\n'}
                You must be at least 13 years old to use Bobee. You are responsible for the security of your device and any credentials used to access the app, and for all activity that occurs under your account.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Acceptable Use</Text>{'\n'}
                You agree to use Bobee lawfully and responsibly. You will not misuse the service, attempt to reverse-engineer or interfere with the app, probe or breach security, or use Bobee to generate or share content that is unlawful, harmful, or infringing.
                {'\n\n'}
                <Text style={styles.sectionTitle}>AI Outputs & No Medical Advice</Text>{'\n'}
                Bobee provides AI-generated insights intended for reflection and general informational purposes only. Bobee does not provide medical, psychological, or legal advice and is not a substitute for professional care. Do not use the app for emergencies; call local emergency services if you need urgent help.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Content & Intellectual Property</Text>{'\n'}
                You retain all rights to your journal transcriptions and content. By using Bobee, you grant us a limited, revocable license to process your content solely to operate, maintain, and improve the service, including generating insights and improving model prompts. The app, branding, and underlying software are owned by us or our licensors and are protected by applicable laws.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Privacy</Text>{'\n'}
                Your use of Bobee is governed by our Privacy Statement. In short, we store transcriptions (not audio) and generate insights in real time and from stored data. Data is stored in Firebase with default encryption. We use OpenAI for AI processing and, to the best of our knowledge, OpenAI does not retain the content of our API calls. We do not sell your personal information. Please review the Privacy Statement for full details.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Fees & Changes to the Service</Text>{'\n'}
                Bobee may evolve over time. We may introduce new features, modify existing features, or offer optional paid functionality in the future. If pricing applies, we will present the details before you opt in.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Termination</Text>{'\n'}
                You may stop using Bobee at any time. We may suspend or terminate access if you breach these terms or use the service in a way that could harm us, other users, or third parties.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Disclaimers & Limitation of Liability</Text>{'\n'}
                Bobee is provided without warranties of any kind to the extent permitted by law. We do not warrant that the app will be uninterrupted or error-free, or that AI outputs will be accurate or suitable for your purposes. To the maximum extent permitted by law, we and our providers will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits or data, arising from your use of Bobee.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Governing Law</Text>{'\n'}
                These terms are governed by the laws of England and Wales, and the courts of England and Wales shall have exclusive jurisdiction, except where consumer protection laws in your country provide otherwise.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Changes to These Terms</Text>{'\n'}
                We may update these terms periodically to reflect changes in our service or legal requirements. We will post updates with the date of the latest revision. Your continued use of Bobee after changes take effect constitutes acceptance of the updated terms.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Contact</Text>{'\n'}
                For questions about these Terms & Conditions, please email contact@bobee.co.uk.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PRIVACY MODAL */}
      <Modal visible={showPrivacy} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Statement</Text>
              <TouchableOpacity onPress={() => setShowPrivacy(false)} activeOpacity={0.8}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.sectionTitle}>Last Updated:</Text>
              <Text style={styles.dateText}>10 August 2025</Text>

              <Text style={styles.modalText}>
                <Text style={styles.sectionTitle}>Overview</Text>{'\n'}
                At Bobee, your privacy is a priority. This statement explains the information we collect, how we use it, and the steps we take to protect it.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Information We Collect</Text>{'\n'}
                We store transcriptions of your spoken journal entries — audio recordings are not saved — along with AI-generated insights such as mood analysis, personality metrics, topic breakdowns, daily tips, and progress data like trends and streaks. We do not collect unrelated usage or background activity data.
                {'\n\n'}
                <Text style={styles.sectionTitle}>How We Use Your Information</Text>{'\n'}
                Your information is used to provide accurate and meaningful insights from your journals, help you track progress over time, and enhance the model prompts that power your personal AI chatbot. Aggregated and anonymized data may also be used to improve our AI systems.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Data Storage & Security</Text>{'\n'}
                All data is stored securely in Firebase and protected with its default encryption both in transit and at rest. Insights are generated in real time during journaling sessions and may also be drawn from your stored entries. API calls to OpenAI are used to process your transcriptions; to the best of our knowledge, OpenAI does not retain the content of these calls.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Third-Party Services</Text>{'\n'}
                We use Firebase for authentication and data storage, and OpenAI for AI processing. We do not sell your personal information, and any sharing is limited to anonymized data for the sole purpose of improving AI functionality.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Your Rights</Text>{'\n'}
                You can request a copy of your stored data at any time by contacting us at contact@bobee.co.uk. You may also delete your account and associated data. Data is retained until such a request or action is made.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Cookies & Tracking</Text>{'\n'}
                The Bobee mobile app does not use cookies or tracking technologies. Our website may use basic analytics tools for performance and security monitoring.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Policy Updates</Text>{'\n'}
                We may update this statement periodically to reflect changes in our practices. Any updates will be posted with the date of the latest revision.
                {'\n\n'}
                <Text style={styles.sectionTitle}>Contact Us</Text>{'\n'}
                For privacy-related questions or requests, please email us at contact@bobee.co.uk.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
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

  // Modal styles (matches your settings screen card aesthetic)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '85%',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    color: colors.darkest,
    marginRight: 'auto',
  },
  closeText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.blue,
    textDecorationLine: 'underline',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 35
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: colors.blue,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.dark,
    marginBottom: 12,
  },
  modalText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 24,
    color: colors.darkest,
  },
})
