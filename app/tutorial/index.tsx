import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '~/constants/Colors';
import { useRouter } from 'expo-router';

export default function TutorialIntro() {
  const router = useRouter();

  const handleStart = () => {
    router.replace('/journal?tour=1');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to Bobee</Text>
      <Text style={styles.body}>We'll give you a super quick tour: journaling, browsing your entries, exploring insights, and your daily Bobee AI hub. Ready?</Text>
      <TouchableOpacity style={styles.btn} onPress={handleStart} activeOpacity={0.85}>
        <Text style={styles.btnText}>Start tutorial</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/journal')} style={{ marginTop: 20 }}>
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightest, padding: 30, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 32, fontFamily: 'SpaceMono', fontWeight: '600', color: colors.darkest, textAlign: 'center', marginBottom: 20 },
  body: { fontSize: 16, fontFamily: 'SpaceMono', color: colors.darkest, lineHeight: 24, textAlign: 'center', marginBottom: 40 },
  btn: { backgroundColor: colors.blue, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, alignSelf: 'stretch' },
  btnText: { fontSize: 18, color: 'white', fontFamily: 'SpaceMono', fontWeight: '600' },
  skip: { color: colors.dark, textDecorationLine: 'underline', fontFamily: 'SpaceMono' },
});
