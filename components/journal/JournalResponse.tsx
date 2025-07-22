import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SubscriptionContext } from '~/context/SubscriptionContext';
import { colors } from '~/constants/Colors';
import { router } from 'expo-router';

type AIResponse = {
  moodScore:      number;
  summary:        string;
  selfInsight:   string;
  thoughtPattern:string;
  nextStep:       string;
  feelings:       string[];
};

interface JournalResponseProps {
  aiResponse:       AIResponse;
  subscribeLoading: boolean;
  secondSubscribeLoading: boolean;
  onSubmit:         () => Promise<void>;
  submitLoading:    boolean;
  wordCount:        number | null;
  currentStreak:    number | null;
}

const moodIcon = (
  score: number
): { name: keyof typeof MaterialIcons.glyphMap; color: string } => {
  if (score <= 3) return { name: 'sentiment-very-dissatisfied', color: '#E74C3C' };
  if (score <= 6) return { name: 'sentiment-neutral',        color: '#F1C40F' };
  return               { name: 'sentiment-very-satisfied', color: '#2ECC71' };
};

const feelingColors = ['#B3DFFC', '#D1C4E9', '#B2DFDB'];
const feelingColor = (i: number) => feelingColors[i % feelingColors.length];

export default function JournalResponse({
  aiResponse,
  subscribeLoading,
  secondSubscribeLoading,
  onSubmit,
  submitLoading,
  wordCount,
  currentStreak,
}: JournalResponseProps) {
  const { isSubscribed } = useContext(SubscriptionContext);
  const mood = moodIcon(aiResponse.moodScore);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.responseBox}>

      <View style={styles.cornerBadgeContainer}>
        <View
          style={[
            styles.cornerBadgeTriangle,
            {
              backgroundColor: isSubscribed ? colors.blue : colors.light,
            },
          ]}
        />
        <Text style={styles.cornerBadgeText}>
          {isSubscribed ? 'Pro' : 'Free'}
        </Text>
      </View>

        <Text style={styles.sectionTitleTop}>Summary</Text>
        <Text style={styles.responseText}>{aiResponse.summary}</Text>

        {aiResponse.selfInsight && (
          <View style={styles.blurSection}>
            <Text style={styles.sectionTitle}>Insight</Text>
            <View style={styles.insightContent}>
              <Text style={styles.responseText}>{aiResponse.selfInsight}</Text>
              {!isSubscribed && (
                <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                  <TouchableOpacity
                    style={[subscribeLoading && { opacity: 0.6 }, styles.upgradeBlurButton]}
                    onPress={() => router.push('/(tabs)/settings/sub')}
                    disabled={subscribeLoading}
                  >
                    {subscribeLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.upgradeBlurButtonText}>
                        Upgrade
                      </Text>
                    )}
                  </TouchableOpacity>
                </BlurView>
              )}
            </View>
          </View>
        )}

        <View style={styles.moodRowContainer}>
          <View style={styles.moodBox}>
            <MaterialIcons name={mood.name} size={104} color={mood.color} />
          </View>
          <View style={styles.rightBoxesContainer}>
            <View style={[styles.statBox, styles.statBoxTop]}>
              <Text style={styles.statLabel}>Word Count</Text>
              <Text style={styles.statValue}>{wordCount ?? 0}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxBottom]}>
              <Text style={styles.statLabel}>Current Streak</Text>
              <Text style={styles.statValue}>
                {currentStreak ?? 0} day{(currentStreak ?? 0) !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Feelings chips */}
        <View style={styles.feelingsRow}>
          {aiResponse.feelings.map((word, i) => (
            <View
            key={`${word}-${i}`}
            style={[styles.feelingBox, { backgroundColor: feelingColor(i) }]}
            >
              <Text style={styles.feelingText}>{word}</Text>
            </View>
          ))}
        </View>
        
          {aiResponse.thoughtPattern && (
            <View style={styles.blurSection}>
              <Text style={styles.sectionTitle}>Thought Pattern</Text>
              <View style={styles.insightContent}>
                <Text style={styles.responseText}>{aiResponse.thoughtPattern}</Text>
                {!isSubscribed && (
                  <BlurView intensity={12} tint="light" style={styles.blurOverlayInner}>
                    <TouchableOpacity
                      style={[secondSubscribeLoading && { opacity: 0.6 }, styles.upgradeBlurButton]}
                      onPress={() => router.push('/(tabs)/settings/sub')}
                      disabled={secondSubscribeLoading}
                      
                    >
                      {secondSubscribeLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.upgradeBlurButtonText}>
                          Upgrade
                        </Text>
                      )}
                    </TouchableOpacity>
                  </BlurView>
                )}
              </View>
            </View>
          )}

        {/* Next step */}
        <Text style={styles.sectionTitle}>Next Step</Text>
        <Text style={styles.responseText}>{aiResponse.nextStep}</Text>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitLoading && { opacity: 0.6 },
          ]}
          onPress={onSubmit}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Journal</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 20,
    marginTop: 60,
  },
  responseBox: {
    backgroundColor: '#FAFAFA',
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
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
  sectionTitleTop: {
    marginTop: 5,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
    marginBottom: 6,
    color: colors.blue,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 4,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'SpaceMono',
    color: '#444',
  },
  blurSection: {
    position: 'relative',
  },
  insightContent: {
    position: 'relative',
    marginBottom: 16,
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
    top: 0, left: 0, right: 0, bottom: 0,
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
  moodRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  moodBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rightBoxesContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statBoxTop: {
    marginBottom: 4,
  },
  statBoxBottom: {
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  feelingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  feelingBox: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feelingText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 32,
    backgroundColor: colors.blue,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  cornerBadgeContainer: {
    zIndex: 1000,
    position: 'absolute',
    top: 0,
    right: 0,
    width: 84,
    height: 84,
    overflow: 'hidden',
    borderTopRightRadius: 16,
  },
  cornerBadgeTriangle: {
    borderTopRightRadius: 16,
    position: 'absolute',
    width: 120,
    height: 120,
    top: -60,
    right: -60,
    transform: [{ rotate: '-45deg' }],
  },
  cornerBadgeText: {
    position: 'absolute',
    top: 15,
    right: 15,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    transform: [{ rotate: '45deg' }],
    fontWeight: '700',
  },
});

