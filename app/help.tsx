import { View, Text, StyleSheet } from 'react-native'
import React from 'react'

const Page = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help</Text>
      <Text style={styles.subtitle}>Contact Information:</Text>
      <Text style={styles.contact}>Email: dhnilo.dev@gmail.com</Text>
      <Text style={styles.contact}>Phone: 123-456-7890</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  contact: {
    fontSize: 16,
    marginBottom: 4,
  },
})

export default Page