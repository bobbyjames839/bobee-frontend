import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { prompts } from '~/utils/journalPrompts';
import { auth } from '~/utils/firebase';
import { useJournalRefresh } from '~/context/JournalRefreshContext';
import { Animated, Easing, Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule
} from 'expo-speech-recognition';
import * as Haptics from 'expo-haptics';

const PERSONALITY_KEYS = [
  'resilience',
  'discipline',
  'focus',
  'selfWorth',
  'confidence',
  'clarity',
] as const; 

type PersonalityScores = Record<typeof PERSONALITY_KEYS[number], number>;

type AIResponse = {
  summary:    string
  moodScore:  number
  nextStep:   string
  feelings:   string[]
  topic:      string
  personalityDeltas: PersonalityScores
  selfInsight: string
  thoughtPattern: string
}

export function useJournalRecording() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runIdRef = useRef<number>(0);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [previousPersonality, setPreviousPersonality] = useState<PersonalityScores | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [timer, setTimer] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [transcript, setTranscript] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successBannerVisible, setSuccessBannerVisible] = useState(false);
  const clearSuccessBanner = () => setSuccessBannerVisible(false);
  const { triggerRefresh } = useJournalRefresh();
  const router = useRouter();
  const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl as string;

  // Real-time speech recognition event handler
  useSpeechRecognitionEvent('result', (event) => {
    const transcribedText = event.results[0]?.transcript || '';
    setTranscript(transcribedText);
  });

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  //stops the pulse on the mic
  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  //start the timer
  const startTimer = () => {
    intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
  };

  //stop the timer
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  //reset all the states when we stop recording
  const resetState = async () => {
    stopPulse();
    stopTimer();
    
    // Stop speech recognition if running
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      // Ignore if not running
    }
    
    // Properly clean up recording if it exists
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {
        console.warn('Error stopping recording during reset:', e);
      }
      recordingRef.current = null;
    }
    
    setIsRecording(false);
    setTimer(0);
    setPrompt('');
    setTranscript('');
    setAiResponse(null);
    setLoading(false);
    setLoadingStage(0);
    setError(null);
    setSubmissionConfirmed(false);
  };

  //reset everything when we go off and then back on the page
  useFocusEffect(
    useCallback(() => {
      runIdRef.current += 1;
      return () => {
        runIdRef.current += 1;
        resetState();
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(() => {});
          recordingRef.current = null;
        }
      };
    }, [])
  );

  //start recording with real-time speech recognition
  const startRecording = async () => {
    try {
      runIdRef.current += 1;
      const thisRunId = runIdRef.current;

      // Request permissions
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) throw new Error('Permission denied');

      // Also start audio recording for backup/submission
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) throw new Error('Audio permission denied');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;

      if (thisRunId !== runIdRef.current) {
        try { await recording.stopAndUnloadAsync(); } catch {}
        return;
      }

      // Start speech recognition for real-time transcription
      try {
        await ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          maxAlternatives: 1,
          continuous: true,
          requiresOnDeviceRecognition: false,
          addsPunctuation: true,
          contextualStrings: [],
          ...(Platform.OS === 'android' && {
            androidIntentOptions: {
              EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
              EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 2000,
            },
            androidRecognitionServicePackage: 'com.google.android.googlequicksearchbox',
          }),
        });
      } catch (err) {
        console.error('Speech recognition start failed', err);
        // Fallback: continue with just audio recording instead of crashing
      }

      setIsRecording(true);
      setAiResponse(null);
      setSubmissionConfirmed(false);
      setTranscript('');
      startTimer();
      startPulse();
    } catch (err) {
      console.error(err);
      setError('Failed to start recording.');
    }
  };

  //helper to stop the recording
  const safeStopAndClearRecording = async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    try { await rec.stopAndUnloadAsync(); } catch {}
    recordingRef.current = null;
  };

  //stops the recording and gets AI response
const stopRecording = async (istext: boolean) => {
  stopTimer();
  stopPulse();
  setIsRecording(false);
  setLoading(true);
  setLoadingStage(1);

  if (!istext) {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      console.warn('Error stopping speech recognition:', err);
    }
  
  
    if (timer < 2) {
      await safeStopAndClearRecording();
      setLoading(false);
      setError('Journal length not valid');
      setTimer(0);
      return;
    }
  }

  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();

  const thisRunId = runIdRef.current;

  try {

    if (!istext) {
      const recording = recordingRef.current;
      if (!recording) {
        if (thisRunId === runIdRef.current) {
          setLoading(false);
          setLoadingStage(0);
          setTimer(0);
        }
        return;
      }

      await recording.stopAndUnloadAsync();
      const localUri = recording.getURI();
      recordingRef.current = null;

      if (!localUri) throw new Error('No recording URI found.');
      if (thisRunId !== runIdRef.current) return;
    }


    const text = transcript;
    if (!text) throw new Error('No transcript available');

    try {
      const resp = await fetch(`${BACKEND_URL}/api/get-word-count-and-streak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          journal: text,
          userId: user.uid,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setWordCount(data.wordCount);
        setCurrentStreak(data.currentStreak);
      }
    } catch (err) {
      console.error('updateWordCountAndStreak error:', err);
    }

    if (thisRunId !== runIdRef.current) return;

    //
    // 4. LOAD PERSONALITY
    //
    try {
      const res = await fetch(`${BACKEND_URL}/api/get-personality-scores`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) throw new Error('Failed to load personality');

      const { personality } = await res.json();
      setPreviousPersonality(personality);
    } catch (err) {
      console.error('Error loading personality:', err);
      if (thisRunId === runIdRef.current) {
        setError('Failed to load personality scores. Please try again.');
        setLoading(false);
        setLoadingStage(0);
        setTimer(0);
      }
      return;
    }


    let currentStage = 2;
    setLoadingStage(1); // ensure still stage 1 before start animation

    const stageInterval = setInterval(() => {
      if (currentStage <= 6) {
        setLoadingStage(currentStage);
        currentStage++;
      }
    }, 1200);

    let aiResponse = null;

    try {
      const res = await fetch(`${BACKEND_URL}/api/journal-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          journal: text,
          prompt: prompt || '',
          personality: previousPersonality,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === 'Invalid journal entry') throw new Error('InvalidJournal');
        throw new Error(err.error || 'AI response failed');
      }

      const data = await res.json();
      if (data.error) {
        if (data.error === 'Invalid journal entry') throw new Error('InvalidJournal');
        throw new Error(data.error);
      }

      aiResponse = data.aiResponse;
      
      if (data.generatedPrompt) {
        setPrompt(data.generatedPrompt);
      }

    } catch (err: any) {
      clearInterval(stageInterval);
      if (err.message === 'InvalidJournal') {
        await safeStopAndClearRecording();
        resetState();
        setPrompt('');
        setError('Journal entry not detailed enough.');
        setTimer(0);
        return;
      }

      console.error('AI error:', err);
      if (thisRunId === runIdRef.current) {
        await safeStopAndClearRecording();
        setLoading(false);
        setLoadingStage(0);
        setPrompt('');
        setError('Failed to get AI response.');
        setTimer(0);
      }
      return;
    }

    // AI FINISHED → stop staging animation
    clearInterval(stageInterval);
    if (thisRunId !== runIdRef.current) return;

    setAiResponse(aiResponse);
    router.push('/journal/response');

    setTimeout(() => {
      setLoading(false);
    }, 2000);

  } catch (err: any) {
    await safeStopAndClearRecording();
    console.error(err);

    if (thisRunId === runIdRef.current) {
      setError(err.message || 'Recording/transcription failed.');
      setLoading(false);
      setLoadingStage(0);
      setTimer(0);
    }
  }
};

  const doSubmitJournal = async () => {
    const user = auth.currentUser;
    if (!user || !aiResponse || !transcript) {
      setError('Missing data or not authenticated.');
      return;
    }

    try {
      const payload = {
        userId: user.uid,
        transcript,
        prompt,
        aiResponse,
        timerSeconds: timer,     
      };

      const res = await fetch(`${BACKEND_URL}/api/submit-journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to submit journal.');
        return;
      }
      
      // Trigger backend-powered profile fact generation (decoupled from initial AI journal response)
      try {
        const u = auth.currentUser;
        if (u) {
          const idToken = await u.getIdToken();
          await fetch(`${BACKEND_URL}/api/generate-profile-facts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ transcript, prompt }),
          });
        }
      } catch (pfErr) {
        console.warn('generate-profile-facts failed (non-blocking):', pfErr);
      }

      triggerRefresh();
      setAiResponse(null);
      setPrompt('');
      setSuccessBannerVisible(true);
      setTimer(0);
      setTranscript('');
    } catch (e) {
      console.error('Submission error:', e);
      setError('Failed to submit journal.');
    }
  };

  //toggle the recording, ie when we click the mic
  const toggleRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (loading || aiResponse) return;
    isRecording ? stopRecording(false) : startRecording();
  };




  async function handleSubmitJournal() {
    setSubmitLoading(true);
    try {
      await doSubmitJournal();
      router.back();
    } catch (e) {
      console.error(e);
      setError('Failed to submit journal.');
    } finally {
      setSubmitLoading(false);
    }
  }

  return {
    isRecording,
    loading,
    loadingStage,
    timer,
    prompt,
    transcript,
    aiResponse,
    error,
    submissionConfirmed,
    pulseAnim,
    formatTime,
    toggleRecording,
    handleSubmitJournal,
    wordCount, 
    currentStreak,
    setPrompt,
    submitLoading,
    clearError,
    successBannerVisible,
    clearSuccessBanner,
    resetState,
    stopRecording,
    setTranscript
  };
}