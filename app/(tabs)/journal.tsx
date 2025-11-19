import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
  Image,
  Easing,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '~/constants/Colors';
import { auth } from '~/utils/firebase';
import { useFadeInAnimation } from '~/hooks/useFadeInAnimation';
import ErrorBanner from '~/components/banners/ErrorBanner';
import SuccessBanner from '~/components/banners/SuccessBanner';
import TutorialOverlay from '~/components/other/TutorialOverlay';
import { useJournalContext } from '~/context/JournalContext';
import { useQuote } from '~/context/QuoteContext';
import { useTabBar } from '~/context/TabBarContext';
import JournalMic from '~/components/journal/JournalMic';
import JournalLoading from '~/components/journal/JournalLoading';
import { Mic, Type, X, Shuffle, XCircle } from 'lucide-react-native';
import { prompts } from '~/utils/journalPrompts';

export default function JournalMain() {
  const router = useRouter();
  const journal = useJournalContext();
  const { quote, loading: quoteLoading } = useQuote();
  const { hideTabBar, showTabBar } = useTabBar();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [textEntry, setTextEntry] = useState('');
  const { tour } = useLocalSearchParams<{ tour?: string }>();
  const { fadeAnim, slideAnim } = useFadeInAnimation();

  // Animation refs for transitions
  const buttonsOpacity = useRef(new Animated.Value(1)).current;
  const quoteOpacity = useRef(new Animated.Value(1)).current;
  const titleTranslateY = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const voiceNoteTitleOpacity = useRef(new Animated.Value(0)).current;
  const voiceNoteTitleTranslateY = useRef(new Animated.Value(-50)).current;
  const promptOpacity = useRef(new Animated.Value(0)).current;
  const promptTranslateY = useRef(new Animated.Value(-20)).current;
  const closeButtonOpacity = useRef(new Animated.Value(0)).current;
  const listeningOpacity = useRef(new Animated.Value(0)).current;
  const micTranslateY = useRef(new Animated.Value(0)).current;
  const micOpacity = useRef(new Animated.Value(0)).current;
  const circleTranslateY = useRef(new Animated.Value(0)).current;

  // Pulsing circle animation behind the top image
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startPulse = () => {
      pulseAnim.setValue(0);
      Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ).start();
    };

    startPulse();
  }, [pulseAnim]);

  // Handle tab bar visibility with fling effect
  useEffect(() => {
    if (isRecordingMode) {
      hideTabBar();
    } else {
      showTabBar();
    }
  }, [isRecordingMode, hideTabBar, showTabBar]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const shouldShow = await AsyncStorage.getItem('showWelcomeOnce');
        if (shouldShow === '1') {
          const displayName =
            auth.currentUser?.displayName ||
            auth.currentUser?.email ||
            'User';
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
    setShowTutorial(tour === '1');
  }, [tour]);

  // Initialize with default prompt when entering recording mode
  useEffect(() => {
    if (isRecordingMode && !currentPrompt) {
      setCurrentPrompt('Whats on your mind?');
    }
  }, [isRecordingMode, currentPrompt]);

  const getRandomPrompt = () => {
    const defaultPrompts = prompts.default;
    const randomIndex = Math.floor(Math.random() * defaultPrompts.length);
    return defaultPrompts[randomIndex];
  };

  const handleShufflePrompt = () => {
    setCurrentPrompt(getRandomPrompt());
  };

  const handleStartVoiceNote = () => {
    setIsRecordingMode(true);
    setIsTextMode(false);
    
    // Animate transitions
    Animated.parallel([
      // Fade out buttons
      Animated.timing(buttonsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out quote
      Animated.timing(quoteOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Move title up and fade it
      Animated.timing(titleTranslateY, {
        toValue: -100,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(voiceNoteTitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(voiceNoteTitleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(promptOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(promptTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(closeButtonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(listeningOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(micOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(circleTranslateY, {
          toValue: 80,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleStartTextEntry = () => {
    setIsRecordingMode(true);
    setIsTextMode(true);
    
    // Same animations as voice mode
    Animated.parallel([
      Animated.timing(buttonsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(quoteOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: -100,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(voiceNoteTitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(voiceNoteTitleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(promptOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(promptTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(closeButtonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(listeningOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(micOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(circleTranslateY, {
          toValue: 80,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleClose = async () => {
    // Abort all recording actions
    await journal.resetState();
    
    // Reverse animations
    Animated.parallel([
      // Fade out voice note title
      Animated.timing(voiceNoteTitleOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(voiceNoteTitleTranslateY, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out prompt
      Animated.timing(promptOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(promptTranslateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out close button
      Animated.timing(closeButtonOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out listening text
      Animated.timing(listeningOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out mic
      Animated.timing(micOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Move circle back up
      Animated.timing(circleTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After fade out, bring back original title, buttons, and quote
      setIsRecordingMode(false);
      setIsTextMode(false);
      setTextEntry('');
      setCurrentPrompt(null);
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  return (
    <View style={{ flex: 1 }}>
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

      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <Image
            source={require('~/assets/images/happy.png')}
            style={styles.happyImage}
          />

          <Animated.View 
            style={[
              styles.shuffleButton,
              { opacity: closeButtonOpacity }
            ]}
          >
            <TouchableOpacity 
              onPress={handleShufflePrompt} 
              activeOpacity={0.7} 
              disabled={journal.loading || journal.isRecording}
              style={[styles.shuffleButtonTouchable, {opacity: journal.loading || journal.isRecording ? 0.3 : 1}]}
            >
              <Shuffle size={24} color={colors.dark} strokeWidth={2}  />
            </TouchableOpacity>
          </Animated.View>
        

        {/* Close button - appears in recording mode */}
        {isRecordingMode && (
          <Animated.View 
            style={[
              styles.closeButton,
              { opacity: closeButtonOpacity }
            ]}
          >
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.closeButtonTouchable}>
              <X size={24} color={colors.dark} strokeWidth={2} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Initial view - title and subtitle */}
        <Animated.View 
          style={[
            styles.titleContainer,
            { 
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }]
            }
          ]}
        >
          <Text style={styles.title}>Journal Diary</Text>
          <Text style={styles.subtitle}>Whats on your mind?</Text>
        </Animated.View>

        {/* Recording view - voice note title */}
        <Animated.View 
          style={[
            styles.voiceNoteTitleContainer,
            { 
              opacity: voiceNoteTitleOpacity,
              transform: [{ translateY: voiceNoteTitleTranslateY }]
            }
          ]}
        >
          <Text style={styles.voiceNoteTitle}>{isTextMode ? 'Text Entry' : 'Voice Note'}</Text>
        </Animated.View>

        {/* Recording view - prompt */}
        {currentPrompt && (
          <Animated.View 
            style={[
              styles.promptContainer,
              { 
                opacity: promptOpacity,
                transform: [{ translateY: promptTranslateY }]
              }
            ]}
          >
            <Text style={styles.promptText}>{currentPrompt}</Text>
          </Animated.View>
        )}

        {isRecordingMode && !journal.loading && (
        <Animated.View 
          style={[
            styles.listeningContainer,
            { opacity: listeningOpacity }
          ]}
        >
          {isTextMode ? (
            <TextInput
              style={styles.textInput}
              placeholder="Start typing your thoughts..."
              placeholderTextColor="#a1a1aa"
              multiline
              value={textEntry}
              onChangeText={setTextEntry}
              autoFocus
            />
          ) : (
            <Text style={styles.listeningText}>
              {journal.isRecording ? journal.transcript || 'I am listening...' : ''}
            </Text>
          )}
        </Animated.View>
        )}

        {/* Buttons - fade out when recording */}
        <Animated.View 
          style={[
            styles.buttonGroup,
            { opacity: buttonsOpacity }
          ]}
        >
          <TouchableOpacity
            style={styles.journalButton}
            onPress={handleStartVoiceNote}
            activeOpacity={0.85}
          >
            <Mic size={20} color="#fff" strokeWidth={2} style={styles.buttonIcon} />
            <Text style={styles.journalButtonText}>Voice Note</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.journalButton, styles.secondaryButton]}
            onPress={handleStartTextEntry}
            activeOpacity={0.85}
          >
            <Type
              size={20}
              color={colors.blue}
              strokeWidth={2}
              style={styles.buttonIcon}
            />
            <Text
              style={[
                styles.journalButtonText,
                styles.secondaryButtonText,
              ]}
            >
              Type Entry
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quote - fade out when recording */}
        {quote && !quoteLoading && (
          <Animated.View 
            style={[
              styles.quoteContainer,
              { opacity: quoteOpacity }
            ]}
          >
            <Text style={styles.quote}>"{quote.q}" — {quote.a}</Text>
          </Animated.View>
        )}

        <Animated.View 
          style={[
            styles.micContainer,
            { 
              opacity: micOpacity,
              transform: [{ translateY: micTranslateY }]
            }
          ]}
        >
          <JournalLoading
            loading={journal.loading}
            loadingStage={journal.loadingStage}
          />
          {!isTextMode ? (
            <JournalMic
              isRecording={journal.isRecording}
              loading={journal.loading}
              timer={journal.timer}
              onToggle={journal.toggleRecording}
            />
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, { opacity: textEntry.trim().length < 10 || journal.loading ? 0.6 : 1 }]}
              onPress={() => {
                if (textEntry.trim().length >= 10 && !journal.loading) {
                  journal.submitTextEntry(textEntry);
                }
              }}
              disabled={textEntry.trim().length < 10 || journal.loading}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          )}

        </Animated.View>

        {/* Big bottom circle background */}
        <Animated.View 
          style={[
            styles.bottomCircle,
            { transform: [{ translateX: '50%' }, { translateY: circleTranslateY }] }
          ]} 
        />
      </Animated.View>

      {showTutorial && (
        <TutorialOverlay
          step={1}
          total={5}
          title="Journal your thoughts"
          description="Tap a button to start journaling. This daily habit powers your insights and Bobee's suggestions."
          onNext={() => {
            setShowTutorial(false);
            router.push('/files?tour=2');
          }}
          onSkip={() => {
            setShowTutorial(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    top: 90,
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: '#e1deeeff',
  },
  happyImage: {
    position: 'absolute',
    top: 90,
    width: 80,
    height: 80,
    backgroundColor: '#e1deeeff',
    padding: 6,
    borderRadius: 40,
    zIndex: 2,
  },
  shuffleButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 100,
    padding: 8,
  },
  shuffleButtonTouchable: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 100,
    padding: 8,
  },
  closeButtonTouchable: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  titleContainer: {
    marginTop: '60%',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'SpaceMonoBold',
    fontSize: 46,
    color: colors.lightestblue,
  },
  subtitle: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 18,
    marginTop: -10,
    color: '#d7d3ebff',
    textAlign: 'center',
  },
  voiceNoteTitleContainer: {
    position: 'absolute',
    top: 195,
    alignItems: 'center',
    width: '100%',
  },
  voiceNoteTitle: {
    fontFamily: 'SpaceMonoBold',
    fontSize: 46,
    color: '#d7d3ebff',
    textAlign: 'center',
  },
  promptContainer: {
    position: 'absolute',
    top: 250,
    width: '85%',
    alignItems: 'center',
  },
  promptText: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 18,
    color: colors.lightestblue,
    textAlign: 'center',
  },
  listeningContainer: {
    width: '90%',
    flex: 1,
    marginBottom: 70,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeningText: {
    fontFamily: 'SpaceMono',
    fontSize: 17,
    color: colors.darkestblue,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    height: '100%',
    fontFamily: 'SpaceMono',
    fontSize: 17,
    color: colors.darkestblue,
    textAlignVertical: 'top',
    padding: 20,
  },
  buttonGroup: {
    marginTop: 40,
    width: '80%',
    zIndex: 10,
    justifyContent: 'space-around',
    gap: 16,
  },
  journalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightestblue,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  journalButtonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'SpaceMonoSemibold',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: colors.lightest,
    borderWidth: 1,
    borderColor: colors.lightestblue,
  },
  secondaryButtonText: {
    color: colors.blue,
  },
  micContainer: {
    position: 'absolute',
    bottom: 110,
    alignItems: 'center',
    zIndex: 10,
  },
  submitButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'SpaceMonoSemibold',
    letterSpacing: 0.5,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -600,
    width: 850,
    right: '50%',
    transform: [{ translateX: '50%' }],
    height: 850,
    borderRadius: 525,
    backgroundColor: '#e6e3f7ff',
  },
  quoteContainer: {
    position: 'absolute',
    bottom: 110,
    height: 100,
    justifyContent: 'center',
    zIndex: 10,
    right: '50%',
    transform: [{ translateX: '50%' }],
    width: '85%',
    alignItems: 'center',
  },
  quote: {
    textAlign: 'center',
    fontFamily: 'PoppinsItalic',
    fontSize: 14,
    color: '#827be7ff',
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 22,
  },
});
