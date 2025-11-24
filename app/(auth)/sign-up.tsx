import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { router } from 'expo-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '~/utils/firebase'
import { colors } from '~/constants/Colors'
import SignUpStep1Name from '~/components/auth/SignUpStep1Name'
import SignUpStep2Email from '~/components/auth/SignUpStep2Email'
import SignUpStep3Gender from '~/components/auth/SignUpStep3Gender'
import SignUpStep4Password from '~/components/auth/SignUpStep4Password'
import SignUpStep5Purpose from '~/components/auth/SignUpStep5Purpose'
import SignUpStep6Age from '~/components/auth/SignUpStep6Age'
import SignUpStep7Personalizing from '~/components/auth/SignUpStep7Personalizing'
import SignUpStep8JournalLevel from '~/components/auth/SignUpStep8JournalLevel'
import SignUpStep9LearningStyle from '~/components/auth/SignUpStep9LearningStyle'
import SignUpStep10FreeTrial from '~/components/auth/SignUpStep5FreeTrial'
import ErrorBanner from '~/components/banners/ErrorBanner'
import Constants from 'expo-constants'

const API_URL = Constants.expoConfig?.extra?.backendUrl as string

export default function SignUpScreen() {
  const [currentStep, setCurrentStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [purpose, setPurpose] = useState('')
  const [age, setAge] = useState('')
  const [journalLevel, setJournalLevel] = useState('')
  const [learningStyle, setLearningStyle] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const fadeAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value((1 / 9) * 100)).current
  const slideAnim = useRef(new Animated.Value(0)).current

  // Animate progress bar when step changes
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep / 9) * 100,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start()
  }, [currentStep])

  const handleNext = () => {
    // Slide current component out to the right
    Animated.timing(slideAnim, {
      toValue: -400, // Slide far enough to be off screen
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Change to next step
      setCurrentStep(prev => prev + 1)
      // Position new component off-screen to the left
      slideAnim.setValue(400)
      // Slide new component in from the left
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start()
    })
  }

  const handleBack = () => {
    if (currentStep === 1) {
      router.replace('/')
    } else {
      // Slide current component out to the left
      Animated.timing(slideAnim, {
        toValue: 400, // Slide far enough to be off screen
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Change to previous step
        setCurrentStep(prev => prev - 1)
        // Position new component off-screen to the right
        slideAnim.setValue(-400)
        // Slide new component in from the right
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start()
      })
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
        router.push('/tutorial')
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
            onError={setErrorMessage}
          />
        )
      case 2:
        return (
          <SignUpStep6Age
            age={age}
            onAgeChange={setAge}
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
          <SignUpStep5Purpose
            purpose={purpose}
            onPurposeChange={setPurpose}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 5:
        return (
          <SignUpStep8JournalLevel
            journalLevel={journalLevel}
            onJournalLevelChange={setJournalLevel}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 6:
        return (
          <SignUpStep9LearningStyle
            learningStyle={learningStyle}
            onLearningStyleChange={setLearningStyle}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 7:
        return (
          <SignUpStep2Email
            email={email}
            onEmailChange={setEmail}
            onNext={handleNext}
            onBack={handleBack}
            onError={setErrorMessage}
          />
        )
      case 8:
        return (
          <SignUpStep4Password
            password={password}
            onPasswordChange={setPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onNext={handleNext}
            onError={setErrorMessage}
          />
        )
      case 9:
        return (
          <SignUpStep7Personalizing
            onComplete={handleNext}
          />
        )
      case 10:
        return (
          <SignUpStep10FreeTrial
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
      {/* Error Banner - Always at the top */}
      <ErrorBanner message={errorMessage} onHide={() => setErrorMessage('')} />
      
      {currentStep === 10 && (
        <>
          <View style={styles.topRightCircle} />
          <View style={styles.topLeftCircle} />
          <View style={styles.bottomLeftCircle} />
        </>
      )}
      
      {/* Back Button */}
      {currentStep < 10 && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Animated Progress Bar */}
      {currentStep < 10 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBackground}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  })
                }
              ]} 
            />
          </View>
        </View>
      )}
      
      {/* Animated Page Container */}
      <Animated.View 
        style={[
          styles.pageContainer,
          {
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        {renderCurrentStep()}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: colors.blue,
    fontFamily: 'SpaceMono',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 24,
  },
  progressBackground: {
    height: 6,
    backgroundColor: colors.light,
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: 2,
  },
  pageContainer: {
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
})
