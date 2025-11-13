import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';
import JournalCalendar from '~/components/files/JournalCalendar';
import JournalList from '~/components/files/JournalList';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import TutorialOverlay from '~/components/other/TutorialOverlay';
import SuccessBanner from '~/components/banners/SuccessBanner';
import { useJournalRefresh } from '~/context/JournalRefreshContext';
import { useFocusEffect } from '@react-navigation/native';

export default function FilesTabIndex() {
  const router = useRouter();
  const { loading, recentThree, dailyMoods, fetchJournals } = useJournals();
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [showTutorial, setShowTutorial] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { refreshKey } = useJournalRefresh();

  // Refetch journals when the screen comes into focus or when refreshKey changes
  useFocusEffect(
    React.useCallback(() => {
      fetchJournals();
    }, [fetchJournals, refreshKey])
  );

  useEffect(() => {
    setShowTutorial(tour === '2');
  }, [tour]);

  const handleOpenEntry = (j: JournalEntry) => {
    router.push({ pathname: '/files/[id]', params: { id: j.id } });
  };

  const handleSelectDate = (dateStr: string) => {
    router.push({ pathname: '/files/day', params: { date: dateStr } });
  };

  const handleDeleteSuccess = () => {
    setSuccessMessage('Journal deleted successfully');
  };

  return (
    <View style={styles.container}>
      <SuccessBanner 
        message={successMessage} 
        onHide={() => setSuccessMessage('')} 
      />
      <Header title="Entries" />

      {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <SpinningLoader size={40} />
          </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <JournalCalendar 
            dailyMoods={dailyMoods} 
            recentJournals={recentThree}
            onSelectDate={handleSelectDate} 
          />

          <Text style={styles.sectionTitle}>Recent entries</Text>
          <JournalList 
            journals={recentThree} 
            onSelect={handleOpenEntry}
            onDeleteSuccess={handleDeleteSuccess}
          />

        </ScrollView>
      )}
      {showTutorial && (
        <TutorialOverlay
          step={2}
          total={5}
          title="Browse past entries"
          description="All your transcribed journals live here. Tap a date or a recent entry to revisit what you said."
          onNext={() => {
            setShowTutorial(false);
            router.push('/insights?tour=3');
          }}
          onSkip={() => setShowTutorial(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest },
  scrollContent: { paddingTop: 16, paddingHorizontal: 20 },
  sectionTitle: {
    marginTop: 34,
    fontFamily: 'SpaceMonoSemibold',
    marginBottom: 8,
    fontSize: 20,
    color: '#222',
  },
});
