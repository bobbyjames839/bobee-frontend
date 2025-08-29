// Subscription.tsx
import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';
import * as PlatformModule from 'react-native';
// We will lazy-load IAP to reduce chance of native crash if not linked
let RNIap: any = {} as any; // assigned after dynamic import
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

  // IAP state
  const [iapReady, setIapReady] = useState(false);
  const [iapProduct, setIapProduct] = useState<AnySub | null>(null);
  const [iapInitError, setIapInitError] = useState<string | null>(null);
  const purchaseUpdateSub = useRef<any>(null);
  const purchaseErrorSub = useRef<any>(null);
  const DEBUG = __DEV__ || Constants.expoConfig?.extra?.iapDebug;

  // On-screen debug log (works in release/TestFlight)
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [debugVisible, setDebugVisible] = useState<boolean>(false);
  const pushLog = useCallback((msg: string, data?: any) => {
    const ts = new Date().toISOString().split('T')[1].replace('Z', '');
    let line = `[${ts}] ${msg}`;
    if (data !== undefined) {
      try { line += ' :: ' + (typeof data === 'string' ? data : JSON.stringify(data)); } catch {}
    }
    setLogMessages(prev => [...prev.slice(-180), line]);
  }, []);
  useEffect(() => {
    if (!__DEV__ && (errorMsg || iapInitError) && !debugVisible) setDebugVisible(true);
  }, [errorMsg, iapInitError, debugVisible]);

  const getDisplayPrice = (sub?: AnySub | null): string | undefined => {
    if (!sub) return undefined;
    if (typeof sub.localizedPrice === 'string' && sub.localizedPrice.length > 0) return sub.localizedPrice;
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

  // Reflect current plan in tabs
  useEffect(() => {
    if (isSubscribed !== null) setSelectedTab(isSubscribed ? 'pro' : 'free');
  }, [isSubscribed]);

  const loadIapModule = async () => {
    try {
      pushLog('Loading IAP module');
      const mod = await import('react-native-iap');
      const IAP = (mod as any).default ?? mod;
      if (!IAP || typeof IAP.initConnection !== 'function') {
        throw new Error('IAP native module unavailable');
      }
      pushLog('IAP module loaded ok');
      return IAP;
    } catch (e: any) {
      pushLog('Failed to load IAP module', e?.message || String(e));
      throw new Error('Failed to load IAP: ' + (e?.message || String(e)));
    }
  };

  const purchaseWithApple = async () => {
    setLoading(true);
    pushLog('Purchase flow start');
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      if (!isIOS) throw new Error('iOS only environment');

      if (!RNIap || typeof RNIap.initConnection !== 'function') {
        RNIap = await loadIapModule();
      }

      pushLog('Calling initConnection');
      let initOk = false;
      try {
        initOk = await RNIap.initConnection();
      } catch (e: any) {
        pushLog('initConnection threw', e?.message || String(e));
        throw e;
      }
      pushLog('initConnection result', initOk);
      if (!initOk) throw new Error('Could not initialize App Store connection');

      const detach = () => {
        try { purchaseUpdateSub.current?.remove?.(); } catch {}
        try { purchaseErrorSub.current?.remove?.(); } catch {}
        try { RNIap?.endConnection?.(); } catch {}
        pushLog('Detached listeners & ended connection');
      };

      // Register listeners
      if (typeof RNIap.purchaseUpdatedListener === 'function') {
        purchaseUpdateSub.current = RNIap.purchaseUpdatedListener(async (purchase: Purchase) => {
          pushLog('purchaseUpdatedListener fired', { productId: (purchase as any)?.productId });
          try {
            const receipt = (purchase as any).transactionReceipt;
            if (!receipt) { pushLog('No receipt on purchase'); return; }
            pushLog('Receipt length', String(receipt.length));
            const idToken = await user.getIdToken(false);
            pushLog('Verifying with backend');
            const resp = await fetch(`${API_BASE}/api/subscribe/iap/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
              body: JSON.stringify({ receiptData: receipt }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data?.error || 'Receipt verify failed');
            pushLog('Backend verification success');
            try {
              if (typeof RNIap.finishTransaction === 'function') {
                pushLog('Finishing transaction');
                await RNIap.finishTransaction({ purchase, isConsumable: false });
                pushLog('finishTransaction ok');
              }
            } catch (finishErr: any) {
              pushLog('finishTransaction error', finishErr?.message || String(finishErr));
            }
            setSuccessMsg('Subscription activated via Apple');
            setErrorMsg('');
            refresh();
          } catch (e: any) {
            setErrorMsg(e?.message || 'Verification failed');
            pushLog('Verification error', e?.message || String(e));
          } finally {
            setLoading(false);
            detach();
          }
        });
      }
      if (typeof RNIap.purchaseErrorListener === 'function') {
        purchaseErrorSub.current = RNIap.purchaseErrorListener((err: PurchaseError) => {
          pushLog('purchaseErrorListener', { code: (err as any)?.code, message: err?.message });
          setLoading(false);
          setErrorMsg(err?.message || 'Purchase error');
          setSuccessMsg('');
          try { RNIap?.endConnection?.(); } catch {}
        });
      }

      // Fetch product (optional)
      try {
        if (typeof RNIap.getSubscriptions === 'function') {
            pushLog('Fetching subscriptions');
            let subs: any[] = [];
            try { subs = await RNIap.getSubscriptions({ skus: [APPLE_PRODUCT_ID] }); }
            catch { subs = await RNIap.getSubscriptions([APPLE_PRODUCT_ID]); }
            pushLog('Subscriptions fetched count', String(subs?.length || 0));
            setIapProduct(subs?.[0] || null);
        }
        setIapReady(true);
      } catch (e: any) {
        pushLog('getSubscriptions failed', e?.message || String(e));
      }

      // Request subscription
      if (typeof RNIap.requestSubscription !== 'function') throw new Error('requestSubscription not available');
      try {
        pushLog('Requesting subscription (object arg)');
        await RNIap.requestSubscription({ sku: APPLE_PRODUCT_ID });
      } catch {
        pushLog('Retry requestSubscription (string arg)');
        await RNIap.requestSubscription(APPLE_PRODUCT_ID as any);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      setIapInitError(msg);
      setErrorMsg(msg);
      setSuccessMsg('');
      pushLog('Purchase flow error', msg);
      setLoading(false);
    }
  };


  const handleUpgrade = async () => {
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
    if (DEBUG && iapInitError) console.log('[IAP] init error state', iapInitError);
  if (iapInitError) pushLog('iapInitError state', iapInitError);
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
      {/* Debug toggle button (always available). Small, unobtrusive. */}
      <TouchableOpacity
        style={styles.debugToggle}
        onPress={() => setDebugVisible(v => !v)}
        accessibilityLabel="Toggle debug log"
      >
        <Text style={styles.debugToggleText}>{debugVisible ? 'Hide Logs' : 'Show Logs'}</Text>
      </TouchableOpacity>
      {debugVisible && (
        <View style={styles.debugPanel} pointerEvents="box-none">
          <Text style={styles.debugTitle}>IAP Debug Log (local only)</Text>
          <ScrollView style={styles.debugScroll} contentContainerStyle={{ paddingBottom: 8 }}>
            {logMessages.length === 0 && (
              <Text style={styles.debugLine}>No log messages yet. Start a purchase to populate.</Text>
            )}
            {logMessages.map((l, i) => (
              <Text key={i} style={styles.debugLine}>{l}</Text>
            ))}
          </ScrollView>
          <View style={styles.debugRow}>
            <TouchableOpacity onPress={() => setLogMessages([])} style={styles.debugBtn}><Text style={styles.debugBtnText}>Clear</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setDebugVisible(false); }} style={styles.debugBtn}><Text style={styles.debugBtnText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      )}
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
  
  debugToggle: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  debugToggleText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'SpaceMono',
  },
  debugPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '55%',
    backgroundColor: '#0f172acc',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  debugTitle: {
    color: '#fff',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
  debugScroll: {
    flexGrow: 0,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 6,
    backgroundColor: '#1e293b',
    maxHeight: 220,
  },
  debugLine: {
    color: '#cbd5e1',
    fontSize: 11,
    fontFamily: 'SpaceMono',
    marginBottom: 2,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  debugBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  debugBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
});
