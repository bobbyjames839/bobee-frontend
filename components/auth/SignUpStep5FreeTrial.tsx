import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native'
import { colors } from '~/constants/Colors'
import SpinningLoader from '~/components/other/SpinningLoader'
import ErrorBanner from '~/components/banners/ErrorBanner'
import { 
  Sparkles,
  LineChart,
  CheckCircle2,
  Brain,
  Mic
} from 'lucide-react-native'
import TermsModal from './TermsModal'
import PrivacyModal from './PrivacyModal'
import Purchases, { PurchasesPackage } from 'react-native-purchases'
import { X } from 'lucide-react-native'
import { navigate } from 'expo-router/build/global-state/routing'
import * as Haptics from 'expo-haptics';


interface SignUpStep5FreeTrialProps {
  onStartTrial: () => Promise<void>
  onBack: () => void
}

export default function SignUpStep5FreeTrial({ onStartTrial }: SignUpStep5FreeTrialProps) {
  const { width: screenWidth } = useWindowDimensions()
  const bannerHeight = 250

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings()
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          const monthly =
            offerings.current.availablePackages.find(p => p.identifier === '$rc_monthly' || p.packageType === 'MONTHLY')
            || offerings.current.availablePackages[0]
          setSelectedPackage(monthly)
        }
      } catch (e) { console.error('Error fetching offerings:', e) }
    }
    fetchOfferings()
  }, [])

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setError('')
    setLoading(true)
    try {
      if (!selectedPackage) throw new Error('No subscription package available')
      const res = await Purchases.purchasePackage(selectedPackage)
      if (Object.keys(res.customerInfo.entitlements.active).length === 0) {
        throw new Error('Subscription purchase was not activated')
      }
      await onStartTrial()
    } catch (err: any) {
      const txt = String(err?.message || '')
      let msg = 'An unexpected error occurred.'
      if (err?.userCancelled) msg = 'Purchase was cancelled.'
      else if (txt.includes('email-already-in-use')) msg = 'That email is already in use.'
      else if (txt.includes('invalid-email')) msg = 'Invalid email address.'
      else if (txt.includes('weak-password')) msg = 'Password is too weak.'
      else if (txt.toLowerCase().includes('subscription')) msg = 'Failed to complete subscription. Please try again.'
      setError(msg)
    } finally { setLoading(false) }
  }

const features = [
  { text: 'Instant AI-powered journal insights', icon: Sparkles },
  { text: 'Track progress over time', icon: LineChart },
  { text: 'Complete daily goals', icon: CheckCircle2 },
  { text: 'Understand yourself better', icon: Brain },
  { text: 'Hands-free voice journaling', icon: Mic },
]


  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/images/sub.png')}
        style={[styles.topImage, { width: screenWidth, height: bannerHeight }]}
        resizeMode="cover"
      />

      <X size={28} color={colors.lightest} onPress={() => navigate('/')} style={styles.closeIcon} />

      <View style={{ height: bannerHeight }} />

      <ErrorBanner message={error} onHide={() => setError('')} />

      <View style={styles.content}>
        <Text style={styles.heading}>Premium journalling experience</Text>

        <View style={styles.list}>
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <View style={styles.row} key={i}>
                <Icon size={25} color={colors.lightest} />
                <Text style={styles.rowText}>{f.text}</Text>
              </View>
            )
          })}
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.afterTrial}>Try 7 days free, then $5.99/month</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleStart}
          disabled={loading || !selectedPackage}
          style={[styles.cta, (loading || !selectedPackage) && styles.ctaDisabled]}
        >
          {loading
            ? <SpinningLoader size={22} thickness={3} color={colors.blue} />
            : <Text style={styles.ctaText}>Start Free Trial</Text>}
        </TouchableOpacity>

        <View style={styles.linksRow}>
          <Text style={styles.termsText}>Cancel anytime · </Text>
          <TouchableOpacity onPress={() => setShowTerms(true)}>
            <Text style={[styles.termsText, styles.link]}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}> · </Text>
          <TouchableOpacity onPress={() => setShowPrivacy(true)}>
            <Text style={[styles.termsText, styles.link]}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08308c',
    position: 'relative',
  },
  topImage: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  heading: {
    fontFamily: 'SpaceMonoBold',
    lineHeight: 40,
    fontSize: 32,
    marginBottom: 6,
    marginTop: 0,
    color: colors.lightest,
  },
  list: { marginTop: 8, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 8 },
  rowText: { flex: 1, fontFamily: 'SpaceMono', fontSize: 16, color: colors.light },
  bottom: {
    backgroundColor: colors.lightest,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  closeIcon: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 2,
  },
  afterTrial: { textAlign: 'center', fontFamily: 'SpaceMono', fontSize: 14, marginBottom: 16, color: colors.blue },
  cta: { height: 56, borderRadius: 16, backgroundColor: colors.darkestblue, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.85 },
  ctaText: { fontFamily: 'SpaceMonoSemibold', fontSize: 16, color: colors.lightest },
  linksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  termsText: { textAlign: 'center', fontFamily: 'SpaceMono', fontSize: 12, color: colors.light },
  link: { textDecorationLine: 'underline', fontWeight: '600' },
})
