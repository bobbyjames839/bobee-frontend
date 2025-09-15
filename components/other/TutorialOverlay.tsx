import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '~/constants/Colors';

interface TutorialOverlayProps {
  step: number; // 1-5
  total: number;
  title: string;
  description: string;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
}

export default function TutorialOverlay({ step, total, title, description, onNext, onSkip, nextLabel }: TutorialOverlayProps) {
  return (
    <View style={styles.overlay} pointerEvents='box-none'>
      <View style={styles.card}>
        <Text style={styles.step}>{`Step ${step} of ${total}`}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.nextText}>{nextLabel || (step === total ? 'Finish' : 'Next')}</Text>
        </TouchableOpacity>

        {onSkip && step < total && (
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip tutorial</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 999 },
  card: { width: '100%', backgroundColor: 'white', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: colors.lighter, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  step: { fontSize: 13, color: colors.blue, fontFamily: 'SpaceMono', marginBottom: 6 },
  title: { fontSize: 22, fontFamily: 'SpaceMono', fontWeight: '600', color: colors.darkest, marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 22, fontFamily: 'SpaceMono', color: colors.darkest, marginBottom: 20 },
  nextBtn: { backgroundColor: colors.blue, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  nextText: { color: 'white', fontSize: 17, fontFamily: 'SpaceMono', fontWeight: '600' },
  skipBtn: { marginTop: 16, alignSelf: 'center' },
  skipText: { color: colors.dark, textDecorationLine: 'underline', fontFamily: 'SpaceMono' },
});
