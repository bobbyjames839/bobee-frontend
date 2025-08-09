import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors } from '~/constants/Colors';

export default function How() {
  const openLink = () => {
    Linking.openURL('https://example.com');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.box}>
        <Text style={styles.boxText}>
          Welcome to Bobee, your AI-powered journaling companion. To get started,
          simply tap the microphone icon and speak your thoughts aloud—Bobee will
          capture and transcribe your entries in real time. Once you’ve recorded,
          feel free to ask Bobee any follow-up questions for deeper insights into
          your mood and patterns. When you’re ready, visit the Insights tab to
          explore visual metrics—including emotion trends, word clouds, and
          daily streaks—that help you understand your personal growth journey.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={openLink}>
        <Text style={styles.buttonText}>Learn More</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  box: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 8,
    padding: 16,
    marginBottom: 15,
    width: '100%',
  },
  boxText: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    lineHeight: 24,
    color: colors.darkest,
  },
  button: {
    backgroundColor: colors.blue,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: 'white',
  },
});
