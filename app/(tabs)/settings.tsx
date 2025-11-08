import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import Header from '~/components/other/Header';
import { colors } from '~/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Item = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path?: Href;
  destructive?: boolean;
  onPress?: () => void;
};

export default function SettingsIndex() {
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setConfirmLogout(false);
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.setItem('showSignOutMessage', '1');
      await signOut(getAuth());
      router.replace('/(auth)/main');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Logout Failed', e.message);
    }
  };

  const onPressLogout = () => {
    if (!confirmLogout) setConfirmLogout(true);
    else handleLogout();
  };

  const accountItems: Item[] = [
    { label: 'Account',      icon: 'person-circle-outline', path: '/settings/account' },
    { label: 'My Data',      icon: 'document-text-outline', path: '/settings/my-data' },
    { label: confirmLogout ? 'Confirm' : 'Log Out', icon: 'log-out-outline', destructive: true, onPress: onPressLogout },
  ];

  const helpItems: Item[] = [
    { label: 'How to use',         icon: 'information-circle-outline', path: '/settings/how' },
    { label: 'Privacy Statement',  icon: 'shield-checkmark-outline',   path: '/settings/priv' },
    { label: 'Terms & Conditions', icon: 'document-text-outline',      path: '/settings/terms' },
    { label: 'Contact',            icon: 'mail-outline',               path: '/settings/contact' }, // New contact link
    { label: 'Replay tutorial',    icon: 'refresh-outline', onPress: async () => {
        try {
          await AsyncStorage.removeItem('tutorialComplete');
          router.push('/tutorial');
        } catch (e) { console.warn('Failed to reset tutorial', e); }
      }},
  ];

  const renderSection = (title: string, items: Item[]) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const RowComponent = (
            <View style={[styles.row, !isLast && styles.rowDivider]}>
              <Ionicons
                name={item.icon}
                size={24}
                color={item.destructive ? 'red' : colors.darkest}
                style={styles.leftIcon}
              />
              <Text style={[styles.menuText, item.destructive && styles.destructiveText]}>
                {item.label}
              </Text>
              {!item.destructive && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.darkest}
                  style={styles.menuIcon}
                />
              )}
            </View>
          );

          const onPress = item.onPress
            ? item.onPress
            : item.path
              ? () => router.push(item.path!)
              : undefined;

          return (
            <TouchableOpacity key={`${title}-${idx}`} onPress={onPress} activeOpacity={0.7}>
              {RowComponent}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Settings and privacy" />
      <ScrollView contentContainerStyle={styles.menuContainer}>
        {renderSection('ACCOUNT', accountItems)}
        {renderSection('HELP & INFO', helpItems)}
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
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    color: colors.dark,
    marginBottom: 8,
    letterSpacing: 0.5,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lighter,
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
  destructiveText: {
    color: 'red',
  },
  menuIcon: {
    marginLeft: 'auto',
  },
});
