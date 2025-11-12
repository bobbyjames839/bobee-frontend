import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '~/constants/Colors'

interface SignUpStep6AgeProps {
  age: string
  onAgeChange: (age: string) => void
  onNext: () => void
  onBack: () => void
}

const ageRanges = [
  { id: '18-24', label: '18-24' },
  { id: '25-34', label: '25-34' },
  { id: '35-44', label: '35-44' },
  { id: '45-54', label: '45-54' },
  { id: '55-64', label: '55-64' },
  { id: '65+', label: '65+' },
]

export default function SignUpStep6Age({ age, onAgeChange, onNext, onBack }: SignUpStep6AgeProps) {
  const isDisabled = !age

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>What's your age?</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience</Text>

        <View style={styles.optionsContainer}>
          {ageRanges.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                age === option.id && styles.optionButtonSelected,
              ]}
              onPress={() => onAgeChange(option.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  age === option.id && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.light,
    backgroundColor: 'white',
    marginBottom: 12,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.lightestblue,
  },
  optionText: {
    fontSize: 18,
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
