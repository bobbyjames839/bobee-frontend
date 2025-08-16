import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JournalMic from '~/components/journal/JournalMic';
import JournalPrompt from '~/components/journal/JournalPrompt';
import JournalResponse from '~/components/journal/JournalResponse';
import JournalLoading from '~/components/journal/JournalLoading';
import ErrorBanner from '~/components/banners/ErrorBanner';
import SuccessBanner from '~/components/banners/SuccessBanner';
import { useJournalRecording } from '~/hooks/useJournals';
import { colors } from '~/constants/Colors';
import WelcomeBanner from '~/components/banners/Welcome';

export default function Journal() {
  const journal = useJournalRecording();
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const val = await AsyncStorage.getItem('showWelcomeOnce');
        if (val === '1') {
          setWelcomeVisible(true);
          await AsyncStorage.removeItem('showWelcomeOnce'); 
        }
      } catch (_) {
      }
    };
    checkWelcome();
  }, []);

  return (
    <>
      {journal.error && (
        <ErrorBanner message={journal.error} onHide={journal.clearError} />
      )}
      {journal.successBannerVisible && (
        <SuccessBanner message="Journal submitted" onHide={journal.clearSuccessBanner} />
      )}

      <WelcomeBanner
        visible={welcomeVisible}
        onClose={() => setWelcomeVisible(false)}
      />

      <View style={styles.containerBase}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill]}
        >
          <LinearGradient
            colors={['rgba(188, 198, 255, 1)', colors.lightest]}
            locations={[0, .5]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.containerPadding}>

          {journal.aiResponse ? (
            <JournalResponse
              aiResponse={journal.aiResponse}
              onUpgrade={journal.handleUpgrade}
              onUpgradeTwo={journal.handleUpgradeTwo}
              subscribeLoading={journal.subscribeLoading}
              secondSubscribeLoading={journal.secondSubscribeLoading}
              onSubmit={journal.handleSubmitJournal}
              submitLoading={journal.submitLoading}
              wordCount={journal.wordCount}
              currentStreak={journal.currentStreak}
            />
          ) : (
            <>
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
            </>
          )}
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
  errorText: {
    color: '#D33',
    textAlign: 'center',
    marginTop: 36,
    fontFamily: 'SpaceMono',
  },
});
