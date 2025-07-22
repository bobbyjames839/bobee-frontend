// app/(tabs)/settings/privacy.tsx
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

export default function Privacy() {
  const openPrivacy = () => {
    // TODO: replace with your actual Privacy Statement URL
    Linking.openURL('https://example.com/privacy');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.box}>
        <Text style={styles.boxText}>
          We take your privacy seriously. Your voice recordings are encrypted
          end-to-end and stored securely. We never sell or share your personal
          data with third parties. You retain full control: you can request
          deletion of your account and all associated data at any time.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={openPrivacy}>
        <Text style={styles.buttonText}>Read Full Privacy Statement</Text>
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
