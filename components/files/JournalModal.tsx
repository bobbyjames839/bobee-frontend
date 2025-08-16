import React, { useState, useEffect, useContext } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setConfirmDelete(false);
      setDeleteLoading(false);
      setUpgradeLoading(false);
    }
  }, [visible]);

  const handleDeletePress = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
    } else {
      setDeleteLoading(true);
      onDelete();
    }
  };

  const navigateAndClose = () => {
    setUpgradeLoading(true);
    router.push("/(tabs)/settings/sub");
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={handleDeletePress} disabled={deleteLoading}>
              {deleteLoading ? (
                <ActivityIndicator size="small" color="#B22222" />
              ) : (
                <MaterialIcons
                  name={confirmDelete ? 'check' : 'delete-outline'}
                  size={28}
                  color="#B22222"
                />
              )}
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
                <View style={isSubscribed ? styles.insightContent : styles.insightContentPadded}>
                  <Text style={styles.text}>{journal.aiResponse.selfInsight}</Text>
                  {!isSubscribed && (
                    <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                      <TouchableOpacity
                        onPress={navigateAndClose}
                        disabled={upgradeLoading}
                      >
                        <View style={styles.upgradeBlurButtonContent}>
                          {upgradeLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.upgradeBlurButtonText}>
                              Upgrade
                            </Text>
                          )}
                        </View>
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
                    { borderColor: ['#abcdebff', '#bda7eaff', '#9edddbff'][i % 3] }
                  ]}
                >
                  <Text style={styles.feelingText}>{f}</Text>
                </View>
              ))}
            </View>

            {journal.aiResponse.thoughtPattern && (
              <View style={styles.blurSection}>
                <Text style={styles.section}>Thought Pattern</Text>
                <View style={isSubscribed ? styles.insightContent : styles.insightContentPadded}>
                  <Text style={styles.text}>{journal.aiResponse.thoughtPattern}</Text>
                  {!isSubscribed && (
                    <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                      <TouchableOpacity
                        onPress={navigateAndClose}
                        disabled={upgradeLoading}
                      >
                        <View style={styles.upgradeBlurButtonContent}>
                          {upgradeLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.upgradeBlurButtonText}>
                              Upgrade
                            </Text>
                          )}
                        </View>
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
    marginTop: 90,
    marginBottom: 60,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    borderWidth: 1, 
    borderColor: colors.lighter
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
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    marginBottom: 6,
    color: colors.blue,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    fontFamily: 'SpaceMono',
  },
  block: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    fontFamily: 'SpaceMono',
    backgroundColor: '#F2F2F2',
    padding: 12,
    borderRadius: 8,
  },
  blurSection: {
    position: 'relative',
  },
  insightContentPadded: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(173, 209, 246, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  insightContent: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  blurOverlayInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(155, 203, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBlurButtonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blue,
    width: 160,
    paddingVertical: 8,
    borderRadius: 6,
  },
  upgradeBlurButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  moodBox: {
    paddingHorizontal: 40,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.lighter,
    shadowOffset: {height: 0, width: 0},
    elevation: 0
  },
  statBox: {
    height: 120,
    flex: 1,
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.lighter,
    shadowOffset: {height: 0, width: 0},
    elevation: 0
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'SpaceMono',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'SpaceMono',
  },
  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10
  },
  feelingTag: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  feelingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'SpaceMono',
  },
});

export default JournalModal;
