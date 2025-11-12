import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '~/constants/Colors'

interface SignUpStep8JournalLevelProps {
  journalLevel: string
  onJournalLevelChange: (level: string) => void
  onNext: () => void
  onBack: () => void
}

const journalLevels = [
  { id: 'beginner', label: 'Beginner', emoji: '🌱', description: 'New to journaling' },
  { id: 'intermediate', label: 'Intermediate', emoji: '📝', description: 'Journal occasionally' },
  { id: 'advanced', label: 'Advanced', emoji: '✍️', description: 'Regular journaler' },
  { id: 'expert', label: 'Expert', emoji: '📚', description: 'Journal daily' },
]

export default function SignUpStep8JournalLevel({ journalLevel, onJournalLevelChange, onNext, onBack }: SignUpStep8JournalLevelProps) {
  const isDisabled = !journalLevel

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>What's your journaling level?</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience</Text>

        <View style={styles.optionsContainer}>
          {journalLevels.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                journalLevel === option.id && styles.optionButtonSelected,
              ]}
              onPress={() => onJournalLevelChange(option.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.optionText,
                    journalLevel === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    journalLevel === option.id && styles.optionDescriptionSelected,
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
          onPress={onNext}
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
