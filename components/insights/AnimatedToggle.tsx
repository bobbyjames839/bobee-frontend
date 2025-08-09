import React, { useEffect, useRef } from 'react'
import { Animated, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import { colors } from '~/constants/Colors'

const INACTIVE_WIDTH = 48
const ACTIVE_WIDTH = 80
const BUTTON_HEIGHT = 32

export default function AnimatedToggle({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  const widthAnim = useRef(
    new Animated.Value(active ? ACTIVE_WIDTH : INACTIVE_WIDTH)
  ).current

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: active ? ACTIVE_WIDTH : INACTIVE_WIDTH,
      duration: 200,
      useNativeDriver: false, 
    }).start()
  }, [active, widthAnim])

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={[
          styles.toggleButton,
          active && styles.toggleButtonActive,
          { width: widthAnim, height: BUTTON_HEIGHT },
        ]}
      >
        <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  toggleButton: {
    backgroundColor: colors.light,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  toggleButtonActive: {
    backgroundColor: colors.blue,
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  toggleTextActive: {
    fontWeight: '600',
  },
})
