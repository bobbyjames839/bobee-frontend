import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '~/constants/Colors';
import { AudioLines, SendHorizonal } from 'lucide-react-native';

interface JournalMicProps {
  isRecording: boolean;
  loading: boolean;
  timer: number;
  onToggle: () => void;
}

export default function JournalMic({
  isRecording,
  loading,
  timer,
  onToggle, 
}: JournalMicProps) {
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      <TouchableOpacity onPress={onToggle} disabled={loading} activeOpacity={0.9}>
          <LinearGradient
            colors={['#ded0ff', '#f1f1f1']}
            locations={[0, 0.6]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.micCircle}
          >
            {isRecording ? 
            <SendHorizonal size={42} color={colors.blue} />
            :
            <AudioLines size={42} color={colors.blue} />
            }
          </LinearGradient>
      </TouchableOpacity>

      {isRecording && <Text style={styles.timer}>{formatTime(timer)}</Text>}
      {!isRecording && !loading && <Text style={styles.hint}>TAP TO START</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  micShadowWrapper: {
    borderRadius: 999,
  },
  micCircle: {
    borderRadius: 999,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timer: {
    textAlign: 'center',
    fontSize: 17,
    letterSpacing: 1.2,
    position: 'absolute',
    bottom: -40,
    color: colors.blue,
    fontFamily: 'SpaceMonoSemibold',
  },
  hint: {
    textAlign: 'center',
    position: 'absolute',
    bottom: -40,
    fontSize: 14,
    color: colors.lightestblue,
    fontFamily: 'SpaceMonoSemibold',
  },
});
