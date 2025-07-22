import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';

type CalendarProps = {
  onDayPress: (day: { dateString: string }) => void;
};

export default function Calendar({ onDayPress }: CalendarProps) {
  return (
    <View style={styles.container}>
      <RNCalendar onDayPress={onDayPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F1ED' },
});