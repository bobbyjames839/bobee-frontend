import { router } from 'expo-router';
import React from 'react';
import { ScrollView, View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';

export default function Contact() {
  const handleEmailPress = () => {
    Linking.openURL('mailto:contact@bobee.co.uk');
  };

  return (
    <>
    <Header
        title='Contact'
        leftIcon="chevron-back"
        onLeftPress={() => (router.back())}/>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.box}>
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
            <Text style={styles.linkText}>contact@bobee.co.uk</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </ScrollView>
    </>
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
