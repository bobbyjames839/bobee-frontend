import React, { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet, Dimensions, View } from 'react-native'
import { CheckCircle } from 'lucide-react-native'

interface Props {
  message: string
  onHide: () => void
}

export default function SuccessBanner({ message, onHide }: Props) {
  const slideY = useRef(new Animated.Value(-100)).current
  const { width } = Dimensions.get('window')

  useEffect(() => {
    if (!message) return
    Animated.sequence([
      Animated.timing(slideY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(slideY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(onHide)
  }, [message])

  if (!message) return null

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideY }], width },
      ]}
    >
      <View style={styles.content}>
        <CheckCircle size={24} color="#ffffff" style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#10b981',
    paddingBottom: 15,
    paddingTop: 60,
    paddingHorizontal: 16,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    fontWeight: '500',
  },
})
