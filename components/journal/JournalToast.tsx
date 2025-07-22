import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function JournalToast({
  visible,
  text,
}: {
  visible: boolean;
  text: string;
}) {
  if (!visible) return null;
  return (
    <View style={styles.toastWrapper}>
      <Text style={styles.confirmationText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  confirmationText: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
    fontSize: 16,
    fontFamily: 'SpaceMono',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
});
