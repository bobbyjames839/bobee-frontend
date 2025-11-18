import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import SpinningLoader from '~/components/other/SpinningLoader';
import { colors } from '~/constants/Colors';

interface Props {
  visible: boolean;
  title?: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<Props> = ({
  visible,
  title = 'Delete?',
  message = 'This action cannot be undone.',
  onCancel,
  onConfirm,
  isDeleting = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={styles.deleteModal}>
          <Text style={styles.deleteModalTitle}>{title}</Text>
          <Text style={styles.deleteModalText}>{message}</Text>
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalCancel]}
              onPress={onCancel}
              disabled={isDeleting}
            >
              <Text style={styles.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalConfirm]}
              onPress={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <SpinningLoader size={16} thickness={3} color="#fff" />
              ) : (
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  deleteModalTitle: {
    fontFamily: 'SpaceMonoSemibold',
    fontSize: 18,
    color: colors.darkest,
    marginBottom: 12,
  },
  deleteModalText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.dark,
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteModalCancel: {
    backgroundColor: colors.lighter,
  },
  deleteModalConfirm: {
    backgroundColor: 'rgba(233, 127, 127, 1)',
  },
  deleteModalCancelText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: colors.darkest,
  },
  deleteModalConfirmText: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: '#fff',
  },
});

export default DeleteConfirmModal;
