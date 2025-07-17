import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// --- Data for the tutorial steps ---
const tutorialSteps = [
  {
    title: "Welcome to Fall Guardian!",
    description: "This app, paired with your Fall Guardian watch, provides an automatic safety net for you or your loved ones."
  },
  {
    title: "Step 1: Set Up Contacts",
    description: "Go to the 'Contacts' tab to add the phone numbers of family or friends you want to alert in an emergency."
  },
  {
    title: "Step 2: Configure Settings",
    description: "Visit the 'Settings' tab to customize the SMS alert message and adjust the watch's buzzer volume."
  },
  {
    title: "Step 3: Pair Your Watch",
    description: "In Settings, tap 'Pair or Manage Watch' to connect the app to your Fall Guardian watch via Bluetooth."
  },
  {
    title: "Step 4: Grant Permissions",
    description: "For the alert system to work, the app needs your permission to make calls, access location, and use Bluetooth. Please go to the Settings tab and press the 'Grant All Permissions' button."
  }
];

const TutorialScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Getting Started</Text>
      {tutorialSteps.map((step, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.cardTitle}>{step.title}</Text>
          <Text style={styles.cardDescription}>{step.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
});

export default TutorialScreen;
