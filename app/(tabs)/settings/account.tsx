import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '~/constants/Colors';
import { getAuth, signOut } from 'firebase/auth';
import Constants from 'expo-constants';
import Header from '~/components/Header';
const API_URL = Constants.expoConfig?.extra?.backendUrl as string


export default function AccountSettings() {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setConfirmDelete(false);
    }, [])
  );

 const handleDeleteAccount = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return Alert.alert('Error', 'No user is currently signed in.');

    try {
      const idToken = await user.getIdToken(true);

      const res = await fetch(`${API_URL}/api/delete-account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status !== 204) {
        let msg = 'Failed to delete account.';
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }

      await signOut(auth).catch(() => {});
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Delete Failed', e?.message ?? 'Unknown error');
    }
  };

  const onPressDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
    } else {
      handleDeleteAccount();
    }
  };

  return (
    <>
      <Header
          title='Account'
          leftIcon="chevron-back"
          onLeftPress={() => (router.back())}/>
      <Stack.Screen
        options={{
          title: 'Account',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ paddingHorizontal: 8, marginLeft: -4 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.darkest} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/settings/account/account-info')}
          >
            <Text style={styles.text}>Account Information</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.darkest}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/settings/account/change-password')}
          >
            <Text style={styles.text}>Change Password</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.darkest}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rowBottom}
            onPress={onPressDelete}
          >
            <Text style={[styles.text, styles.destructive]}>
              {confirmDelete ? 'Confirm Delete' : 'Delete Account'}
            </Text>
            <Ionicons
              name="trash-outline"
              size={20}
              color="red"
            />
          </TouchableOpacity>
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
  },
  card: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.lighter,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  text: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: colors.darkest,
  },
  destructive: {
    color: 'red',
  },
});
