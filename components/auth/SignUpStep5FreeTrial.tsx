import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { colors } from '~/constants/Colors'
import SpinningLoader from '~/components/other/SpinningLoader'
import ErrorBanner from '~/components/banners/ErrorBanner'
import { CheckCircle } from 'phosphor-react-native'
import TermsModal from './TermsModal'
import PrivacyModal from './PrivacyModal'
import Purchases, { PurchasesPackage } from 'react-native-purchases'

interface SignUpStep5FreeTrialProps {
  onStartTrial: () => Promise<void>
  onBack: () => void
}

export default function SignUpStep5FreeTrial({ onStartTrial, onBack }: SignUpStep5FreeTrialProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)
  const [priceString, setPriceString] = useState('$9.99/month')

  // Fetch RevenueCat offerings
  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings()
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          // Get the first package (or filter for monthly subscription)
          const monthlyPackage = offerings.current.availablePackages.find(
            pkg => pkg.identifier === '$rc_monthly' || pkg.packageType === 'MONTHLY'
          ) || offerings.current.availablePackages[0]
          
          setSelectedPackage(monthlyPackage)
          setPriceString(monthlyPackage.product.priceString + '/month')
        }
      } catch (error) {
        console.error('Error fetching offerings:', error)
      }
    }
    
    fetchOfferings()
  }, [])

  const handleStart = async () => {
    setError('')
    setLoading(true)
    try { 
      // First purchase the subscription
      if (!selectedPackage) {
        throw new Error('No subscription package available')
      }

      const purchaseResult = await Purchases.purchasePackage(selectedPackage)
      
      // Check if the purchase was successful
      if (Object.keys(purchaseResult.customerInfo.entitlements.active).length === 0) {
        throw new Error('Subscription purchase was not activated')
      }

      // Then create the account
      await onStartTrial() 
    }
    catch (err: any) {
      let message = 'An unexpected error occurred.'
      const txt = String(err?.message || '')
      
      // Handle RevenueCat specific errors
      if (err.userCancelled) {
        message = 'Purchase was cancelled.'
      } else if (txt.includes('email-already-in-use')) {
        message = 'That email is already in use.'
      } else if (txt.includes('invalid-email')) {
        message = 'Invalid email address.'
      } else if (txt.includes('weak-password')) {
        message = 'Password is too weak.'
      } else if (txt.includes('subscription')) {
        message = 'Failed to complete subscription. Please try again.'
      }
      
      setError(message)
    } finally { setLoading(false) }
  }

  const features = [
    'AI-Powered Insights from journal entries',
    'Track Progress with mood & habit analytics', 
    'AI Coach for guidance and reflection',
    'Detailed Analytics to understand patterns',
    'Unlimited Journaling with no daily limits'
  ]

  return (
    <View style={styles.root}>
      {/* light blue circle with image (behind content) */}
      <View style={styles.topRightCircle} pointerEvents="none">
        <Image
          // use a RELATIVE path; adjust to your project structure
          source={require('../../assets/images/walking.png')}
          style={styles.topRightImage}
          resizeMode="contain"
        />
      </View>

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>5 of 5</Text>
      </View>

      <ErrorBanner message={error} onHide={() => setError('')} />

      {/* Top content */}
      <View style={styles.content}>
        <Text style={styles.heading}>Unlock premium experience</Text>

        <View style={styles.list}>
          {features.map((f, i) => (
            <View style={styles.row} key={i}>
              <CheckCircle size={28} color={colors.blue} weight="fill" />
              <Text style={styles.rowText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom curved section (blue) */}
      <View style={styles.bottom}>
        <Text style={styles.afterTrial}>Try 7 days free, then {priceString}</Text>

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
    backgroundColor: colors.lightest,
  },

  // Header with back button
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 2,
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

  // light blue circle behind content
  topRightCircle: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.lightestblue,
    top: -120,
    right: -120,
    alignItems: 'center',
    justifyContent: 'center',
    // zIndex left at default (0)
  },
  topRightImage: {
    width: 170,
    height: 170,
    marginTop: 150,
    marginLeft: 30,
  },

  // Top section
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    zIndex: 1, // ensure above the circle on both iOS/Android
  },
  heading: {
    fontFamily: 'SpaceMonoSemibold',
    lineHeight: 40,
    fontSize: 32,
    marginBottom: 6,
    color: colors.darkest,
  },
  list: {
    marginTop: 8,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 8,
  },
  rowText: {
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: colors.darkest,
  },

  // Bottom curved panel
  bottom: {
    backgroundColor: colors.blue,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  afterTrial: {
    textAlign: 'center',
    fontFamily: 'SpaceMono',
    fontSize: 14,
    marginBottom: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  cta: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaDisabled: { opacity: 0.85 },
  ctaText: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 16,
    color: colors.darkest,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  termsText: {
    textAlign: 'center',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: colors.darkestblue,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
})
