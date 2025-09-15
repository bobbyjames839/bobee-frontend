import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
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

// Mood faces
const FACE_VERY_SAD        = require('~/assets/images/verysad.png');
const FACE_SAD             = require('~/assets/images/sad.png');
const FACE_NEUTRAL         = require('~/assets/images/mid.png');
const FACE_SLIGHTLY_HAPPY  = require('~/assets/images/happy.png');
const FACE_VERY_HAPPY      = require('~/assets/images/veryhappy.png');

function pickFace(score: number) {
  if (score <= 2) return FACE_VERY_SAD;
  if (score <= 4) return FACE_SAD;
  if (score <= 6) return FACE_NEUTRAL;
  if (score <= 8) return FACE_SLIGHTLY_HAPPY;
  return FACE_VERY_HAPPY;
}

const JournalCalendar: React.FC<Props> = ({ journals, onSelectDate }) => {
  // Aggregate by local day for average mood
  const dayData = useMemo(() => {
    const buckets: Record<string, { sum: number; count: number } & { hasEntry: boolean }> = {};
    journals.forEach(({ createdAt, aiResponse }) => {
      const day = ymdLocal(createdAt.toDate());
      if (!buckets[day]) buckets[day] = { sum: 0, count: 0, hasEntry: false };
      buckets[day].sum += aiResponse.moodScore;
      buckets[day].count += 1;
      buckets[day].hasEntry = true;
    });
    const result: Record<string, { avg: number; hasEntry: boolean }> = {};
    Object.entries(buckets).forEach(([d, { sum, count, hasEntry }]) => {
      result[d] = { avg: Math.round(sum / count), hasEntry };
    });
    return result;
  }, [journals]);

  const today = ymdLocal(new Date());

  // Custom day component
  const DayComponent = ({ date, state }: { date: DateData; state: string }) => {
    const info = dayData[date.dateString];
    const isToday = date.dateString === today;
    const faceSource = info ? pickFace(info.avg) : null;
    const disabled = state === 'disabled';

    // Background colors per mood bracket
    let moodBackground: string | undefined;
    let moodBorder: string | undefined;
    if (info) {
      const avg = info.avg;
      if (avg <= 2) {
        moodBackground = '#f53232ff';
        moodBorder = '#b00505ff';
      } else if (avg <= 4) {
        moodBackground = '#f38d8dff';
        moodBorder = '#ee5353ff';
      } else if (avg <= 6) {
        moodBackground = '#e7eaecff';
        moodBorder = '#a4a8aaff';
      } else if (avg <= 8) {
        moodBackground = '#a2eaa7ff';
        moodBorder = '#7bc67f';
      } else {
        moodBackground = '#19f219ff';
        moodBorder = '#0f9b0fff';
      }
    }

    const dayNum = new Date(date.dateString + 'T00:00:00').getDate();

    return (
      <TouchableOpacity
        disabled={!info || disabled}
        onPress={() => info && onSelectDate(date.dateString)}
        style={styles.dayWrapper}
      >
        <View
          style={[
            styles.faceBox,
            !info && styles.emptyBox,
            info && { backgroundColor: moodBackground, borderColor: moodBorder },
            isToday && styles.todayBox,
          ]}
        >
          {faceSource ? (
            <>
              <Image source={faceSource} style={styles.faceImage} />
            </>
          ) : (
            <Text
              style={[
                styles.emptyDayNumber,
                disabled && styles.disabledText,
                isToday && styles.todayNumber,
              ]}
            >
              {dayNum}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Calendar
        markedDates={{}}
        dayComponent={DayComponent as any}
        onDayPress={() => { /* handled inside dayComponent */ }}
        theme={{
          arrowColor: colors.blue,
          monthTextColor: '#000',
          textSectionTitleColor: '#000',
          textDisabledColor: '#ccc',
          textDayHeaderFontSize: 14,
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
  dayWrapper: {
    width: 46,
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f4f7f8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  todayBox: {
    borderWidth: 1.5,
    borderColor: colors.darkest,
  },
  emptyBox: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d6d6d6',
  },
  faceImage: {
    width: 38,  // back to original size
    height: 38,
    resizeMode: 'contain',
  },
  // Larger number centered when empty
  emptyDayNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.darkest,
  },
  todayNumber: {
    fontWeight: '700',
    color: colors.darkest,
  },
  disabledText: {
    color: '#ccc',
  },
});

export default JournalCalendar;
