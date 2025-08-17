import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { JournalEntry } from '~/hooks/useFiles';
import { colors } from '~/constants/Colors';

interface Props {
  journals: JournalEntry[];
  onSelectDate: (date: string) => void;
}

// Helper: local YYYY-MM-DD (no UTC conversion)
function ymdLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const JournalCalendar: React.FC<Props> = ({ journals, onSelectDate }) => {
  const hasEntry: Record<string, boolean> = {};
  const buckets: Record<string, { sum: number; count: number }> = {};

  journals.forEach(({ createdAt, aiResponse }) => {
    // Use local day instead of UTC ISO day
    const day = ymdLocal(createdAt.toDate());
    hasEntry[day] = true;
    if (!buckets[day]) buckets[day] = { sum: 0, count: 0 };
    buckets[day].sum += aiResponse.moodScore;
    buckets[day].count += 1;
  });

  const markedDates: Record<string, any> = {};
  Object.entries(buckets).forEach(([date, { sum, count }]) => {
    const avg = Math.round(sum / count);
    let backgroundColor: string;
    if (avg <= 3) backgroundColor = '#e75757ff';
    else if (avg <= 6) backgroundColor = '#e4b359ff';
    else backgroundColor = '#63e779ff';

    markedDates[date] = {
      customStyles: {
        container: { backgroundColor, borderRadius: 8 },
        text: { color: '#fff', fontWeight: '700' },
      },
    };
  });

  // Today in LOCAL time (not ISO UTC)
  const today = ymdLocal(new Date());

  if (markedDates[today]) {
    markedDates[today].customStyles.container = {
      ...markedDates[today].customStyles.container,
      borderColor: colors.darkest,
      borderWidth: 1,
    };
    markedDates[today].customStyles.text = {
      ...markedDates[today].customStyles.text,
      color: '#fff',
    };
  } else {
    markedDates[today] = {
      customStyles: {
        container: {
          backgroundColor: 'transparent',
          borderColor: '#000',
          borderWidth: 1,
          borderRadius: 8,
        },
        text: { color: '#000', fontWeight: '700' },
      },
    };
  }

  return (
    <View style={styles.wrapper}>
      <Calendar
        markingType="custom"
        markedDates={markedDates}
        onDayPress={(day: DateData) => {
          if (hasEntry[day.dateString]) onSelectDate(day.dateString);
        }}
        theme={{
          arrowColor: colors.blue,
          monthTextColor: '#000',
          textSectionTitleColor: '#000',
          textDisabledColor: '#ccc',
          textDayFontSize: 16,
          textDayFontWeight: '500',
          textDayHeaderFontSize: 14,
          // make "today" color explicit to avoid surprises
          todayTextColor: colors.blue,
        }}
        style={styles.calendar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    borderColor: colors.lighter,
    borderWidth: 1,
    backgroundColor: '#fff',
    elevation: 2,
  },
  calendar: { paddingBottom: 10 },
});

export default JournalCalendar;
