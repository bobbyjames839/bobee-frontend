import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import JournalMic from '~/components/journal/JournalMic';
import JournalPrompt from '~/components/journal/JournalPrompt';
import JournalLoading from '~/components/journal/JournalLoading';
import ErrorBanner from '~/components/banners/ErrorBanner';
import SuccessBanner from '~/components/banners/SuccessBanner';
import WelcomeBanner from '~/components/banners/Welcome';
import TutorialOverlay from '~/components/other/TutorialOverlay';
import { useJournalContext } from '~/context/JournalContext';
import { colors } from '~/constants/Colors';
import Header from '~/components/other/Header';

export default function Journal() {
  const journal = useJournalContext();
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const router = useRouter();

  useEffect(() => {
    // show tutorial overlay only if ?tour=1 is present in URL
    setShowTutorial(tour === '1');
  }, [tour]);

  return (
    <>
      {journal.error && (
        <ErrorBanner message={journal.error} onHide={journal.clearError} />
      )}

      <WelcomeBanner
        visible={welcomeVisible}
        onClose={() => setWelcomeVisible(false)}
      />

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
          total={4}
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
    </>
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
