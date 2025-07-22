// app/(tabs)/settings/account.tsx
import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '~/constants/Colors';
import { getAuth, deleteUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

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
    if (!user) {
      return Alert.alert('Error', 'No user is currently signed in.');
    }
    const uid = user.uid;
    const db = getFirestore();

    try {
      await deleteDoc(doc(db, 'users', uid));

      const journalsQ = query(
        collection(db, 'journals'),
        where('userId', '==', uid)
      );
      const snapshot = await getDocs(journalsQ);
      await Promise.all(
        snapshot.docs.map((d) => deleteDoc(doc(db, 'journals', d.id)))
      );

      await deleteUser(user);

      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Delete Failed', e.message);
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
          {/* Account Information */}
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

          {/* Change Password */}
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

          {/* Delete Account */}
          <TouchableOpacity
            style={[styles.row]}
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
    borderColor: colors.light,
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
    borderBottomColor: colors.light,
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
