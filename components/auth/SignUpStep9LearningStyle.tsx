import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '~/constants/Colors'
import * as Haptics from 'expo-haptics';

interface SignUpStep9LearningStyleProps {
  learningStyle: string
  onLearningStyleChange: (style: string) => void
  onNext: () => void
  onBack: () => void
}

const learningStyles = [
  { id: 'reading', label: 'Reading', emoji: '📖', description: 'I prefer text and articles' },
  { id: 'listening', label: 'Listening', emoji: '🎧', description: 'I prefer audio content' },
  { id: 'watching', label: 'Watching', emoji: '🎥', description: 'I prefer videos' },
  { id: 'interactive', label: 'Interactive', emoji: '🎮', description: 'I prefer hands-on exercises' },
]

export default function SignUpStep9LearningStyle({ learningStyle, onLearningStyleChange, onNext, onBack }: SignUpStep9LearningStyleProps) {
  const isDisabled = !learningStyle

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How do you prefer to learn?</Text>
        <Text style={styles.subtitle}>We'll tailor content to match your style</Text>

        <View style={styles.optionsContainer}>
          {learningStyles.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                learningStyle === option.id && styles.optionButtonSelected,
              ]}
              onPress={() => onLearningStyleChange(option.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.optionText,
                    learningStyle === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    learningStyle === option.id && styles.optionDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onNext();
          }}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.lightest,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'SpaceMonoSemibold',
    color: colors.darkest,
  },
  subtitle: {
    fontSize: 16,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'SpaceMono',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.light,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  optionButtonSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.lightestblue,
  },
  emoji: {
    fontSize: 28,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 18,
    fontFamily: 'SpaceMonoSemibold',
    color: colors.darkest,
    marginBottom: 2,
  },
  optionTextSelected: {
    color: colors.blue,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
    color: colors.dark,
  },
  optionDescriptionSelected: {
    color: colors.blue,
  },
  button: {
    backgroundColor: colors.blue,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
})
