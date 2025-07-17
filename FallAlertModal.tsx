import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Vibration } from 'react-native';

// --- Type Definitions for the component's properties ---
type FallAlertModalProps = {
  isVisible: boolean;
  location: string | null;
  onDismiss: () => void;
};

const FallAlertModal: React.FC<FallAlertModalProps> = ({ isVisible, location, onDismiss }) => {

  // --- Vibrate the phone when the alert becomes visible ---
  useEffect(() => {
    if (isVisible) {
      // Vibrate with a pattern: vibrate 1s, pause 1s, vibrate 1s
      Vibration.vibrate([1000, 1000, 1000]);
    } else {
      // Stop vibrating if the modal is dismissed
      Vibration.cancel();
    }

    // Cleanup function to cancel vibration if the component unmounts
    return () => Vibration.cancel();
  }, [isVisible]);

  const handleShowOnMap = () => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${location}`;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalBackground}>
        <View style={styles.alertBox}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={styles.title}>Fall Detected!</Text>
          <Text style={styles.locationLabel}>Location:</Text>
          <Text style={styles.locationText}>{location || 'Unknown'}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.buttonBase, styles.mapButton]} onPress={handleShowOnMap}>
              <Text style={styles.buttonText}>Show on Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonBase, styles.dismissButton]} onPress={onDismiss}>
              <Text style={styles.buttonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#d32f2f', // Red for critical alert
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'white',
  },
  iconText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  locationLabel: {
    fontSize: 16,
    color: '#666',
  },
  locationText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#d32f2f',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonBase: {
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  mapButton: {
    backgroundColor: '#1976d2',
  },
  dismissButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FallAlertModal;