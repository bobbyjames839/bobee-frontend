import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import JournalMic from '~/components/journal/JournalMic';
import JournalPrompt from '~/components/journal/JournalPrompt';
import JournalLoading from '~/components/journal/JournalLoading';
import ErrorBanner from '~/components/banners/ErrorBanner';
import SuccessBanner from '~/components/banners/SuccessBanner';
import WelcomeBanner from '~/components/banners/Welcome';
import { useJournalContext } from '~/context/JournalContext';
import { colors } from '~/constants/Colors';
import Header from '~/components/other/Header';

export default function Journal() {
  const journal = useJournalContext();
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const checkFlags = async () => {
        try {
          const welcome = await AsyncStorage.getItem('showWelcomeOnce');

          if (!isActive) return;

          if (welcome === '1') {
            setWelcomeVisible(true);
            await AsyncStorage.removeItem('showWelcomeOnce');
          }
        } catch {
          // ignore
        }
      };

      checkFlags();

      return () => {
        isActive = false;
      };
    }, [])
  );

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
    </>
  );
}

const styles = StyleSheet.create({
  containerBase: { flex: 1, backgroundColor: colors.lightest },
  containerPadding: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  centerContent: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: '-50%' }],
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
