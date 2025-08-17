import React, { useMemo } from 'react';
import { View, ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import JournalList from '~/components/files/JournalList';
import Header from '~/components/Header';

function formatDateDisplay(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();

    const j = day % 10;
    const k = day % 100;
    let suffix = 'th';
    if (j === 1 && k !== 11) suffix = 'st';
    else if (j === 2 && k !== 12) suffix = 'nd';
    else if (j === 3 && k !== 13) suffix = 'rd';

    return `${day}${suffix} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

function DayEntriesScreenInner() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { journals, loading } = useJournals();
  const insets = useSafeAreaInsets();

  const entriesForDay = useMemo(() => {
    if (!date) return [];
    return journals.filter(
      (e) => e.createdAt.toDate().toISOString().split('T')[0] === date
    );
  }, [journals, date]);

  const handleOpen = (j: JournalEntry) => {
    router.push({ pathname: '/files/[id]', params: { id: j.id } });
  };

  return (
    <View style={styles.container}>
    <Header
        title={date ? `Entries on ${formatDateDisplay(date)}` : 'Entries'}
        leftIcon="chevron-back"
        onLeftPress={() => (router.back())}/>

      {loading ? (
        <View style={styles.center}>
          <SpinningLoader size={40} />
        </View>
      ) : entriesForDay.length > 0 ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom || 24 },
          ]}
        >
          <JournalList journals={entriesForDay} onSelect={handleOpen} />
          <View style={{ height: 60 }} />
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.centerText}>There are no entries for this date</Text>
        </View>
      )}
    </View>
  );
}

export default function DayEntriesScreen() {
  return (
    <SafeAreaProvider>
      <DayEntriesScreenInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
  },
});
