import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardTypeOptions, ScrollView, Switch, Button, Linking, PermissionsAndroid, Platform, ActivityIndicator } from 'react-native';
import CustomAlert from './CustomAlert';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import RNImmediatePhoneCall from 'react-native-immediate-phone-call';
import Geolocation from 'react-native-geolocation-service';
import DatePicker from 'react-native-date-picker';

// --- Type Definitions and Reusable Components ---
type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
};
type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};
type ToggleSwitchProps = {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
};

const InputField: React.FC<InputFieldProps> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, numberOfLines = 1 }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize="none"
    />
  </View>
);
const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, disabled }) => (
  <TouchableOpacity style={[styles.button, disabled && styles.disabledButton]} onPress={onPress} disabled={disabled}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, value, onValueChange }) => (
    <View style={styles.switchContainer}>
        <Text style={styles.label}>{label}</Text>
        <Switch value={value} onValueChange={onValueChange} />
    </View>
);

// --- FIXED: The component now correctly accepts all props from App.tsx ---
const SettingsScreen: React.FC<{ onNavigateToPairing: () => void; onSimulateFall: () => void; isSimulatingFall: boolean; }> = ({ onNavigateToPairing, onSimulateFall, isSimulatingFall }) => {
  const [fallAlertSmsText, setFallAlertSmsText] = useState("EMERGENCY: Fall detected! Location: {location}.");
  const [userHeight, setUserHeight] = useState('');
  const [userWeight, setUserWeight] = useState('');
  const [isAutoCallEnabled, setIsAutoCallEnabled] = useState(true);
  const [isSmsEnabled, setIsSmsEnabled] = useState(true);
  const [isInAppAlertEnabled, setIsInAppAlertEnabled] = useState(true);
  const [alertInfo, setAlertInfo] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({ isVisible: false, message: '', type: 'success' });
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduledCheckInEnabled, setScheduledCheckInEnabled] = useState(true);
  const [checkInTime, setCheckInTime] = useState<string>('Not Set');
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [dateForPicker, setDateForPicker] = useState(new Date());

  const currentUserId = auth().currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;
    const messagesDocRef = firestore().collection('users').doc(currentUserId).collection('notificationSettings').doc('messages');
    const deviceDocRef = firestore().collection('users').doc(currentUserId).collection('deviceSettings').doc('config');

    const loadSettings = async () => {
        try {
            const messagesDoc = await messagesDocRef.get();
            // --- FIXED: Changed .exists to .exists() ---
            if (messagesDoc.exists()) {
                const data = messagesDoc.data();
                setFallAlertSmsText(data?.fallAlertSmsText || "EMERGENCY: Fall detected! Location: {location}.");
            }
            const deviceDoc = await deviceDocRef.get();
            // --- FIXED: Changed .exists to .exists() ---
            if (deviceDoc.exists()) {
                const data = deviceDoc.data();
                setUserHeight(String(data?.userHeight || ''));
                setUserWeight(String(data?.userWeight || ''));
                setIsAutoCallEnabled(data?.autoCallEnabled ?? true);
                setIsSmsEnabled(data?.smsEnabled ?? true);
                setIsInAppAlertEnabled(data?.inAppAlertEnabled ?? true);
                setCheckInTime(data?.scheduledCheckInTime || 'Not Set');
                setScheduledCheckInEnabled(data?.scheduledCheckInEnabled ?? true);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };
    loadSettings();
  }, [currentUserId]);

    const handleSaveSettings = async () => {
        if (!currentUserId) {
            setAlertInfo({ isVisible: true, message: 'You must be logged in to save settings.', type: 'error' });
            return;
        }
        setIsSaving(true);
        let finalSmsText = fallAlertSmsText;
        if (!finalSmsText.includes('{location}')) {
            finalSmsText += ' {location}';
        }
        const messageSettings = { fallAlertSmsText: finalSmsText };
        const deviceSettings = { 
            userHeight: parseInt(userHeight, 10) || 0,
            userWeight: parseInt(userWeight, 10) || 0,
            autoCallEnabled: isAutoCallEnabled,
            smsEnabled: isSmsEnabled,
            inAppAlertEnabled: isInAppAlertEnabled,
            scheduledCheckInEnabled: isScheduledCheckInEnabled,
            scheduledCheckInTime: checkInTime,
        };
    
        try {
            await firestore().collection('users').doc(currentUserId).collection('notificationSettings').doc('messages').set(messageSettings, { merge: true });
            await firestore().collection('users').doc(currentUserId).collection('deviceSettings').doc('config').set(deviceSettings, { merge: true });
            setAlertInfo({ isVisible: true, message: 'Settings have been saved!', type: 'success' });
        } catch (error: any) {
            console.error("Error saving settings: ", error);
            setAlertInfo({ isVisible: true, message: 'Could not save settings.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSimulateCall = async () => {
        if (!testPhoneNumber) {
          setAlertInfo({ isVisible: true, message: 'Please enter a test phone number.', type: 'error'});
          return;
        }
        try {
            const hasPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
            if (hasPermission === PermissionsAndroid.RESULTS.GRANTED) {
                RNImmediatePhoneCall.immediatePhoneCall(testPhoneNumber);
            } else {
                setAlertInfo({ isVisible: true, message: 'Call Phone permission was denied.', type: 'error'});
            }
        } catch(e: any) {
            setAlertInfo({ isVisible: true, message: `Could not start call: ${e.message}`, type: 'error'});
        }
    };

    const handleSetCheckInTime = () => {
        setTimePickerVisible(true);
    };

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>App & Device Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Watch Connectivity</Text>
          <Button title="Pair or Manage Watch" onPress={onNavigateToPairing} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Scheduled Daily Check-in</Text>
          <ToggleSwitch label="Enable Scheduled Check-in" value={isScheduledCheckInEnabled} onValueChange={setScheduledCheckInEnabled} />
          {isScheduledCheckInEnabled && (
            <View style={styles.checkinContainer}>
                <Text style={styles.checkinTimeText}>Current Time: {checkInTime}</Text>
                <Button title="Set Time" onPress={handleSetCheckInTime} />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Alert Preferences</Text>
          <ToggleSwitch label="Enable Automatic Calls" value={isAutoCallEnabled} onValueChange={setIsAutoCallEnabled} />
          <ToggleSwitch label="Enable Automatic SMS" value={isSmsEnabled} onValueChange={setIsSmsEnabled} />
          <ToggleSwitch label="Enable In-App Fall Alert" value={isInAppAlertEnabled} onValueChange={setIsInAppAlertEnabled} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notification Messages</Text>
          <InputField label="SMS Message Text (For Watch)" value={fallAlertSmsText} onChangeText={setFallAlertSmsText} multiline numberOfLines={4} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>User Profile (for Fall Detection)</Text>
          <InputField label="User Height (cm)" value={userHeight} onChangeText={setUserHeight} keyboardType="numeric" placeholder="e.g., 175" />
          <InputField label="User Weight (kg)" value={userWeight} onChangeText={setUserWeight} keyboardType="numeric" placeholder="e.g., 70" />
        </View>

        <PrimaryButton title={isSaving ? "Saving..." : "Save All Settings"} onPress={handleSaveSettings} disabled={isSaving} />
        
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Test Features</Text>
          <InputField label="Test Phone Number" value={testPhoneNumber} onChangeText={setTestPhoneNumber} keyboardType="phone-pad" />
          <View style={styles.testButtonContainer}><Button title="Test Automatic Call" onPress={handleSimulateCall} color="#28a745" /></View>
          <View style={styles.testButtonContainer}>
              <Button 
                  title={isSimulatingFall ? "Getting Location..." : "Simulate In-App Fall Alert"} 
                  onPress={onSimulateFall} 
                  color="#c1121f" 
                  disabled={isSimulatingFall}
              />
          </View>
        </View>

        <CustomAlert isVisible={alertInfo.isVisible} message={alertInfo.message} type={alertInfo.type} onClose={() => setAlertInfo({ ...alertInfo, isVisible: false })} />
      </ScrollView>
      <DatePicker
        modal
        open={isTimePickerVisible}
        date={dateForPicker}
        mode="time"
        onConfirm={(date: Date) => {
          setTimePickerVisible(false);
          const formattedTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          setCheckInTime(formattedTime);
          setDateForPicker(date);
        }}
        onCancel={() => {
          setTimePickerVisible(false);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#424242', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingBottom: 5 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 16, color: '#424242', marginBottom: 5 },
  input: { height: 45, borderColor: '#bdbdbd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#fff' },
  multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
  button: { backgroundColor: '#1976d2', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#a9a9a9' },
  switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
  },
  testButtonContainer: {
      marginVertical: 5,
  },
  checkinContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
      marginTop: 10,
  },
  checkinTimeText: {
      fontSize: 16,
      color: '#333',
  },
});

export default SettingsScreen;
