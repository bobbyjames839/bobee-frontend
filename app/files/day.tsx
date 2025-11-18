import React, { useMemo } from 'react';
import { View, ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import JournalList from '~/components/files/JournalList';
import Header from '~/components/other/Header';
import SuccessBanner from '~/components/banners/SuccessBanner';

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
  const { fetchJournalsByDate } = useJournals();
  const [entriesForDay, setEntriesForDay] = React.useState<JournalEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    if (!date) {
      setEntriesForDay([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchJournalsByDate(date)
      .then((entries) => {
        setEntriesForDay(entries);
      })
      .catch((error) => {
        console.error('Error fetching journals by date:', error);
        setEntriesForDay([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [date, fetchJournalsByDate]);

  const handleOpen = (j: JournalEntry) => {
    router.push({ pathname: '/files/[id]', params: { id: j.id } });
  };

  const handleDeleteSuccess = (deletedId: string) => {
    // Update local state only, no refetch needed
    setEntriesForDay(prev => prev.filter(entry => entry.id !== deletedId));
  };

  const handleShowSuccess = (message: string) => {
    setSuccessMessage(message);
  };

  return (
    <View style={styles.container}>
    <SuccessBanner 
      message={successMessage} 
      onHide={() => setSuccessMessage('')} 
    />
    <Header
        title={date ? `${formatDateDisplay(date)}` : 'Entries'}
        leftIcon="chevron-back"
        onLeftPress={() => (router.back())}/>

      {loading ? (
        <View style={styles.center}>
          <SpinningLoader size={40} />
        </View>
      ) : entriesForDay.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.content}
        >
          <JournalList journals={entriesForDay} onSelect={handleOpen} onDeleteSuccess={handleDeleteSuccess} showSuccessMessage={handleShowSuccess} />
          <View style={{ height: 60 }} />
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.centerText}>There are no entries for this date, we have just kept your mood safe for you.</Text>
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
    width: '80%',
    fontSize: 15,
    textAlign: 'center',
  },
});
