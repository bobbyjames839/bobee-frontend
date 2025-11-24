import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getAuth } from 'firebase/auth';
import { colors } from '~/constants/Colors';
import JournalCalendar from '~/components/files/JournalCalendar';
import JournalList from '~/components/files/JournalList';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import TutorialOverlay from '~/components/other/TutorialOverlay';
import SuccessBanner from '~/components/banners/SuccessBanner';
import { useJournalRefresh } from '~/context/JournalRefreshContext';
import { useFadeInAnimation } from '~/hooks/useFadeInAnimation';
import { useTabBar } from '~/context/TabBarContext';

export default function FilesTabIndex() {
  const router = useRouter();
  const { loading, recentThree, dailyMoods, fetchJournals } = useJournals();
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [showTutorial, setShowTutorial] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { refreshKey } = useJournalRefresh();

  useEffect(() => {
    if (refreshKey > 0) {
      fetchJournals();
    }
  }, [refreshKey]);

  useEffect(() => {
    setShowTutorial(tour === '2');
  }, [tour]);

  const handleOpenEntry = (j: JournalEntry) => {
    router.push({ pathname: '/files/[id]', params: { id: j.id } });
  };

  const handleSelectDate = (dateStr: string) => {
    router.push({ pathname: '/files/day', params: { date: dateStr } });
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
      
      {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <SpinningLoader size={40} />
          </View>
      ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.userCard}>
              <Text style={styles.fadedTitle}>Your Entries</Text>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => {
                  router.push('/settings');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                }}
                activeOpacity={0.7}
              >
                <Settings size={22} color={colors.darkest} strokeWidth={2} />
              </TouchableOpacity>

            </View>

            <JournalCalendar 
              dailyMoods={dailyMoods} 
              recentJournals={recentThree}
              onSelectDate={handleSelectDate} 
            />

            <Text style={styles.sectionTitle}>Recent entries</Text>
            <JournalList 
              journals={recentThree} 
              onSelect={handleOpenEntry}
              showSuccessMessage={handleShowSuccess}
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
  container: { flex: 1, backgroundColor: colors.lightest},
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 65,
  },
  fadedTitle: {
    fontFamily: 'SpaceMonoBold',
    fontSize: 44,
    color: '#e1deeeff',
    alignSelf: 'flex-end',
    marginBottom: -15,
    marginLeft: 10,
    marginTop: 20,
  },
  settingsButton: {
    height: 42,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  scrollContent: { paddingTop: 0, paddingHorizontal: 20 },
  sectionTitle: {
    marginTop: 34,
    fontFamily: 'SpaceMonoSemibold',
    marginBottom: 8,
    marginLeft: 6,
    fontSize: 20,
    color: colors.darkest,
  },
});
