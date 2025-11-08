import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native'
import { colors } from '~/constants/Colors'

interface PrivacyModalProps {
  visible: boolean
  onClose: () => void
}

export default function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Statement</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.sectionTitle}>Last Updated:</Text>
            <Text style={styles.dateText}>10 August 2025</Text>

            <Text style={styles.modalText}>
              <Text style={styles.sectionTitle}>Overview</Text>{'\n'}
              At Bobee, your privacy is a priority. This statement explains the information we collect, how we use it, and the steps we take to protect it.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Information We Collect</Text>{'\n'}
              We store transcriptions of your spoken journal entries — audio recordings are not saved — along with AI-generated insights such as mood analysis, personality metrics, topic breakdowns, daily tips, and progress data like trends and streaks. We do not collect unrelated usage or background activity data.
              {'\n\n'}
              <Text style={styles.sectionTitle}>How We Use Your Information</Text>{'\n'}
              Your information is used to provide accurate and meaningful insights from your journals, help you track progress over time, and enhance the model prompts that power your personal AI chatbot. Aggregated and anonymized data may also be used to improve our AI systems.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Data Storage & Security</Text>{'\n'}
              All data is stored securely in Firebase and protected with its default encryption both in transit and at rest. Insights are generated in real time during journaling sessions and may also be drawn from your stored entries. API calls to OpenAI are used to process your transcriptions; to the best of our knowledge, OpenAI does not retain the content of these calls.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Third-Party Services</Text>{'\n'}
              We use Firebase for authentication and data storage, and OpenAI for AI processing. We do not sell your personal information, and any sharing is limited to anonymized data for the sole purpose of improving AI functionality.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Your Rights</Text>{'\n'}
              You can request a copy of your stored data at any time by contacting us at contact@bobee.co.uk. You may also delete your account and associated data. Data is retained until such a request or action is made.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Cookies & Tracking</Text>{'\n'}
              The Bobee mobile app does not use cookies or tracking technologies. Our website may use basic analytics tools for performance and security monitoring.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Policy Updates</Text>{'\n'}
              We may update this statement periodically to reflect changes in our practices. Any updates will be posted with the date of the latest revision.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Contact Us</Text>{'\n'}
              For privacy-related questions or requests, please email us at contact@bobee.co.uk.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '85%',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.lighter,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    color: colors.darkest,
    marginRight: 'auto',
  },
  closeText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.blue,
    textDecorationLine: 'underline',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 35
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: colors.blue,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.dark,
    marginBottom: 12,
  },
  modalText: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    lineHeight: 24,
    color: colors.darkest,
  },
})
