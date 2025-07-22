import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { useJournalRefresh } from '~/context/JournalRefreshContext'
import HabitCards from '~/components/insights/HabitCards'
import MoodChart from '~/components/insights/MoodChart'
import TopicsSection from '~/components/insights/TopicsSection'
import PersonalitySection from '~/components/insights/Personality'
import Header from '~/components/Header'
import { colors } from '~/constants/Colors'

export default function InsightsPage() {
  const { refreshKey } = useJournalRefresh()

  return (
    <>
      <Header title='Insights'/>
      <View key={refreshKey} style={styles.mainContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <HabitCards />
          <MoodChart />
          <TopicsSection />
          <PersonalitySection/>
        </ScrollView>
      </View>
    </>
  )
}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
})
