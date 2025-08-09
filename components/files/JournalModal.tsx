import React, { useState, useEffect, useContext } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import { JournalEntry } from '~/hooks/useFiles';
import { colors } from '~/constants/Colors';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  journal: JournalEntry;
  onClose: () => void;
  onDelete: () => void;
}

const getMoodIcon = (score: number) => {
  if (score <= 3) return { name: 'sentiment-very-dissatisfied', color: '#E74C3C' };
  if (score <= 6) return { name: 'sentiment-neutral', color: '#F1C40F' };
  return { name: 'sentiment-very-satisfied', color: '#2ECC71' };
};

const JournalModal: React.FC<Props> = ({ visible, journal, onClose, onDelete }) => {
  const router = useRouter();
  const { isSubscribed } = useContext(SubscriptionContext);
  const mood = getMoodIcon(journal.aiResponse.moodScore);
  const wordCount = journal.transcript.trim().split(/\s+/).length;
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (visible) setConfirmDelete(false);
  }, [visible]);

  const handleDeletePress = () => {
    if (!confirmDelete) setConfirmDelete(true);
    else onDelete();
  };

  const navigateAndClose = () => {
    router.push("/(tabs)/settings/sub");
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={handleDeletePress}>
              <MaterialIcons
                name={confirmDelete ? 'check' : 'delete-outline'}
                size={28}
                color="#B22222"
              />
            </Pressable>
            <Text style={styles.title}>Journal Detail</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={28} color="#222" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {journal.prompt?.trim() && (
              <>
                <Text style={styles.section}>Prompt</Text>
                <Text style={styles.text}>{journal.prompt}</Text>
              </>
            )}

            <Text style={styles.section}>Transcript</Text>
            <Text style={styles.block}>{journal.transcript}</Text>

            <Text style={styles.section}>Summary</Text>
            <Text style={styles.text}>{journal.aiResponse.summary}</Text>

            {journal.aiResponse.selfInsight && (
              <View style={styles.blurSection}>
                <Text style={styles.section}>Insight</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.text}>{journal.aiResponse.selfInsight}</Text>
                  {!isSubscribed && (
                    <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                      <TouchableOpacity
                        style={styles.upgradeBlurButton}
                        onPress={() => navigateAndClose()}
                      >
                        <Text style={styles.upgradeBlurButtonText}>Upgrade</Text>
                      </TouchableOpacity>
                    </BlurView>
                  )}
                </View>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.moodBox}>
                <MaterialIcons name={mood.name as any} size={56} color={mood.color} />
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Word Count</Text>
                <Text style={styles.statValue}>{wordCount}</Text>
              </View>
            </View>

            <View style={styles.feelingsRow}>
              {journal.aiResponse.feelings.map((f, i) => (
                <View
                  key={i}
                  style={[
                    styles.feelingTag,
                    { backgroundColor: ['#D7ECFF', '#E4D7FF', '#CDEBEA'][i % 3] },
                  ]}
                >
                  <Text style={styles.feelingText}>{f}</Text>
                </View>
              ))}
            </View>

            {journal.aiResponse.thoughtPattern && (
              <View style={styles.blurSection}>
                <Text style={styles.section}>Thought Pattern</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.text}>{journal.aiResponse.thoughtPattern}</Text>
                  {!isSubscribed && (
                    <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                      <TouchableOpacity
                        style={styles.upgradeBlurButton}
                        onPress={() => navigateAndClose()}
                      >
                        <Text style={styles.upgradeBlurButtonText}>Upgrade</Text>
                      </TouchableOpacity>
                    </BlurView>
                  )}
                </View>
              </View>
            )}

            <Text style={styles.section}>Next Step</Text>
            <Text style={styles.text}>{journal.aiResponse.nextStep}</Text>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - 24,
    maxHeight: height - 80,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    fontFamily: 'SpaceMono',
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  section: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
    fontFamily: 'SpaceMono',
    color: '#222',
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    fontFamily: 'SpaceMono',
    marginBottom: 15,
  },
  block: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'SpaceMono',
    backgroundColor: '#F2F2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  blurSection: {
    position: 'relative',
    marginBottom: 15,
  },
  insightContent: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(155, 203, 255, 0.6)',
  },
  blurOverlayInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(155, 203, 255, 0.1)',
  },
  upgradeBlurButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBlurButtonText: {
    backgroundColor: colors.blue,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  moodBox: {
    width: 130,
    height: 150,
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  statBox: {
    height: 150,
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'SpaceMono',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'SpaceMono',
  },
  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  feelingTag: {
    paddingVertical: 6,
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  feelingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'SpaceMono',
  },
});

export default JournalModal;
