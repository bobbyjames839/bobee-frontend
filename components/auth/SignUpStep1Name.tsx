import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from '~/constants/Colors'

interface SignUpStep1NameProps {
  name: string
  onNameChange: (name: string) => void
  onNext: () => void
  onBack: () => void
}

export default function SignUpStep1Name({ name, onNameChange, onNext, onBack }: SignUpStep1NameProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const isDisabled = !name.trim()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>1 of 5</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What's your name?</Text>
        <Text style={styles.subtitle}>We'd love to know what to call you</Text>

        <BlurView 
          tint='light' 
          intensity={50} 
          style={[styles.blurInput, focusedField === 'name' && styles.blurInputFocused]}
        >
          <TextInput
            placeholder="Your name"
            placeholderTextColor='rgb(100, 100, 100)'
            style={styles.input}
            value={name}
            onChangeText={onNameChange}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
            textContentType="name"
            autoCorrect={false}
            autoFocus={true}
            returnKeyType="next"
            onSubmitEditing={() => {
              if (!isDisabled) onNext()
            }}
          />
        </BlurView>

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
  blurInput: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.light,
  },
  blurInputFocused: {
    borderColor: colors.blue,
  },
  input: {
    backgroundColor: 'transparent',
    padding: 20,
    fontSize: 18,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
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