import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';

// --- Props (No changes here) ---
type CustomAlertProps = {
  isVisible: boolean;
  message: string;
  type: 'success' | 'error' | 'confirm';
  onClose: () => void;
  onConfirm?: () => void;
};

const CustomAlert: React.FC<CustomAlertProps> = ({ isVisible, message, type, onClose, onConfirm }) => {
  const isSuccess = type === 'success';

  useEffect(() => {
    if (isVisible && (type === 'success' || type === 'error')) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000); 

      return () => clearTimeout(timer);
    }
  }, [isVisible, type, onClose]);

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackground} onPress={onClose}>
        <Pressable>
          <View style={styles.alertBox}>
            {/* --- 2. ADDED THE SYMBOLS BACK INSIDE THE CIRCLES --- */}
            {type !== 'confirm' ? (
              <View style={[styles.iconContainer, { backgroundColor: isSuccess ? '#28a745' : '#dc3545' }]}>
                <Text style={styles.iconText}>{isSuccess ? '✓' : '✕'}</Text>
              </View>
            ) : (
              <View style={[styles.iconContainer, { backgroundColor: '#ffc107' }]}>
                <Text style={styles.iconText}>?</Text>
              </View>
            )}

            <Text style={styles.messageText}>{message}</Text>

            {type === 'confirm' && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.buttonBase, styles.confirmButton]} onPress={onConfirm}>
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// --- STYLES (Updated for centering and symbols) ---
const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  // --- 2. ADDED THE ICON TEXT STYLE BACK ---
  iconText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  // --- 1. FIXED THE CENTERING FOR THE BUTTON CONTAINER ---
  buttonContainer: {
    width: '100%',
    alignItems: 'center', // This will center the single button horizontally
  },
  buttonBase: {
    paddingVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 40,
  },
  confirmButton: {
    backgroundColor: '#dc3545', 
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CustomAlert;