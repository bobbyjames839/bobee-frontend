import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';

interface DataResponse {
  facts?: string[];
  personality?: string;
  [key: string]: any;
}

export default function MyDataScreen() {
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setError(null);
    try {
      const user = getAuth().currentUser;
      if (!user) {
        setError('Not signed in');
        setLoading(false);
        return;
      }
      const idToken = await user.getIdToken(false);
      const resp = await fetch(`${API_BASE}/api/settings/get-personality-data`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to load data');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const hasProfile =
    !!data && ((Array.isArray(data.facts) && data.facts.length > 0) || !!data.personality);

  // Precompute banner UI (shown above everything)
  const banner = useMemo(() => {
    if (loading) {
      return (
        <View style={[styles.banner, styles.rowCenter]}>
          <ActivityIndicator size="small" color={colors.blue} />
          <Text style={[styles.text, styles.bannerText, { marginLeft: 8 }]}>
            Loading your profile...
          </Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={[styles.banner, styles.errorBanner]}>
          <Text style={[styles.text, styles.bannerText]}>{error}</Text>
        </View>
      );
    }
    return null;
  }, [loading, error]);

  return (
    <>
      <Header
        title="My Data"
        leftIcon="chevron-back"
        onLeftPress={() => {}}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {banner}

        <View style={styles.card}>

          {!loading && !error && (
            <>
              {Array.isArray(data?.facts) && data!.facts.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.title}>Facts</Text>
                  {data!.facts.map((f, i) => (
                    <Text key={i} style={styles.text}>{`• ${f}`}</Text>
                  ))}
                </View>
              )}

              {!!data?.personality && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.title}>Personality Summary</Text>
                  <Text style={styles.text}>{data!.personality}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
  content: { padding: 20, paddingBottom: 90 },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
  },
  title: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 16,
    color: colors.blue,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  text: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
    color: colors.darkest,
    marginBottom: 4,
  },
  banner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  errorBanner: {
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  bannerText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
