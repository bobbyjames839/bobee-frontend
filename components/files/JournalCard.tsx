import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { JournalEntry } from '~/hooks/useFiles';
import { colors } from '~/constants/Colors';

interface Props {
  entry: JournalEntry;
  onPress: () => void;
}

const formatDate = (ts: Date | { toDate: () => Date }) =>
  (ts instanceof Date ? ts : ts.toDate()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// Face assets (adjust names if your files differ)
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

const JournalCard: React.FC<Props> = ({ entry, onPress }) => {
  const faceSource = pickFace(entry.aiResponse.moodScore);

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <Image
          source={faceSource}
          style={[styles.moodIcon, styles.moodIconImage]}
          accessible
          accessibilityLabel="Mood"
        />
        <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
        <Text style={styles.text} numberOfLines={2}>
          {entry.transcript}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
    elevation: 2,
  },
  // kept same positioning as your icon; added size in moodIconImage below
  moodIcon: {
    position: 'absolute',
    top: 3,
    right: 3,
  },
  // new: just the size; no other visual changes
  moodIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'SpaceMono',
  },
  text: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
    fontFamily: 'SpaceMono',
  },
});

export default JournalCard;
