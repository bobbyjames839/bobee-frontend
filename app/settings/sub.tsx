// Subscription.tsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Alert, Linking } from 'react-native';
import * as PlatformModule from 'react-native';
import * as RNIap from 'react-native-iap';
import type { Subscription, Purchase, PurchaseError } from 'react-native-iap';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';
import { colors } from '~/constants/Colors';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import SuccessBanner from '~/components/banners/SuccessBanner';
import ErrorBanner from '~/components/banners/ErrorBanner';
import { Smiley, Crown, CheckCircle } from 'phosphor-react-native';
import Header from '~/components/other/Header';
import SpinningLoader from '~/components/other/SpinningLoader';
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

const APPLE_PRODUCT_ID = 'com.bobee.pro.monthly';
const isIOS = PlatformModule.Platform.OS === 'ios';

// A tolerant type that works across IAP versions/platforms
type AnySub = Partial<Subscription> & {
  productId?: string;
  price?: number | string;          // some versions return number, some string
  currency?: string;                // e.g., "USD"
  localizedPrice?: string;          // iOS often provides this
};

function SubscriptionInner() {
  const { isSubscribed, refresh } = useContext(SubscriptionContext);
  const [selectedTab, setSelectedTab] = useState<PlanKey>('free');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  // IAP bits
  const [iapReady, setIapReady] = useState(false);
  const [iapProduct, setIapProduct] = useState<AnySub | null>(null);
  const [iapInitError, setIapInitError] = useState<string | null>(null);

  const purchaseUpdateSub = useRef<ReturnType<typeof RNIap.purchaseUpdatedListener> | null>(null);
  const purchaseErrorSub = useRef<ReturnType<typeof RNIap.purchaseErrorListener> | null>(null);

  // Helper: make a nice price label from whatever fields exist
  const getDisplayPrice = (sub?: AnySub | null): string | undefined => {
    if (!sub) return undefined;
    if (typeof sub.localizedPrice === 'string' && sub.localizedPrice.length > 0) {
      return sub.localizedPrice; // best, already localized
    }
    if (sub.price != null && typeof sub.currency === 'string') {
      const num = typeof sub.price === 'string' ? Number(sub.price) : sub.price;
      if (!Number.isNaN(num)) {
        try {
          return new Intl.NumberFormat(undefined, { style: 'currency', currency: sub.currency }).format(num);
        } catch {
          return `${num} ${sub.currency}`;
        }
      }
    }
    if (typeof sub.price === 'string') return sub.price;
    if (typeof sub.price === 'number') return `${sub.price}`;
    return undefined;
  };

  // Initialize IAP + listeners
  useEffect(() => {
    if (!isIOS) return;
    let mounted = true;

    (async () => {
      try {
        if (typeof RNIap.initConnection !== 'function') {
          throw new Error('IAP native module not linked (needs custom dev client / EAS build — Expo Go will not work)');
        }

        const ok = await RNIap.initConnection();
        if (!ok) throw new Error('initConnection returned false');

        // Some versions accept { skus }, others want string[]
        const subs: any =
          typeof RNIap.getSubscriptions === 'function'
            ? await (RNIap as any).getSubscriptions({ skus: [APPLE_PRODUCT_ID] }).catch(async () => {
                // fallback legacy signature
                return await (RNIap as any).getSubscriptions([APPLE_PRODUCT_ID]);
              })
            : [];

        if (mounted) {
          setIapProduct((subs && subs[0]) || null);
          setIapReady(true);
        }

        // Purchase success
        purchaseUpdateSub.current = RNIap.purchaseUpdatedListener(async (purchase: Purchase) => {
          try {
            const receipt = (purchase as any).transactionReceipt;
            if (!receipt) return;

            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
              setErrorMsg('Not logged in');
              return;
            }

            const idToken = await user.getIdToken(false);
            const resp = await fetch(`${API_BASE}/api/subscribe/iap/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
              body: JSON.stringify({ receiptData: receipt }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error || 'Receipt verify failed');

            // Newer RN-IAP expects an object arg
            await (RNIap as any).finishTransaction({ purchase, isConsumable: false });

            setSuccessMsg('Subscription activated via Apple');
            setErrorMsg('');
            refresh();
          } catch (e: any) {
            setErrorMsg(e?.message || 'Verification failed');
          } finally {
            setLoading(false);
          }
        });

        // Purchase errors
        purchaseErrorSub.current = RNIap.purchaseErrorListener((err: PurchaseError) => {
          setLoading(false);
          setErrorMsg(err?.message || 'Purchase error');
        });
      } catch (e: any) {
        if (mounted) setIapInitError(e?.message || String(e));
      }
    })();

    return () => {
      mounted = false;
      try {
        purchaseUpdateSub.current?.remove?.();
        purchaseErrorSub.current?.remove?.();
      } catch {}
      RNIap.endConnection?.();
    };
  }, []);

  // Reflect current plan in tabs
  useEffect(() => {
    if (isSubscribed !== null) setSelectedTab(isSubscribed ? 'pro' : 'free');
  }, [isSubscribed]);

  // Start an Apple purchase
  const purchaseWithApple = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      if (!iapReady) throw new Error('IAP not ready yet');
      if (!iapProduct) throw new Error('Product not available');

      // Current RN-IAP accepts { sku } on iOS; older accepts string
      if (typeof (RNIap as any).requestSubscription === 'function') {
        try {
          await (RNIap as any).requestSubscription({ sku: APPLE_PRODUCT_ID });
        } catch {
          await (RNIap as any).requestSubscription(APPLE_PRODUCT_ID);
        }
      }
      // Listener handles verification & finishTransaction
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Apple purchase failed');
      setSuccessMsg('');
    }
  };


  const handleUpgrade = async () => {
  // no cancelDate handling; Apple manages cancellation externally
    if (isIOS) return purchaseWithApple();
    setErrorMsg('Purchases are only available on iOS in this build.');
  };

  const handleCancel = () => {
    if (isIOS) {
      // iOS manage subscriptions deep link
      Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {
        Alert.alert('Manage subscription', 'Open Settings > Apple ID > Subscriptions to manage.');
      });
    } else {
      Alert.alert('Manage subscription', 'Subscription management not available on this platform.');
    }
  };

  const isLoadingInitial = isSubscribed === null;
  const userPlan: PlanKey = isSubscribed ? 'pro' : 'free';
  const planDetails = plans[selectedTab];
  const isCurrentPlan = selectedTab === userPlan;
  const DetailIcon = iconForPlan(selectedTab);

  const disableAction: boolean = !!(loading || (isSubscribed && selectedTab === 'pro'));

  if (isLoadingInitial) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const priceLabel = selectedTab === 'pro' ? (getDisplayPrice(iapProduct) ?? plans.pro.price) : plans.free.price;

  const getButtonLabel = () => {
  // cancellationPending removed (Apple managed outside app)
    if (isSubscribed) {
      if (selectedTab === 'pro') return 'Your current plan';
      return 'Switch to free (Stripe flow disabled)';
    }
    if (selectedTab === 'pro') {
      if (iapInitError) return 'IAP unavailable';
      return `Subscribe ${priceLabel}`;
    }
    return 'Your current plan';
  };

  const onPrimaryPress = () => {
  if (disableAction) return;
    if (isSubscribed && selectedTab === 'free') return handleCancel();
    if (!isSubscribed && selectedTab === 'pro') return handleUpgrade();
  };

  useEffect(() => {
    if (iapInitError && !errorMsg) setErrorMsg(`IAP init issue: ${iapInitError}`);
  }, [iapInitError, errorMsg]);

  return (
    <>
      <Header title="Subscription" leftIcon="chevron-back" onLeftPress={() => router.back()} />
      <SuccessBanner message={successMsg} onHide={() => setSuccessMsg('')} />
      <ErrorBanner message={errorMsg} onHide={() => setErrorMsg('')} />

      <View style={styles.container}>
        {/* current plan box */}
        <View style={styles.currentPlanBox}>
          <Text style={styles.labelText}>
            Current plan:
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
            <Text style={styles.planPrice}>{priceLabel}</Text>
            <Text style={styles.planUnit}>{selectedTab === 'pro' ? '' : ' USD / month'}</Text>
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
              (isCurrentPlan && !(!isSubscribed && selectedTab === 'pro')) && styles.currentButton,
              isSubscribed && selectedTab === 'free' && styles.cancelButton,
            ]}
            onPress={onPrimaryPress}
            disabled={disableAction}
          >
            {loading ? (
              <SpinningLoader size={20} thickness={3} color="white" />
            ) : (
              <Text
                style={[
                  styles.upgradeButtonText,
                  (isCurrentPlan && selectedTab !== 'free') && styles.currentButtonText,
                ]}
              >
                {getButtonLabel()}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore purchases button removed: entitlement now refreshed only after new purchase */}
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
  return <SubscriptionInner />;
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
  labelText: { fontFamily: 'SpaceMono', fontSize: 14, color: colors.darkest },
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
  planText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkest,
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
  // restoreButton styles removed
});
