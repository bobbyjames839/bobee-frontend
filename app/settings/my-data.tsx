import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';
import Constants from 'expo-constants';
import { getAuth } from 'firebase/auth';

interface DataResponse {
  facts?: string[];
  personality?: string; // long paragraph
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
        headers: { 'Authorization': `Bearer ${idToken}` }
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

  return (
    <>
      <Header title="My Data" leftIcon="chevron-back" onLeftPress={() => { /* router.back handled natively */ }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>      
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Your Stored Data</Text>
          <Text style={styles.boxText}>
            <Text style={styles.sectionTitle}>Overview</Text>{"\n"}
            This section shows the persistent facts and personality paragraph generated from your usage. We store only a minimal profile: a list of durable facts and a reflective paragraph. Contact us to amend or delete this data.{"\n\n"}
          </Text>
          {loading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.blue} size="large" />}
          {error && !loading && <Text style={styles.error}>{error}</Text>}
          {!loading && !error && data && (
            <View>
              {Array.isArray(data.facts) && data.facts.length > 0 && (
                <View style={styles.dataBlock}>
                  <Text style={styles.sectionTitle}>Facts</Text>
                  {data.facts.map((f, i) => (
                    <Text key={i} style={styles.factLine}>{`• ${f}`}</Text>
                  ))}
                </View>
              )}
              {data.personality && (
                <View style={styles.dataBlock}>
                  <Text style={styles.sectionTitle}>Personality Summary</Text>
                  <Text style={styles.personalityText}>{data.personality}</Text>
                </View>
              )}
              {(!data.facts || data.facts.length === 0) && !data.personality && (
                <Text style={styles.empty}>No stored profile data found.</Text>
              )}
            </View>
          )}
          <Text style={styles.manageNote}>Need changes or deletion? Contact us via the Contact page.</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 90,
  },
  box: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  boxTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 22,
    paddingBottom: 6,
    borderBottomColor: colors.lighter,
    borderBottomWidth: 1,
    color: colors.darkest,
    marginBottom: 12,
  },
  boxText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 22,
    color: colors.darkest,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: colors.blue,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dataBlock: {
    marginBottom: 22,
  },
  factLine: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
    marginBottom: 4,
  },
  personalityText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
    lineHeight: 20,
  },
  manageNote: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: colors.dark,
    marginTop: 6,
    opacity: 0.7,
  },
  empty: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.dark,
    marginTop: 12,
  },
  error: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: '#b91c1c',
    marginTop: 24,
  },
});
