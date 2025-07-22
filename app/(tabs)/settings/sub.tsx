import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';
import { colors } from '~/constants/Colors';
import { SubscriptionContext } from '~/context/SubscriptionContext';

type PlanKey = 'free' | 'pro';
const plans: Record<PlanKey, { title: string; tagline: string; price: string; features: string[]; icon: string }> = {
  free: {
    title: 'Free Tier',
    tagline: 'Get started with the basics',
    price: '$0',
    features: ['2 minutes of journalling / day', '5 conversations / day', 'Basic journal insights', 'Habit and mood tracking'],
    icon: 'happy-outline',
  },
  pro: {
    title: 'Pro Tier',
    tagline: 'Deep AI insights for regular journalers',
    price: '$9.99',
    features: ['Everything in free', '10 minutes of journalling / day', '50 conversations / day', 'Advanced journal insights', 'Topic and personality insights', 'Personalised Bobee responses in conversations'],
    icon: 'flash-outline',
  },
};

const TAB_MARGIN = 8;
const tabWidth = (Dimensions.get('window').width - 32 - TAB_MARGIN) / 2;

function SubscriptionInner() {
  const { isSubscribed } = useContext(SubscriptionContext);
  const [selectedTab, setSelectedTab] = useState<PlanKey>('free');
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  useEffect(() => {
    if (isSubscribed !== null) {
      setSelectedTab(isSubscribed ? 'pro' : 'free');
    }
  }, [isSubscribed]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // 1) Grab Firebase ID token
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const idToken = await user.getIdToken(false);

      // 2) Call backend for SetupIntent
      const resp = await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ plan: 'pro' }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json.error || `HTTP ${resp.status}`);
      }

      // 3) Destructure the correct fields
      const { customer, ephemeralKey, setupIntent } = json;
      if (!customer || !ephemeralKey || !setupIntent) {
        console.error('[handleUpgrade] missing fields:', json);
        throw new Error('Invalid response from server');
      }

      // 4) Initialize the sheet in setup mode
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'YourAppName',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
      });
      if (initError) throw initError;

      // 5) Present the sheet
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) throw presentError;

      Alert.alert('Success', 'Card saved! You can now access Pro features.');

    } catch (e: any) {
      console.error('[handleUpgrade] caught error=', e);
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
      console.log('[handleUpgrade] done');
    }
  };


  if (isSubscribed === null) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const userPlan: PlanKey = isSubscribed ? 'pro' : 'free';
  const planDetails = plans[selectedTab];
  const isCurrentPlan = selectedTab === userPlan;

  return (
    <View style={styles.container}>
      {/* Current Plan */}
      <View style={styles.currentPlanBox}>
        <Text style={styles.labelText}>Current plan:</Text>
        <Text style={styles.planText}>{plans[userPlan].title}</Text>
      </View>

      {/* Plan Detail */}
      <View style={styles.planDetailBox}>
        <View style={styles.decorCircle}>
          <Ionicons name={planDetails.icon} size={50} color={colors.blue} />
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
              <Ionicons name="checkmark" size={20} color={colors.blue} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, isCurrentPlan && styles.currentButton]}
          onPress={handleUpgrade}
          disabled={loading || isCurrentPlan}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.upgradeButtonText, isCurrentPlan && styles.currentButtonText]}>
                {isCurrentPlan ? 'Your current plan' : 'Upgrade to Pro'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['free','pro'] as PlanKey[]).map((key) => {
          const active = selectedTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabBox, { width: tabWidth }, active && styles.activeTabBox]}
              onPress={() => {
                console.log('[Tab] pressed →', key);
                setSelectedTab(key);
              }}
            >
              <Ionicons name={plans[key].icon} size={28} color={active ? '#fff' : colors.darkest} style={{ marginBottom: 6 }} />
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
  );
}

export default function Subscription() {
  console.log('[Subscription] publishableKey=', process.env.EXPO_PUBLIC_STRIPE_KEY);
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
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
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
    borderRadius: 18,
    marginBottom: 16,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
    color: colors.darkest,
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
    width: '100%',
    height: 50,
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.blue || '#4F46E5',
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tabBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 30,
    marginHorizontal: TAB_MARGIN / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  activeTabBox: {
    backgroundColor: colors.blue || '#4F46E5',
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
    backgroundColor: colors.green || '#10B981',
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
