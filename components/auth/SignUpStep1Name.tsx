import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { colors } from '~/constants/Colors'

interface SignUpStep1NameProps {
  name: string
  onNameChange: (name: string) => void
  onNext: () => void
  onBack: () => void
  onError: (message: string) => void
}

export default function SignUpStep1Name({ name, onNameChange, onNext, onBack, onError }: SignUpStep1NameProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const isDisabled = !name.trim()

  const handleSubmit = () => {
    if (!name.trim()) {
      onError('Please enter your name')
      return
    }
    onNext()
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
            onSubmitEditing={handleSubmit}
          />
        </BlurView>

      </KeyboardAvoidingView>
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
  }
})