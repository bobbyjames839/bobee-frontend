import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '~/constants/Colors'
import type { ComponentProps } from 'react'

type IoniconName = ComponentProps<typeof Ionicons>['name']

interface HeaderProps {
  title?: string
  leftIcon?: IoniconName
  onLeftPress?: () => void
}

export default function Header({
  title = 'Insights',
  leftIcon,
  onLeftPress,
}: HeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.blue} />
      <View style={styles.headerContainer}>
        {leftIcon && onLeftPress && (
          <TouchableOpacity
            onPress={onLeftPress}
            style={styles.iconButton}
          >
            <Ionicons name={leftIcon} size={24} color="#fff" />
          </TouchableOpacity>
        )}

        <Text style={styles.headerText}>{title}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.blue,
  },
  headerContainer: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    position: 'absolute',
    left: 0,
    top: '36%',
    transform: [{ translateY: -12 }],
    padding: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
})
