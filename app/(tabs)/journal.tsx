import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, Text } from 'react-native';
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
  const fullscreenAnim = useRef(new Animated.Value(0)).current;
  const isFullscreen = journal.isRecording || journal.loading;

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

  // Fullscreen animation when recording or loading
  useEffect(() => {
    Animated.timing(fullscreenAnim, {
      toValue: isFullscreen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isFullscreen, fullscreenAnim]);

  const handleCancel = () => {
    journal.resetState();
  };

  useEffect(() => {
    // show tutorial overlay only if ?tour=1 is present in URL
    setShowTutorial(tour === '1');
  }, [tour]);

  const headerOpacity = fullscreenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

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
        <Animated.View style={{ opacity: headerOpacity }}>
          <Header title="Journal" />
        </Animated.View>

        <Animated.View
          style={[
            styles.containerPadding,
            {
              transform: [
                {
                  translateY: fullscreenAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -60],
                  }),
                },
              ],
            },
          ]}
        >
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
        </Animated.View>

        {isFullscreen && (
          <Animated.View
            style={[
              styles.cancelButtonContainer,
              {
                opacity: fullscreenAnim,
                transform: [
                  {
                    translateY: fullscreenAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
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
    marginTop: '53%',
    transform: [{ translateY: '-50%' }],
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  cancelButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  cancelButton: {
    backgroundColor: colors.darkestblue,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMonoSemibold',
    letterSpacing: 0.5,
  },
});
