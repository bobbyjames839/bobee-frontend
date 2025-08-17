// app/(tabs)/journal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JournalMic from '~/components/journal/JournalMic';
import JournalPrompt from '~/components/journal/JournalPrompt';
import JournalLoading from '~/components/journal/JournalLoading';
import ErrorBanner from '~/components/banners/ErrorBanner';
import SuccessBanner from '~/components/banners/SuccessBanner';
import WelcomeBanner from '~/components/banners/Welcome';
import { useJournalRecording } from '~/hooks/useJournals';
import { useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';

export default function Journal() {
  const router = useRouter();
  const journal = useJournalRecording();
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const val = await AsyncStorage.getItem('showWelcomeOnce');
        if (val === '1') {
          setWelcomeVisible(true);
          await AsyncStorage.removeItem('showWelcomeOnce');
        }
      } catch {}
    };
    checkWelcome();
  }, []);

  // When we get an AI response, navigate to the modal and pass the data (URL-safe JSON)
  useEffect(() => {
    if (journal.aiResponse && !navigatedRef.current) {
      const payloadObj = {
        aiResponse: journal.aiResponse,
        wordCount: journal.wordCount,
        currentStreak: journal.currentStreak,
      };
      const payload = encodeURIComponent(JSON.stringify(payloadObj));

      navigatedRef.current = true;
      router.push({ pathname: '/journal/response', params: { payload } });
    }
    if (!journal.aiResponse) {
      navigatedRef.current = false;
    }
  }, [journal.aiResponse, journal.wordCount, journal.currentStreak, router]);

  return (
    <>
      {journal.error && (
        <ErrorBanner message={journal.error} onHide={journal.clearError} />
      )}
      {journal.successBannerVisible && (
        <SuccessBanner message="Journal submitted" onHide={journal.clearSuccessBanner} />
      )}
      <WelcomeBanner visible={welcomeVisible} onClose={() => setWelcomeVisible(false)} />

      <View style={styles.containerBase}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill]}>
          <LinearGradient
            colors={['rgba(188, 198, 255, 1)', colors.lightest]}
            locations={[0, 0.5]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.containerPadding}>
          {/* Response now lives in app/(modals)/journal/response.tsx */}
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
            <JournalLoading loading={journal.loading} loadingStage={journal.loadingStage} />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  containerBase: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  containerPadding: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  centerContent: {
    position: 'absolute',
    top: 300,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
