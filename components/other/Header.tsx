import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '~/constants/Colors'
import type { ComponentProps } from 'react'

type IoniconName = ComponentProps<typeof Ionicons>['name']

interface HeaderProps {
  title?: string
  leftIcon?: IoniconName
  onLeftPress?: () => void
  secondLeftIcon?: IoniconName
  onSecondLeftPress?: () => void
  rightIcon?: IoniconName
  onRightPress?: () => void
}

export default function Header({
  title = 'Insights',
  leftIcon,
  onLeftPress,
  secondLeftIcon,
  onSecondLeftPress,
  rightIcon,
  onRightPress,
}: HeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.blue} />
      <View style={styles.headerContainer}>
        <View style={styles.leftIcons}>
          {secondLeftIcon && onSecondLeftPress && (
            <TouchableOpacity
              onPress={onSecondLeftPress}
              style={styles.iconButton}
            >
              <Ionicons name={secondLeftIcon} size={24} color="#fff" />
            </TouchableOpacity>
          )}
          {leftIcon && onLeftPress && (
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.iconButton}
            >
              <Ionicons name={leftIcon} size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.headerText}>{title}</Text>

        {rightIcon && onRightPress && (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.rightIcon}
          >
            <Ionicons name={rightIcon} size={24} color={colors.blue} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.blue,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 9,
    justifyContent: 'center', 
    height: 37,
    marginTop: -3,
  },
  leftIcons: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 2,
  },
  rightIcon: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 30,
    right: 10,
    bottom: 8,
    padding: 3,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    letterSpacing: .5,
    fontFamily: 'SpaceMonoSemibold',
  },
})
