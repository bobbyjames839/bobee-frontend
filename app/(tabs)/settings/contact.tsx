import React from 'react';
import { ScrollView, View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { colors } from '~/constants/Colors';

export default function Contact() {
  const handleEmailPress = () => {
    Linking.openURL('mailto:privacy@bobee.app');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.box}>
        <Text style={styles.boxTitle}>Contact Bobee</Text>
        <Text style={styles.boxText}>
          <Text style={styles.sectionTitle}>Overview</Text>{"\n"}
          We’re here to help with any questions, feedback, or requests you have about Bobee. 
          Whether it’s a privacy query, a technical issue, or a suggestion for a new feature, 
          we’d love to hear from you.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Privacy & Data Requests</Text>{"\n"}
          For privacy-related requests, please include enough detail so we can identify your account 
          and respond quickly. We aim to reply to all emails within 2–3 business days.
          {"\n\n"}
          <Text style={styles.sectionTitle}>Email</Text>{"\n"}
          <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7}>
            <Text style={styles.linkText}>privacy@bobee.app</Text>
          </TouchableOpacity>
        </Text>
      </View>
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
    borderColor: colors.lighter,
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  boxTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 22,
    paddingBottom: 6,
    borderBottomColor: colors.lighter,
    borderBottomWidth: 1,
    color: colors.darkest,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: colors.blue,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  boxText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 24,
    color: colors.darkest,
  },
  linkText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    color: colors.blue,
    textDecorationLine: 'underline',
  },
});
