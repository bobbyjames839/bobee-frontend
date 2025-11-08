import React, { useState, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { router } from 'expo-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '~/utils/firebase'
import { colors } from '~/constants/Colors'
import SignUpStep1Name from '~/components/auth/SignUpStep1Name'
import SignUpStep2Email from '~/components/auth/SignUpStep2Email'
import SignUpStep3Gender from '~/components/auth/SignUpStep3Gender'
import SignUpStep4Password from '~/components/auth/SignUpStep4Password'
import SignUpStep5FreeTrial from '~/components/auth/SignUpStep5FreeTrial'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = Constants.expoConfig?.extra?.backendUrl as string

export default function SignUpScreen() {
  const [currentStep, setCurrentStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const handleNext = () => {
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    if (currentStep === 1) {
      router.replace('/sign-in')
    } else {
      setCurrentStep(prev => prev - 1)
    }
  }


  const createAccount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          password,
          gender
        }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: '' }))
        throw new Error(msg || `Signup failed (${res.status})`)
      }

      await signInWithEmailAndPassword(auth, email.trim(), password)
      await AsyncStorage.setItem('showWelcomeOnce', '1')
      return true
    } catch (err: any) {
      console.error('Account creation error:', err)
      throw err
    }
  }

  const handleStartTrial = async () => {
    try {
      await createAccount()
      
      // Fade out before navigation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/journal')
      });
    } catch (err: any) {
      console.error('Failed to create account:', err)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SignUpStep1Name
            name={name}
            onNameChange={setName}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 2:
        return (
          <SignUpStep2Email
            email={email}
            onEmailChange={setEmail}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 3:
        return (
          <SignUpStep3Gender
            gender={gender}
            onGenderChange={setGender}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 4:
        return (
          <SignUpStep4Password
            name={name}
            email={email}
            gender={gender}
            password={password}
            onPasswordChange={setPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            accepted={accepted}
            onAcceptedChange={setAccepted}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 5:
        return (
          <SignUpStep5FreeTrial
            onStartTrial={handleStartTrial}
            onBack={handleBack}
          />
        )
      default:
        return null
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {currentStep < 5 && (
        <>
          <View style={styles.topRightCircle} />
          <View style={styles.topLeftCircle} />
          <View style={styles.bottomLeftCircle} />
        </>
      )}
      
      {renderCurrentStep()}
      
      {currentStep === 1 && (
        <TouchableOpacity onPress={() => router.replace('/sign-in')} style={styles.signInLink}>
          <Text style={styles.signInText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  topRightCircle: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: colors.lightestblue,
    top: -160,
    right: -160,
  },
  topLeftCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.blue,
    top: -160,
    left: -60,
  },
  bottomLeftCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.lightestblue,
    bottom: -100,
    left: -100,
  },
  signInLink: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    padding: 8,
  },
  signInText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.darkest,
    fontFamily: 'SpaceMono',
  },
})
