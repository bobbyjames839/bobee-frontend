import React, { useState, useCallback } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // if this import errors, use: import { useFocusEffect } from 'expo-router'
import { JournalEntry } from '~/hooks/useFiles';
import useJournals from '~/hooks/useFiles';
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
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
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

        <Pressable
          onPress={handleDeletePress}
          style={styles.deleteButton}
          android_ripple={{ color: '#bd1212ff' }}
        >
          {deleteLoading ? (
            <SpinningLoader size={20} />
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    height: 100,
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
    justifyContent: 'space-between'
  },
  moodIcon: {
    position: 'absolute',
    top: 3,
    right: 3,
  },
  moodIconImage: {
    width: 50,
    height: 50,
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
    paddingRight: 56,
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
  },
});

export default JournalCard;
