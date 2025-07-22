// app/(tabs)/settings/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import Header from '~/components/Header';
import { colors } from '~/constants/Colors';

const menuItems = [
  { label: 'Account',            path: 'account', icon: 'person-circle-outline'     },
  { label: 'Subscription',       path: 'sub',     icon: 'card-outline'              },
  { label: 'How to use',         path: 'how',     icon: 'information-circle-outline' },
  { label: 'Privacy Statement',  path: 'priv',    icon: 'shield-checkmark-outline'  },
  { label: 'Terms & Conditions', path: 'terms',   icon: 'document-text-outline'    },
] as const;

export default function SettingsIndex() {
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Reset confirmLogout whenever this screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      setConfirmLogout(false);
    }, [])
  );

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Logout Failed', e.message);
    }
  };

  const onPressLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
    } else {
      handleLogout();
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Settings and privacy" />

      <ScrollView contentContainerStyle={styles.menuContainer}>
        {menuItems.map(({ label, path, icon }) => (
          <TouchableOpacity
            key={path}
            style={styles.menuItem}
            onPress={() => router.push(`/settings/${path}`)}
          >
            <Ionicons
              name={icon}
              size={24}
              color={colors.darkest}
              style={styles.leftIcon}
            />
            <Text style={styles.menuText}>{label}</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.darkest}
              style={styles.menuIcon}
            />
          </TouchableOpacity>
        ))}

        {/* Two-step logout with auto-reset on unfocus */}
        <TouchableOpacity
          style={styles.logoutItem}
          onPress={onPressLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="red"
            style={styles.leftIcon}
          />
          <Text style={styles.logoutText}>
            {confirmLogout ? 'Confirm' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightest,
  },
  menuContainer: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 14,
    marginTop: 10,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 14,
    marginTop: 10,
  },
  leftIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: colors.darkest,
    fontWeight: '600',
  },
  menuIcon: {
    marginLeft: 'auto',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'SpaceMono',
    color: 'red',
    fontWeight: '600',
  },
});
