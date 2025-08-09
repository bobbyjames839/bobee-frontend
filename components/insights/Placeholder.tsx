import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function Placeholder() {
  return (
    <View style={styles.placeholderBox}>
      <Text style={styles.placeholderText}>No data available</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholderBox: {
    height: 200,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
})
