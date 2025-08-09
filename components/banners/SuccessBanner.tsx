import React, { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet, Dimensions } from 'react-native'

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
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#2ECC71',
    paddingBottom: 15,
    paddingTop: 60,
    paddingHorizontal: 10,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
})
