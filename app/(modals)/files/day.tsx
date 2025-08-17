// app/(modals)/files/day.tsx
import React, { useMemo } from 'react';
import { View, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '~/constants/Colors';
import useJournals, { JournalEntry } from '~/hooks/useFiles';
import JournalList from '~/components/files/JournalList';

function DayEntriesScreenInner() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { journals, loading } = useJournals();
  const insets = useSafeAreaInsets();

  const entriesForDay = useMemo(() => {
    if (!date) return [];
    return journals.filter(e => e.createdAt.toDate().toISOString().split('T')[0] === date);
  }, [journals, date]);

  const handleOpen = (j: JournalEntry) => {
    router.push({ pathname: '/files/[id]', params: { id: j.id } });
  };

  return (
    <View style={styles.container}>
      {/* Make status bar overlay content; header pads by insets.top */}
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconWrap}>
          <Ionicons name="chevron-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>{date ? `Entries • ${date}` : 'Entries'}</Text>
        <View style={styles.iconWrap} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      ) : entriesForDay.length > 0 ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom || 24 }]}>
          <JournalList journals={entriesForDay} onSelect={handleOpen} />
          <View style={{ height: 60 }} />
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text>No entries for {date}</Text>
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
  container: { flex: 1, backgroundColor: colors.lightest }, // solid white all the way up
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12, // bottom padding to match your original vertical spacing
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    justifyContent: 'space-between',
  },
  iconWrap: { width: 28 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'SpaceMono',
  },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
