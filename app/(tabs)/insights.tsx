import React, { useEffect, useState, useRef } from 'react'
import { View, ScrollView, StyleSheet, Animated } from 'react-native'
import { useJournalRefresh } from '~/context/JournalRefreshContext'
import { useInsightsData } from '~/context/InsightsContext'
import HabitCards from '~/components/insights/HabitCards'
import MoodChart from '~/components/insights/MoodChart'
import TopicsSection from '~/components/insights/TopicsSection'
import PersonalitySection from '~/components/insights/Personality'
import Header from '~/components/other/Header'
import { colors } from '~/constants/Colors'
import SpinningLoader from '~/components/other/SpinningLoader'
import TutorialOverlay from '~/components/other/TutorialOverlay';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFadeInAnimation } from '~/hooks/useFadeInAnimation';

export default function InsightsPage() {
  const { refreshKey } = useJournalRefresh()
  const { fadeAnim, slideAnim } = useFadeInAnimation()
  const { stats, moodSeries, personality, topics, loading, fetchInsights } = useInsightsData()
  const router = useRouter();
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const [showTutorial, setShowTutorial] = useState(false);
  const previousRefreshKey = useRef(refreshKey);

  useEffect(() => {
    setShowTutorial(tour === '3');
  }, [tour]);

  // Refetch only when journal refresh is triggered (e.g., after creating a new journal entry)
  // Skip the initial mount since data is already fetched by InsightsContext on app load
  useEffect(() => {
    if (previousRefreshKey.current !== refreshKey) {
      fetchInsights()
      previousRefreshKey.current = refreshKey
    }
  }, [refreshKey, fetchInsights])


  return (
    <>
      <View key={refreshKey} style={styles.mainContainer}>
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
              <HabitCards stats={stats} />
              <MoodChart series={moodSeries} />
              <TopicsSection topics={topics} />
              <PersonalitySection personalityStats={personality} />
            </ScrollView>
          </Animated.View>
        )}
      </View>
      {showTutorial && (
        <TutorialOverlay
          step={3}
          total={5}
          title="Track your progress"
          description="View habits, mood trends, topics and personality signals emerging from your journaling."
          onNext={() => {
            setShowTutorial(false);
            router.push('/bobee?tour=4');
          }}
          onSkip={() => setShowTutorial(false)}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: colors.lightest },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100,     paddingTop: 50 },
})
