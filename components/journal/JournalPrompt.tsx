import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '~/constants/Colors';

export default function JournalPrompt({
  prompt,
  loading,
}: {
  prompt: string;
  loading: boolean;
}) {
  return (
    <>
      {prompt && !loading && <Text style={styles.prompt}>{prompt}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  prompt: {
    position: 'absolute',
    top: 100,
    right: 20,
    left: 20,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
    marginBottom: 12,
  },
});