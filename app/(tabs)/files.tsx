import React, { useState } from 'react';
import { View, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Header from '~/components/Header';
import { colors } from '~/constants/Colors';
import JournalCalendar from '~/components/files/JournalCalendar';
import JournalList from '~/components/files/JournalList';
import useJournals from '~/hooks/useFiles';
import JournalModal from '~/components/files/JournalModal';

export default function Files() {
  const { journals, loading, modalVisible, selectedJournal, openModal, closeModal, handleDelete, recentThree } = useJournals();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const entriesForDay = selectedDate
    ? journals.filter((e) => {
        const d = e.createdAt.toDate().toISOString().split('T')[0];
        return d === selectedDate;
      })
    : [];

  return (
    <View style={styles.container}>
      <Header title="Entries" />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.blue}
          style={styles.loadingIndicator}
        />
      ) : selectedDate === null ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <JournalCalendar
            journals={journals}
            onSelectDate={setSelectedDate}
          />

          <Text style={styles.sectionTitle}>Recent entries</Text>
          <JournalList
            journals={recentThree}
            onSelect={openModal}
          />

          <View style={{ height: 80 }} />
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={styles.backText}>← Calendar</Text>
          </TouchableOpacity>

          {entriesForDay.length > 0 ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <JournalList journals={entriesForDay} onSelect={openModal} />
              <View style={{ height: 80 }} />
            </ScrollView>
          ) : (
            <View style={styles.noEntries}>
              <Text>No entries for {selectedDate}</Text>
            </View>
          )}
        </View>
      )}

      {selectedJournal && (
        <JournalModal
          visible={modalVisible}
          journal={selectedJournal}
          onClose={closeModal}
          onDelete={handleDelete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.lightest 
  },
  loadingIndicator: { 
    marginTop: '45%' 
  },
  scrollContent: { 
    paddingTop: 16, 
    paddingHorizontal: 20 
  },
  backButton: { 
    padding: 10 
  },
  backText: { 
    fontSize: 18, color: 
    colors.blue 
  },
  noEntries: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop:    34,
    fontFamily: "SpaceMono",
    marginBottom: 8,
    fontSize:     20,
    fontWeight:   '600',
    color:        '#222',
  },
});
