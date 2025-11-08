import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native'
import { colors } from '~/constants/Colors'

interface TermsModalProps {
  visible: boolean
  onClose: () => void
}

export default function TermsModal({ visible, onClose }: TermsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bobee Terms & Conditions</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.sectionTitle}>Last Updated:</Text>
            <Text style={styles.dateText}>10 August 2025</Text>

            <Text style={styles.modalText}>
              <Text style={styles.sectionTitle}>Overview</Text>{'\n'}
              These Terms & Conditions govern your access to and use of Bobee. By using the app, you agree to these terms. If you do not agree, do not use Bobee.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Who We Are</Text>{'\n'}
              Bobee is provided on an as-is, as-available basis by "Bobee" (unregistered). You can contact us at contact@bobee.co.uk for any questions about these terms.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Eligibility & Accounts</Text>{'\n'}
              You must be at least 13 years old to use Bobee. You are responsible for the security of your device and any credentials used to access the app, and for all activity that occurs under your account.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Acceptable Use</Text>{'\n'}
              You agree to use Bobee lawfully and responsibly. You will not misuse the service, attempt to reverse-engineer or interfere with the app, probe or breach security, or use Bobee to generate or share content that is unlawful, harmful, or infringing.
              {'\n\n'}
              <Text style={styles.sectionTitle}>AI Outputs & No Medical Advice</Text>{'\n'}
              Bobee provides AI-generated insights intended for reflection and general informational purposes only. Bobee does not provide medical, psychological, or legal advice and is not a substitute for professional care. Do not use the app for emergencies; call local emergency services if you need urgent help.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Content & Intellectual Property</Text>{'\n'}
              You retain all rights to your journal transcriptions and content. By using Bobee, you grant us a limited, revocable license to process your content solely to operate, maintain, and improve the service, including generating insights and improving model prompts. The app, branding, and underlying software are owned by us or our licensors and are protected by applicable laws.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Privacy</Text>{'\n'}
              Your use of Bobee is governed by our Privacy Statement. In short, we store transcriptions (not audio) and generate insights in real time and from stored data. Data is stored in Firebase with default encryption. We use OpenAI for AI processing and, to the best of our knowledge, OpenAI does not retain the content of our API calls. We do not sell your personal information. Please review the Privacy Statement for full details.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Fees & Changes to the Service</Text>{'\n'}
              Bobee may evolve over time. We may introduce new features, modify existing features, or offer optional paid functionality in the future. If pricing applies, we will present the details before you opt in.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Termination</Text>{'\n'}
              You may stop using Bobee at any time. We may suspend or terminate access if you breach these terms or use the service in a way that could harm us, other users, or third parties.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Disclaimers & Limitation of Liability</Text>{'\n'}
              Bobee is provided without warranties of any kind to the extent permitted by law. We do not warrant that the app will be uninterrupted or error-free, or that AI outputs will be accurate or suitable for your purposes. To the maximum extent permitted by law, we and our providers will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits or data, arising from your use of Bobee.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Governing Law</Text>{'\n'}
              These terms are governed by the laws of England and Wales, and the courts of England and Wales shall have exclusive jurisdiction, except where consumer protection laws in your country provide otherwise.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Changes to These Terms</Text>{'\n'}
              We may update these terms periodically to reflect changes in our service or legal requirements. We will post updates with the date of the latest revision. Your continued use of Bobee after changes take effect constitutes acceptance of the updated terms.
              {'\n\n'}
              <Text style={styles.sectionTitle}>Contact</Text>{'\n'}
              For questions about these Terms & Conditions, please email contact@bobee.co.uk.
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
