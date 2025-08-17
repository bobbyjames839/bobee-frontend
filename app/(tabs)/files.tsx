import React from 'react';
import { View, ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '~/components/Header';
import { colors } from '~/constants/Colors';
import JournalCalendar from '~/components/files/JournalCalendar';
import JournalList from '~/components/files/JournalList';
import useJournals, { JournalEntry } from '~/hooks/useFiles';

export default function FilesTab() {
  const router = useRouter();
  const { journals, loading, recentThree } = useJournals();

  const handleOpenEntry = (j: JournalEntry) => {
    router.push({ pathname: '/files/[id]', params: { id: j.id } });
  };

  const handleSelectDate = (dateStr: string) => {
    router.push({ pathname: '/files/day', params: { date: dateStr } });
  };

  return (
    <View style={styles.container}>
      <Header title="Entries" />

      {loading ? (
        <ActivityIndicator size="large" color={colors.blue} style={styles.loadingIndicator} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <JournalCalendar journals={journals} onSelectDate={handleSelectDate} />

          <Text style={styles.sectionTitle}>Recent entries</Text>
          <JournalList journals={recentThree} onSelect={handleOpenEntry} />

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
  loadingIndicator: { marginTop: '45%' },
  scrollContent: { paddingTop: 16, paddingHorizontal: 20 },
  sectionTitle: {
    marginTop: 34,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
});
