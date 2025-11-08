import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '~/constants/Colors'

interface SignUpStep3GenderProps {
  gender: string
  onGenderChange: (gender: string) => void
  onNext: () => void
  onBack: () => void
}

export default function SignUpStep3Gender({ gender, onGenderChange, onNext, onBack }: SignUpStep3GenderProps) {
  const isDisabled = !gender

  const genderOptions = [
    { value: 'male', label: 'Male', emoji: '♂️' },
    { value: 'female', label: 'Female', emoji: '♀️' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>3 of 5</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>How do you identify?</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience</Text>

        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                gender === option.value && styles.optionButtonSelected
              ]}
              onPress={() => onGenderChange(option.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={[
                styles.optionText,
                gender === option.value && styles.optionTextSelected
              ]}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.blue,
    fontFamily: 'SpaceMono',
  },
  stepIndicator: {
    fontSize: 14,
    color: colors.dark,
    fontFamily: 'SpaceMono',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'SpaceMono',
    color: colors.darkest,
  },
  subtitle: {
    fontSize: 16,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'SpaceMono',
  },
  optionsContainer: {
    marginBottom: 40,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.light,
    backgroundColor: 'white',
  },
  optionButtonSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.lightestblue,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    fontSize: 18,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
  },
  optionTextSelected: {
    color: colors.blue,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.blue,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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