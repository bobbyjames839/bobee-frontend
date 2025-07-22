// app/(tabs)/settings/terms.tsx
import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { colors } from '~/constants/Colors';

export default function Terms() {
  const openTerms = () => {
    // TODO: replace with your actual Terms & Conditions URL
    Linking.openURL('https://example.com/terms');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.box}>
        <Text style={styles.boxText}>
          By using Bobee, you agree to engage responsibly. You will not misuse
          the service or attempt to reverse-engineer the AI models. All voice
          data is processed securely and locally before syncing to our encrypted
          servers. We may update these terms periodically; continued use implies
          acceptance of any changes.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={openTerms}>
        <Text style={styles.buttonText}>Read Full Terms & Conditions</Text>
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
