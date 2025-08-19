import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, useWindowDimensions } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';
import { colors } from '~/constants/Colors';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import SuccessBanner from '~/components/banners/SuccessBanner';
import ErrorBanner from '~/components/banners/ErrorBanner';
import { Smiley, Crown, CheckCircle } from 'phosphor-react-native';
import Header from '~/components/other/Header';
import SpinningLoader from '~/components/other/SpinningLoader';
import { router, useFocusEffect } from 'expo-router';

type PlanKey = 'free' | 'pro';

const plans: Record<PlanKey, { title: string; tagline: string; price: string; features: string[] }> = {
  free: {
    title: 'Free Tier',
    tagline: 'Get started with the basics',
    price: '$0',
    features: [
      '2 minutes of journalling / day',
      '5 conversations / day',
      'Basic journal insights',
      'Habit and mood tracking',
    ],
  },
  pro: {
    title: 'Pro Tier',
    tagline: 'Deep AI insights for regular journalers',
    price: '$9.99',
    features: [
      'Everything in free',
      '10 minutes of journalling / day',
      '50 conversations / day',
      'Advanced journal insights',
      'Topic and personality insights',
      'Personalised Bobee responses in conversations',
    ],
  },
};

const TAB_MARGIN = 8;
const tabWidth = (Dimensions.get('window').width - 32 - TAB_MARGIN) / 2;
const iconForPlan = (key: PlanKey) => (key === 'pro' ? Crown : Smiley);

function SubscriptionInner() {
  const { isSubscribed, cancelDate } = useContext(SubscriptionContext);
  const [selectedTab, setSelectedTab] = useState<PlanKey>('free');
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (isSubscribed !== null) {
      setSelectedTab(isSubscribed ? 'pro' : 'free');
    }
  }, [isSubscribed]);

  // reset confirmCancel when leaving/returning to screen
  useFocusEffect(
    React.useCallback(() => {
      setConfirmCancel(false);
    }, [])
  );

  const handleUpgrade = async () => {
    // If a cancellation is pending, do nothing
    if (cancelDate) return;

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');

      const idToken = await user.getIdToken(false);

      const resp = await fetch(`${API_BASE}/api/subscribe/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const {
        subscriptionId,
        clientSecret,
        customerId,
        ephemeralKeySecret,
        error,
      } = await resp.json();

      if (error || !clientSecret) throw new Error(error || 'Missing client secret');

      const { error: initErr } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Bobee',
        customerId,
        customerEphemeralKeySecret: ephemeralKeySecret,
        primaryButtonLabel: 'Start Pro – $9.99/mo',
      });
      if (initErr) throw new Error(initErr.message);

      setLoading(false);

      const { error: presentErr } = await presentPaymentSheet();
      if (presentErr) throw new Error(presentErr.message);

      await fetch(`${API_BASE}/api/subscribe/finalise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ subscriptionId }),
      });

      setSuccessMsg('Your payment was successful!');
      setErrorMsg('');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Something went wrong');
      setSuccessMsg('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // If a cancellation is already pending, do nothing
    if (cancelDate) return;

    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }

    setCancelLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');

      const idToken = await user.getIdToken(false);

      const resp = await fetch(`${API_BASE}/api/subscribe/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to cancel');

      setSuccessMsg(
        data?.cancel_at_period_end
          ? 'Subscription will cancel at the period end.'
          : 'Subscription cancelled.'
      );
      setErrorMsg('');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Something went wrong');
      setSuccessMsg('');
    } finally {
      setCancelLoading(false);
      setConfirmCancel(false);
    }
  };

  const isLoadingInitial = isSubscribed === null;
  const userPlan: PlanKey = isSubscribed ? 'pro' : 'free';
  const planDetails = plans[selectedTab];
  const isCurrentPlan = selectedTab === userPlan;
  const DetailIcon = iconForPlan(selectedTab);

  const cancellationPending = Boolean(cancelDate);
  const disableAction =
    loading ||
    cancelLoading ||
    cancellationPending ||
    (!cancellationPending && !cancelLoading && !loading && isCurrentPlan && selectedTab !== 'free');

  if (isLoadingInitial) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  // Compute button label based on state
  const getButtonLabel = () => {
    if (cancellationPending) {
      return selectedTab === 'free' ? 'Pending cancellation' : 'Current plan';
    }
    if (isSubscribed) {
      if (selectedTab === 'pro') return 'Your current plan';
      // selectedTab === 'free'
      return confirmCancel ? 'Confirm cancel' : 'Return to free version';
    }
    // not subscribed
    return selectedTab === 'pro' ? 'Upgrade to Pro' : 'Your current plan';
  };

  // Decide which action to run when pressed
  const onPrimaryPress = () => {
    if (disableAction) return;
    if (cancellationPending) return;
    if (isSubscribed && selectedTab === 'free') return handleCancel();
    if (!isSubscribed && selectedTab === 'pro') return handleUpgrade();
    // otherwise no-op
  };

  return (
    <>
      <Header title="Subscription" leftIcon="chevron-back" onLeftPress={() => router.back()} />
      <SuccessBanner message={successMsg} onHide={() => setSuccessMsg('')} />
      <ErrorBanner message={errorMsg} onHide={() => setErrorMsg('')} />

      <View style={styles.container}>
        {/* current plan box */}
        <View style={styles.currentPlanBox}>
          <Text style={styles.labelText}>
            {cancellationPending ? 'Current plan (pending):' : 'Current plan:'}
          </Text>
          <Text style={styles.planText}>{plans[userPlan].title}</Text>
        </View>

        {/* details */}
        <View style={styles.planDetailBox}>
          <View style={styles.decorCircle}>
            <DetailIcon size={50} color={colors.blue} weight="fill" />
          </View>
          <Text style={styles.planTitle}>{planDetails.title}</Text>
          <Text style={styles.planTagline}>{planDetails.tagline}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.planPrice}>{planDetails.price}</Text>
            <Text style={styles.planUnit}> USD / month</Text>
          </View>

          <View style={styles.featuresList}>
            {planDetails.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <CheckCircle size={20} color={colors.blue} weight="fill" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* upgrade / cancel button */}
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              // grey out if current plan OR cancellation pending
              ((isCurrentPlan && !(!isSubscribed && selectedTab === 'pro')) || cancellationPending) &&
                styles.currentButton,
              // keep red style only when actively offering cancel (no pending, free tab, subscribed)
              isSubscribed && !cancellationPending && selectedTab === 'free' && styles.cancelButton,
            ]}
            onPress={onPrimaryPress}
            disabled={disableAction}
          >
            {loading || cancelLoading ? (
              <SpinningLoader size={20} thickness={3} color="white" />
            ) : (
              <Text
                style={[
                  styles.upgradeButtonText,
                  ((isCurrentPlan && selectedTab !== 'free') || cancellationPending) &&
                    styles.currentButtonText,
                ]}
              >
                {getButtonLabel()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* tabs */}
        <View style={styles.tabContainer}>
          {(['free', 'pro'] as PlanKey[]).map((key) => {
            const active = selectedTab === key;
            const TabIcon = iconForPlan(key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tabBox, { width: tabWidth }, active && styles.activeTabBox]}
                onPress={() => setSelectedTab(key)}
              >
                <TabIcon
                  size={28}
                  color={active ? '#fff' : colors.darkest}
                  weight={active ? 'fill' : 'regular'}
                  style={{ marginBottom: 6 }}
                />
                <Text style={[styles.tabText, active && styles.activeTabText]}>
                  {plans[key].title.split(' ')[0]}
                </Text>
                {key === 'pro' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Best value</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

export default function Subscription() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY!}>
      <SubscriptionInner />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPlanBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
    marginBottom: 12,
    elevation: 1,
  },
  labelText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
  },
  planText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkest,
  },
  planDetailBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lighter,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    top: -180,
    right: -180,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(173, 216, 230, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    marginTop: 10,
    fontFamily: 'SpaceMono',
    fontSize: 22,
    fontWeight: '600',
    color: colors.darkest,
    marginBottom: 4,
  },
  planTagline: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: colors.darkest,
    borderBottomColor: colors.lighter,
    borderBottomWidth: 1,
    paddingBottom: 20,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomColor: colors.lighter,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  planPrice: {
    fontFamily: 'SpaceMono',
    fontSize: 40,
    fontWeight: '600',
    color: colors.blue,
  },
  planUnit: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.dark,
    marginLeft: 6,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
    marginLeft: 8,
  },
  upgradeButton: {
    position: 'absolute',
    width: '100%',
    bottom: 25,
    alignSelf: 'center',
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  currentButton: {
    backgroundColor: '#ddd',
  },
  currentButtonText: {
    color: '#888',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 14,
    paddingVertical: 30,
    marginBottom: 15,
  },
  activeTabBox: {
    backgroundColor: colors.blue,
  },
  tabText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
  },
  activeTabText: {
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  badgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkest,
  },
});
