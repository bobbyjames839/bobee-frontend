// app/index.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '~/constants/Colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topRightCircle} />
      <View style={styles.topLeftCircle} />
      <View style={styles.bottomLeftCircle} />

      <Text style={styles.title}>Bobee</Text>
      <Text style={styles.subtitle}>Your AI journaling assistant</Text>

      <TouchableOpacity
        style={[styles.commonButton, styles.primaryButton]}
        onPress={() => router.replace('/sign-in')}
      >
        <Text style={styles.primaryButtonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.commonButton, styles.secondaryButton]}
        onPress={() => router.replace('/sign-up')}
      >
        <Text style={styles.secondaryButtonText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'SpaceMono',
    marginBottom: 40,
    textAlign: 'center',
  },
  commonButton: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.blue,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.blue,
    backgroundColor: 'transparent',
  },

  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  secondaryButtonText: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
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
});
