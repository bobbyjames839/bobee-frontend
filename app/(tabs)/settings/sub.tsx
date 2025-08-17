import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';
import { colors } from '~/constants/Colors';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import { Smiley, Crown, CheckCircle } from 'phosphor-react-native';
import Header from '~/components/Header';
import { router } from 'expo-router';


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
      'Habit and mood tracking'
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
      'Personalised Bobee responses in conversations'
    ],
  },
};

const TAB_MARGIN = 8;
const tabWidth = (Dimensions.get('window').width - 32 - TAB_MARGIN) / 2;

const iconForPlan = (key: PlanKey) => (key === 'pro' ? Crown : Smiley);

function SubscriptionInner() {
  const { isSubscribed } = useContext(SubscriptionContext);
  const [selectedTab, setSelectedTab] = useState<PlanKey>('free');
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;
  const { height } = useWindowDimensions()


  useEffect(() => {
    if (isSubscribed !== null) {
      setSelectedTab(isSubscribed ? 'pro' : 'free');
    }
  }, [isSubscribed]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const idToken = await user.getIdToken(false);

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

      const { customer, ephemeralKey, setupIntent } = json;
      if (!customer || !ephemeralKey || !setupIntent) {
        throw new Error('Invalid response from server');
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Bobee',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
      });
      if (initError) throw initError;

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) throw presentError;

      Alert.alert('Success', 'Card saved! You can now access Pro features.');

    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
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
  const DetailIcon = iconForPlan(selectedTab);

  return (
    <>
    <Header
        title='Subscription'
        leftIcon="chevron-back"
        onLeftPress={() => (router.back())}/>
    <View style={styles.container}>
      <View style={styles.currentPlanBox}>
        <Text style={styles.labelText}>Current plan:</Text>
        <Text style={styles.planText}>{plans[userPlan].title}</Text>
      </View>

      {/* Plan Detail */}
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
          const TabIcon = iconForPlan(key);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabBox, { width: tabWidth }, active && styles.activeTabBox]}
              onPress={() => setSelectedTab(key)}
            >
              <TabIcon size={28} color={active ? '#fff' : colors.darkest} weight={active ? 'fill' : 'regular'} style={{ marginBottom: 6 }} />
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
