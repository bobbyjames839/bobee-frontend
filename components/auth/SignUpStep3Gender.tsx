import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '~/constants/Colors'
import { GenderMale, GenderFemale, Question } from 'phosphor-react-native'
import * as Haptics from 'expo-haptics';


interface SignUpStep3GenderProps {
  gender: string
  onGenderChange: (gender: string) => void
  onNext: () => void
  onBack: () => void
}

type Option = {
  value: string
  label: string
  Icon: React.ComponentType<{ size?: number; color?: string; weight?: 'regular' | 'bold' | 'fill' | 'duotone' | 'light' | 'thin' }>
}

export default function SignUpStep3Gender({ gender, onGenderChange, onNext, onBack }: SignUpStep3GenderProps) {
  const isDisabled = !gender

  const genderOptions: Option[] = [
    { value: 'male', label: 'Male', Icon: GenderMale },
    { value: 'female', label: 'Female', Icon: GenderFemale },
    { value: 'prefer_not_to_say', label: 'Prefer not to say', Icon: Question },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How do you identify?</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience</Text>

        <View style={styles.optionsContainer}>
          {genderOptions.map(({ value, label, Icon }) => {
            const selected = gender === value
            return (
              <TouchableOpacity
                key={value}
                style={[styles.optionButton, selected && styles.optionButtonSelected]}
                onPress={() => onGenderChange(value)}
                activeOpacity={0.8}
              >
                <Icon size={28} color={colors.darkest} />
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            )
          })}
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
    paddingBottom: 100,
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
    gap: 16,
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
