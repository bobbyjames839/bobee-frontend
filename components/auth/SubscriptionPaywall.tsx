import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { colors } from '~/constants/Colors'
import SpinningLoader from '~/components/other/SpinningLoader'
import ErrorBanner from '~/components/banners/ErrorBanner'
import { CheckCircle } from 'phosphor-react-native'
import Purchases, { PurchasesPackage } from 'react-native-purchases'

interface SubscriptionPaywallProps {
  visible: boolean
  onSuccess: () => void
  onClose: () => void
}

export default function SubscriptionPaywall({ visible, onSuccess, onClose }: SubscriptionPaywallProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null)
  const [priceString, setPriceString] = useState('$9.99/month')

  useEffect(() => {
    if (visible) {
      fetchOfferings()
    }
  }, [visible])

  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings()
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        const monthlyPackage = offerings.current.availablePackages.find(
          pkg => pkg.identifier === '$rc_monthly' || pkg.packageType === 'MONTHLY'
        ) || offerings.current.availablePackages[0]
        
        setSelectedPackage(monthlyPackage)
        setPriceString(monthlyPackage.product.priceString + '/month')
      }
    } catch (error) {
      console.error('Error fetching offerings:', error)
      setError('Failed to load subscription options')
    }
  }

  const handlePurchase = async () => {
    setError('')
    setLoading(true)
    
    try {
      if (!selectedPackage) {
        throw new Error('No subscription package available')
      }

      const purchaseResult = await Purchases.purchasePackage(selectedPackage)
      
      if (Object.keys(purchaseResult.customerInfo.entitlements.active).length === 0) {
        throw new Error('Subscription purchase was not activated')
      }

      // Success!
      onSuccess()
    } catch (err: any) {
      let message = 'An unexpected error occurred.'
      
      if (err.userCancelled) {
        message = 'Purchase was cancelled.'
      } else if (String(err?.message || '').includes('subscription')) {
        message = 'Failed to complete subscription. Please try again.'
      }
      
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'AI-Powered Insights from journal entries',
    'Track Progress with mood & habit analytics', 
    'AI Coach for guidance and reflection',
    'Detailed Analytics to understand patterns',
    'Unlimited Journaling with no daily limits'
  ]

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.root}>
        <ErrorBanner message={error} onHide={() => setError('')} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.heading}>Subscribe to continue</Text>
          <Text style={styles.subheading}>Get full access to all premium features</Text>

          <View style={styles.list}>
            {features.map((f, i) => (
              <View style={styles.row} key={i}>
                <CheckCircle size={28} color={colors.blue} weight="fill" />
                <Text style={styles.rowText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.afterTrial}>Try 7 days free, then {priceString}</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePurchase}
            disabled={loading || !selectedPackage}
            style={[styles.cta, (loading || !selectedPackage) && styles.ctaDisabled]}
          >
            {loading
              ? <SpinningLoader size={22} thickness={3} color={colors.blue} />
              : <Text style={styles.ctaText}>Start Free Trial</Text>}
          </TouchableOpacity>

          <Text style={styles.termsText}>Cancel anytime</Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: colors.dark,
    fontFamily: 'SpaceMono',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  heading: {
    fontFamily: 'SpaceMonoSemibold',
    lineHeight: 40,
    fontSize: 32,
    marginBottom: 8,
    color: colors.darkest,
  },
  subheading: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    marginBottom: 24,
    color: colors.dark,
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
  termsText: {
    textAlign: 'center',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: colors.darkestblue,
    marginTop: 8,
  },
})
