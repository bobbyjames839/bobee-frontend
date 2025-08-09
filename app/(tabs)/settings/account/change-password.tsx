import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '~/constants/Colors';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';


function BackChevron() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{
        paddingHorizontal: 8,
        marginLeft: -4,
      }}
    >
      <Ionicons name="chevron-back" size={24} color={colors.darkest} />
    </TouchableOpacity>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const auth = getAuth();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      return Alert.alert('Error', 'Please fill all fields.');
    }
    if (newPwd !== confirmPwd) {
      return Alert.alert('Error', 'New passwords do not match.');
    }
    setLoading(true);
    try {
      const user = auth.currentUser!;
      const cred = EmailAuthProvider.credential(user.email!, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      Alert.alert('Success', 'Your password has been changed.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Change Password',
          headerLeft: () => <BackChevron />,
        }}
      />
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Current password"
          secureTextEntry
          value={currentPwd}
          onChangeText={setCurrentPwd}
        />

        <TextInput
          style={styles.input}
          placeholder="New password"
          secureTextEntry
          value={newPwd}
          onChangeText={setNewPwd}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          secureTextEntry
          value={confirmPwd}
          onChangeText={setConfirmPwd}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChange}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Save New Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'SpaceMono',
    backgroundColor: 'white',
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.blue,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: 'white',
  },
});
