import React, { useState, useCallback } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // if this import errors, use: import { useFocusEffect } from 'expo-router'
import { JournalEntry } from '~/hooks/useFiles';
import useJournals from '~/hooks/useFiles';
import { colors } from '~/constants/Colors';
import Svg, { Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  entry: JournalEntry;
  onPress: () => void;
  onDeleteSuccess?: () => void;
}

const formatDate = (ts: Date | { toDate: () => Date }) =>
  (ts instanceof Date ? ts : ts.toDate()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

const JournalCard: React.FC<Props> = ({ entry, onPress, onDeleteSuccess }) => {
  const faceSource = pickFace(entry.aiResponse.moodScore);
  const { deleteJournal } = useJournals();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reset to bin whenever the screen gains focus (and also on blur)
  useFocusEffect(
    useCallback(() => {
      setConfirmDelete(false);
      setDeleteLoading(false);
      return () => {
        setConfirmDelete(false);
        setDeleteLoading(false);
      };
    }, [entry.id])
  );

  const handleDeletePress = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      setDeleteLoading(true);
      await deleteJournal(entry.id);
      onDeleteSuccess?.();
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        {/* Decorative left background "span" with a slanted right edge */}
        <Svg
          pointerEvents="none"
          style={styles.bgSpan}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id={`bgGrad-${entry.id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.blue} stopOpacity={0.07} />
              <Stop offset="1" stopColor={colors.blue} stopOpacity={0.03} />
            </LinearGradient>
          </Defs>
          {/* shape: full height, right edge slanted */}
          <Polygon points="0,0 100,0 85,100 0,100" fill={`url(#bgGrad-${entry.id})`} />
        </Svg>

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

        <Pressable
          onPress={handleDeletePress}
          style={styles.deleteButton}
          android_ripple={{ color: '#bd1212ff' }}
        >
          {deleteLoading ? (
            <SpinningLoader size={20} thickness={3} color='#bd1212ff'/>
          ) : (
            <MaterialIcons
              name={confirmDelete ? 'check' : 'delete-outline'}
              size={25}
              color="#bd1212ff"
            />
          )}
        </Pressable>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden', // clip bg to rounded corners
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.lighter,
    elevation: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  // background "span" on the left with slanted right edge
  bgSpan: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '55%',
    zIndex: 0,
  },
  moodIcon: {
    position: 'absolute',
    top: 3,
    right: 3,
    zIndex: 1,
  },
  moodIconImage: {
    width: 50,
    height: 50,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  date: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 8,
    fontFamily: 'SpaceMono',
    zIndex: 1,
  },
  text: {
    fontSize: 16,
    color: colors.darkest,
    lineHeight: 22,
    fontFamily: 'SpaceMono',
    paddingRight: 56,
    zIndex: 1,
  },
  deleteButton: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    zIndex: 1,
  },
});

export default JournalCard;
