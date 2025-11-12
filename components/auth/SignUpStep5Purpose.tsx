import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { colors } from '~/constants/Colors'

interface SignUpStep5PurposeProps {
  purpose: string
  onPurposeChange: (purpose: string) => void
  onNext: () => void
  onBack: () => void
}

const purposes = [
  { id: 'mental-health', label: 'Mental Health & Wellbeing', emoji: '🧠' },
  { id: 'self-reflection', label: 'Self-Reflection & Growth', emoji: '🌱' },
  { id: 'stress-relief', label: 'Stress Relief & Relaxation', emoji: '😌' },
  { id: 'track-mood', label: 'Track Mood & Emotions', emoji: '📊' },
  { id: 'personal-development', label: 'Personal Development', emoji: '✨' },
  { id: 'gratitude', label: 'Gratitude Practice', emoji: '🙏' },
  { id: 'goal-setting', label: 'Goal Setting & Achievement', emoji: '🎯' },
  { id: 'therapy-support', label: 'Therapy Support', emoji: '💭' },
]

export default function SignUpStep5Purpose({ purpose, onPurposeChange, onNext, onBack }: SignUpStep5PurposeProps) {
  const isDisabled = !purpose

  return (
    <View style={styles.container}>
        <Text style={styles.title}>What brings you here?</Text>
        <Text style={styles.subtitle}>Help us understand how to best support you</Text>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.optionsContainer}>
          {purposes.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                purpose === option.id && styles.optionButtonSelected,
              ]}
              onPress={() => onPurposeChange(option.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text
                style={[
                  styles.optionText,
                  purpose === option.id && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={onNext}
        disabled={isDisabled}
        activeOpacity={0.85}
    >
        <Text style={styles.buttonText}>Continue</Text>
    </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.lightest,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    fontSize: 24,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.blue,
  },
  button: {
    backgroundColor: colors.blue,
    height: 60,
    borderRadius: 16,
    marginBottom: 32,
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
