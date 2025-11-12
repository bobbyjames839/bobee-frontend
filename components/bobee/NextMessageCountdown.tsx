import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';
import Svg, { Circle, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

export interface NextMessageCountdownProps {
  lastMessageAt?: number | null;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const NextMessageCountdown: React.FC<NextMessageCountdownProps> = ({
  lastMessageAt,
}) => {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<number | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const last = typeof lastMessageAt === 'number' ? lastMessageAt : 0;
  const elapsed = now - last;
  const remaining = Math.max(COOLDOWN_MS - elapsed, 0);
  const canRequest = remaining === 0;
  const progress = Math.min(elapsed / COOLDOWN_MS, 1);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000) as unknown as number;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  function formatRemaining(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  const content = canRequest ? 'Ready now' : formatRemaining(remaining);
  const Container: React.ComponentType<any> = canRequest ? Pressable : View;

  // Circular progress metrics
  const SIZE = 84;
  const R = 33;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  async function handlePress() {
    if (!canRequest) return;
    router.push('/bobee/personal-message');
  }

  return (
    <View style={styles.containerOuter}>
      <Container
        accessibilityRole={canRequest ? 'button' : undefined}
        onPress={canRequest ? handlePress : undefined}
        style={styles.containerPressable}
      >
        <View style={styles.pill}>
          {/* Decorative left background span */}
          <Svg
            pointerEvents="none"
            style={styles.bgSpan}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.blue} stopOpacity={0.09} />
                <Stop offset="1" stopColor={colors.blue} stopOpacity={0.04} />
              </LinearGradient>
            </Defs>
            <Polygon points="0,0 100,0 85,100 0,100" fill="url(#bgGrad)" />
          </Svg>

          {/* Left icon + progress */}
          <View style={styles.leftIconWrap}>
            <Svg width={SIZE} height={SIZE}>
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                stroke={colors.lighter}
                strokeWidth={7}
                fill="none"
              />
              <AnimatedCircle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                stroke={colors.blue}
                strokeWidth={7}
                fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset as unknown as number}
                strokeLinecap="round"
              />
            </Svg>
            <Image
              source={require('~/assets/images/happy.png')}
              style={styles.botIcon}
              accessibilityLabel="Personal message icon"
            />
          </View>

          {/* Text column */}
          {canRequest ? (
            <View style={styles.readyContent}>
              <View style={styles.readyContentTop}>
                <Text style={styles.readyTitle} numberOfLines={1} ellipsizeMode="clip">
                  PERSONAL MESSAGE
                </Text>
                <Text style={styles.personalArrow}>→</Text>
              </View>
              <Text
                style={styles.readyNote}
                numberOfLines={2}         // allow up to two lines
                ellipsizeMode="tail"
              >
                Tap to open your new message
              </Text>
            </View>
          ) : (
            <View style={styles.rightText}>
              <Text style={styles.readyTitle} numberOfLines={1} ellipsizeMode="clip">
                NEXT MESSAGE
              </Text>
              <Text style={styles.bigTime} numberOfLines={1} ellipsizeMode="tail">
                {content}
              </Text>
            </View>
          )}
        </View>
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  // Match reflection pill width and alignment
  containerOuter: {
    width: '85%',
    alignSelf: 'flex-end',
  },
  containerPressable: {
    alignSelf: 'stretch',
  },

  pill: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.lighter,
    borderBottomLeftRadius: 50,
    borderTopLeftRadius: 50,
    width: '100%',           // fill the 85% container
  },

  bgSpan: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '65%',
    zIndex: 0,
  },

  leftIconWrap: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    zIndex: 1,
  },
  botIcon: {
    position: 'absolute',
    width: 50,
    height: 50,
    resizeMode: 'contain',
    borderRadius: 50,
  },

  rightText: {
    flex: 1,       
    minWidth: 0,      
    zIndex: 1,
  },
  bigTime: {
    color: colors.darkest,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    marginTop: 5,
    fontWeight: '700',
  },

  readyContent: {
    flex: 1,       
    minWidth: 0,      
    justifyContent: 'center',
    zIndex: 1,

  },
  readyContentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  readyTitle: {
    color: colors.darkest,
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 18,
    marginRight: 8,
  },
  readyNote: {
    marginTop: 5,
    color: colors.dark,
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 20,
    alignSelf: 'stretch',
  },
  personalArrow: {
    fontSize: 24,
    color: colors.dark,
    marginLeft: 14,
    fontFamily: 'SpaceMono',
  },
});

export default NextMessageCountdown;
