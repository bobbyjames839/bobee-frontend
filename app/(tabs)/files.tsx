import React from 'react';
import { View, ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { useRouter } from 'expo-router';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';
import JournalCalendar from '~/components/files/JournalCalendar';
import JournalList from '~/components/files/JournalList';
import useJournals, { JournalEntry } from '~/hooks/useFiles';

export default function FilesTabIndex() {
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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <SpinningLoader size={40} />
          </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <JournalCalendar journals={journals} onSelectDate={handleSelectDate} />

          <Text style={styles.sectionTitle}>Recent entries</Text>
          <JournalList journals={recentThree} onSelect={handleOpenEntry} />

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
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
