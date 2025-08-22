import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { prompts } from '~/utils/journalPrompts';
import { auth } from '~/utils/firebase';
import { useJournalRefresh } from '~/context/JournalRefreshContext';
import { Animated, Easing, Platform } from 'react-native';
import Constants from 'expo-constants';

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
  newFacts: string[]
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
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [secondSubscribeLoading, setSecondSubscribeLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successBannerVisible, setSuccessBannerVisible] = useState(false);
  const clearSuccessBanner = () => setSuccessBannerVisible(false);
  const { triggerRefresh } = useJournalRefresh();
  const router = useRouter();
  const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl as string;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // ...existing code...

  //pulse on the mic
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
  const resetState = () => {
    stopPulse();
    stopTimer();
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

  //start recording
  const startRecording = async () => {
    try {
      runIdRef.current += 1;
      const thisRunId = runIdRef.current;

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) throw new Error('Permission denied');
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
  const stopRecording = async () => {
    stopTimer();
    stopPulse();
    setIsRecording(false);
    setLoading(true);
    setLoadingStage(1);

    if (timer < 2) {
      await safeStopAndClearRecording();
      setLoading(false);
      setError('Journal length not valid');
      setTimer(0);
      return;
    }

    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const idToken = await user.getIdToken();

    //check if the user has not gone over their daily limit
    try {
      setLoadingStage(1); // Checking voice usage
      const voiceUsagePromise = fetch(`${BACKEND_URL}/api/check-voice-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ secondsUsed: timer }),
      });

      const [voiceUsageResponse] = await Promise.all([voiceUsagePromise, delay(1000)]);
      
      if (!voiceUsageResponse.ok) {
        await safeStopAndClearRecording();
        setLoading(false);
        setError('You have hit your daily limit, please come back tomorrow');
        setTimer(0);
        return;
      }

    } catch (e) {
      await safeStopAndClearRecording();
      console.error('Voice-usage check failed', e);
      setError('Network error. Please try again.');
      setLoading(false);
      setTimer(0);
      return;
    }

    const thisRunId = runIdRef.current;
    try {
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
      if (thisRunId !== runIdRef.current) return;
      if (!localUri) throw new Error('No recording URI found.');

      //transcribing the audio
      setLoadingStage(2); // Transcribing journal
      const form = new FormData();
      const uriField =
        Platform.OS === 'ios' && !localUri.startsWith('file://')
          ? `file://${localUri}`
          : localUri;

      const ext = uriField.split('.').pop()?.toLowerCase() || 'webm';
      const mimeType =
        ext === 'm4a' ? 'audio/mp4' :
        ext === 'caf' ? 'audio/x-caf' :
        ext === 'wav' ? 'audio/wav' :
        'audio/webm';

      form.append('audio', { uri: uriField, name: `recording.${ext}`, type: mimeType } as any);

      const transResp = await fetch(`${BACKEND_URL}/api/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: form,
      });

      if (!transResp.ok) {
        const err = await transResp.json().catch(() => ({}));
        throw new Error(err.error || `Transcription failed (${transResp.status})`);
      }
      const { text } = await transResp.json();
      if (thisRunId !== runIdRef.current) return;
      setTranscript(text);


      setLoadingStage(3);
      // Inline the logic for word count and streak
      {
        const user = auth.currentUser;
        let stats = null;
        if (user) {
          const idToken = await user.getIdToken();
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
              stats = {
                wordCount: data.wordCount,
                currentStreak: data.currentStreak,
              };
            }
          } catch (err) {
            console.error('updateWordCountAndStreak error:', err);
          }
        }
        await delay(1000);
        if (stats) {
          setWordCount(stats.wordCount);
          setCurrentStreak(stats.currentStreak);
        }
      }

      //Load personality scores or set defaults
      try {
        setLoadingStage(4); // Getting personality metrics
        const personalityPromise = fetch(`${BACKEND_URL}/api/get-personality-scores`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const [personalityResponse] = await Promise.all([personalityPromise, delay(1000)]);
        if (!personalityResponse.ok) throw new Error('Failed to load personality');
        const { personality } = (await personalityResponse.json()) as { personality: PersonalityScores };
        setPreviousPersonality(personality);
      } catch (err: any) {
        console.error('Error loading personality:', err);
        if (thisRunId === runIdRef.current) {
          setError('Failed to load personality scores. Please try again.');
          setLoading(false);
          setLoadingStage(0);
          setTimer(0);
        }
        return;
      }


      // 2. Call AI with transcript, prompt, and personality

      setLoadingStage(5); // Getting AI response
      const aiPromise = fetch(`${BACKEND_URL}/api/journal-response`, {
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
      }).then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (err.error === 'Invalid journal entry') {
            throw new Error('InvalidJournal');
          }
          throw new Error(err.error || `AI response failed (${res.status})`);
        }
        return res.json();
      }).then(data => {
        if (data.error) {
          if (data.error === 'Invalid journal entry') {
            throw new Error('InvalidJournal');
          }
          throw new Error(data.error);
        }
  return data.aiResponse;
      });

      setTimeout(() => {
        if (thisRunId === runIdRef.current) {
          setLoadingStage(6); // Final loading stage
        }
      }, 2000);

      try {
        const aiRes = await aiPromise;
        if (thisRunId !== runIdRef.current) return;
        setAiResponse(aiRes);
        // If you need to use the deltas, access aiRes.personalityDeltas
        router.push('/journal/response');
        setTimeout(() => {
          setLoading(false);
          setLoadingStage(0);
        }, 1000);
      } catch (aiErr: any) {
        if (aiErr.message === 'InvalidJournal') {
          await safeStopAndClearRecording();
          resetState();
          setPrompt('');
          setError('Journal entry not detailed enough.');
          setTimer(0);
          return;
        }
        console.error('getAIResponse error:', aiErr);
        if (thisRunId === runIdRef.current) {
          await safeStopAndClearRecording();
          setLoading(false);
          setLoadingStage(0);
          setPrompt('');
          setError('Failed to get AI response.');
          setTimer(0);
        }
      }
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

  //submit the journal recording
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
      
      triggerRefresh();
      setAiResponse(null);
      setPrompt('');
      setSuccessBannerVisible(true);
      setTimer(0);
    } catch (e) {
      console.error('Submission error:', e);
      setError('Failed to submit journal.');
    }
  };

  //toggle the recording, ie when we click the mic
  const toggleRecording = () => {
    if (loading || aiResponse) return;
    isRecording ? stopRecording() : startRecording();
  };

  const generatePrompt = () => {
    const list = prompts.default || [];
    const random = list[Math.floor(Math.random() * list.length)];
    setPrompt(random);
  };

  const clearPrompt = () => {
    setPrompt('')
  }

  async function handleUpgrade() {
    setSubscribeLoading(true);
    try {
      // reuse the submit logic
      await doSubmitJournal();
      router.back();
      router.push('/settings/sub');
    } finally {
      setSubscribeLoading(false);
    }
  }

  async function handleUpgradeTwo() {
    setSecondSubscribeLoading(true);
    try {
      // reuse the submit logic
      await doSubmitJournal();
      router.back();
      router.push('/settings/sub');
    } finally {
      setSecondSubscribeLoading(false);
    }
  }

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
    generatePrompt,
    clearPrompt,
    handleSubmitJournal,
    wordCount, 
    currentStreak,
    handleUpgrade,
    handleUpgradeTwo,
    subscribeLoading, 
    secondSubscribeLoading,
    submitLoading,
    clearError,
    successBannerVisible,
    clearSuccessBanner,
    resetState
  };
}