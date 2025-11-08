import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import JournalMic from '~/components/journal/JournalMic';
import JournalPrompt from '~/components/journal/JournalPrompt';
import JournalLoading from '~/components/journal/JournalLoading';
import ErrorBanner from '~/components/banners/ErrorBanner';
import SuccessBanner from '~/components/banners/SuccessBanner';
import TutorialOverlay from '~/components/other/TutorialOverlay';
import { useJournalContext } from '~/context/JournalContext';
import { colors } from '~/constants/Colors';
import Header from '~/components/other/Header';
import { auth } from '~/utils/firebase';

export default function Journal() {
  const journal = useJournalContext();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Check if we should show welcome banner
    const checkWelcome = async () => {
      try {
        const shouldShow = await AsyncStorage.getItem('showWelcomeOnce');
        if (shouldShow === '1') {
          const displayName = auth.currentUser?.displayName || auth.currentUser?.email || 'User';
          setWelcomeMessage(`Signed in as ${displayName}`);
          await AsyncStorage.removeItem('showWelcomeOnce');
        }
      } catch (error) {
        console.error('Error checking welcome banner:', error);
      }
    };

    checkWelcome();
  }, []);

  useEffect(() => {
    // show tutorial overlay only if ?tour=1 is present in URL
    setShowTutorial(tour === '1');
  }, [tour]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      {journal.error && (
        <ErrorBanner message={journal.error} onHide={journal.clearError} />
      )}

      {welcomeMessage && (
        <SuccessBanner
          message={welcomeMessage}
          onHide={() => setWelcomeMessage('')}
        />
      )}

      {journal.successBannerVisible && (
        <SuccessBanner
          message="Journal saved successfully."
          onHide={journal.clearSuccessBanner}
        />
      )}

      <View style={styles.containerBase}>
        <Header title="Journal" />

        <View style={styles.containerPadding}>
          <JournalPrompt prompt={journal.prompt} loading={journal.loading} />

          <View style={styles.centerContent}>
            <JournalMic
              onClearPrompt={journal.clearPrompt}
              isRecording={journal.isRecording}
              onGenerate={journal.generatePrompt}
              prompt={journal.prompt}
              loading={journal.loading}
              timer={journal.timer}
              onToggle={journal.toggleRecording}
              pulseAnim={journal.pulseAnim}
            />

            <JournalLoading
              loading={journal.loading}
              loadingStage={journal.loadingStage}
            />
          </View>
        </View>
      </View>
      {showTutorial && (
        <TutorialOverlay
          step={1}
          total={5}
          title="Journal your thoughts"
          description="Tap the mic to start speaking. This daily habit powers your insights and Bobee's suggestions."
          onNext={() => {
            setShowTutorial(false);
            router.push('/files?tour=2');
          }}
          onSkip={() => {
            setShowTutorial(false);
          }}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  containerBase: { flex: 1, backgroundColor: colors.lightest },
  containerPadding: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  centerContent: {
    position: 'absolute',
    top: 0,
    marginTop: '50%',
    transform: [{ translateY: '-50%' }],
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
});
