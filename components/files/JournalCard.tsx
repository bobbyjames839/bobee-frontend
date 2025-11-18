import { TouchableOpacity, View, Text, StyleSheet, Image, Animated } from 'react-native';
import { JournalEntry } from '~/hooks/useFiles';
import { colors } from '~/constants/Colors';
import Svg, { Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  entry: JournalEntry;
  onPress: () => void;
  onLongPressDelete?: () => void;
}

const formatDate = (ts: Date | { toDate: () => Date }) =>
  (ts instanceof Date ? ts : ts.toDate()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const FACE_VERY_SAD        = require('~/assets/images/verysad.png');
const FACE_SAD             = require('~/assets/images/sad.png');
const FACE_NEUTRAL         = require('~/assets/images/mid.png');
const FACE_SLIGHTLY_HAPPY  = require('~/assets/images/happy.png');
const FACE_VERY_HAPPY      = require('~/assets/images/veryhappy.png');

function pickFace(score: number) {
  if (score <= 2) return FACE_VERY_SAD;
  if (score <= 4) return FACE_SAD;
  if (score <= 6) return FACE_NEUTRAL;
  if (score <= 8) return FACE_SLIGHTLY_HAPPY;
  return FACE_VERY_HAPPY;
}

const JournalCard: React.FC<Props> = ({ entry, onPress, onLongPressDelete }) => {
  const faceSource = pickFace(entry.aiResponse.moodScore);

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onLongPress={onLongPressDelete}
      delayLongPress={1000}
      activeOpacity={0.6}
    >
        <View style={styles.card}>
          {/* Decorative left background "span" with a slanted right edge */}
          <Svg
            pointerEvents="none"
            style={styles.bgSpan}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id={`bgGrad-${entry.id}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.blue} stopOpacity={0.07} />
                <Stop offset="1" stopColor={colors.blue} stopOpacity={0.03} />
              </LinearGradient>
            </Defs>
            {/* shape: full height, right edge slanted */}
            <Polygon points="0,0 100,0 85,100 0,100" fill={`url(#bgGrad-${entry.id})`} />
          </Svg>

          <Image
            source={faceSource}
            style={[styles.moodIcon, styles.moodIconImage]}
            accessible
            accessibilityLabel="Mood"
          />

          <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
          <Text style={styles.text} numberOfLines={2}>
            {entry.transcript}
          </Text>
        </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden', 
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    height: 95,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lighter,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  // background "span" on the left with slanted right edge
  bgSpan: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '55%',
    zIndex: 0,
  },
  moodIcon: {
    position: 'absolute',
    top: 3,
    right: 3,
    zIndex: 1,
  },
  moodIconImage: {
    width: 50,
    height: 50,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  date: {
    fontSize: 13,
    color: colors.dark,
    marginBottom: 8,
    fontFamily: 'SpaceMonoSemibold',
    zIndex: 1,
  },
  text: {
    fontSize: 16,
    color: colors.darkest,
    lineHeight: 22,
    fontFamily: 'SpaceMono',
    paddingRight: 56,
    zIndex: 1,
  },
});

export default JournalCard;
