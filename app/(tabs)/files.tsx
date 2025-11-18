import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { getAuth } from 'firebase/auth';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';
import JournalCalendar from '~/components/files/JournalCalendar';
import JournalList from '~/components/files/JournalList';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import TutorialOverlay from '~/components/other/TutorialOverlay';
import SuccessBanner from '~/components/banners/SuccessBanner';
import { useJournalRefresh } from '~/context/JournalRefreshContext';
import { useFadeInAnimation } from '~/hooks/useFadeInAnimation';

export default function FilesTabIndex() {
  const router = useRouter();
  const { loading, recentThree, dailyMoods, fetchJournals } = useJournals();
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [showTutorial, setShowTutorial] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { refreshKey } = useJournalRefresh();
  const { fadeAnim, slideAnim } = useFadeInAnimation();
  
  const user = getAuth().currentUser;
  const userName = user?.displayName || 'Journaler';

  // Refetch only when refreshKey changes (triggered by journal submission)
  useEffect(() => {
    if (refreshKey > 0) {
      fetchJournals();
    }
  }, [refreshKey, fetchJournals]);

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
      
      {/* User info card */}

      {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <SpinningLoader size={40} />
          </View>
      ) : (
        <Animated.View 
          style={{ 
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.userCard}>
              <Text style={styles.fadedTitle}>Your Entries</Text>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => router.push('/settings')}
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
        </Animated.View>
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
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.lighter,
    backgroundColor: '#fff',
  },
  scrollContent: { paddingTop: 0, paddingHorizontal: 20 },
  sectionTitle: {
    marginTop: 34,
    fontFamily: 'SpaceMonoSemibold',
    marginBottom: 8,
    fontSize: 20,
    color: colors.darkest,
  },
});
