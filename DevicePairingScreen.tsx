import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, PermissionsAndroid, Platform, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import BluetoothSerial from 'react-native-bluetooth-serial';
import CustomAlert from './CustomAlert';

// --- Type Definition for a Bluetooth Device ---
type Device = {
  id: string; // This is the MAC address
  name: string;
};

// --- NEW: Type definition for the data received from the watch ---
type ReadData = {
    data: string;
    id: string;
}

// --- Main Component ---
const DevicePairingScreen: React.FC<{ onFallDetected: (location: string) => void }> = ({ onFallDetected }) => {
  const [alertInfo, setAlertInfo] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({ isVisible: false, message: '', type: 'success' });
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // This hook sets up the Bluetooth listeners when the screen loads
  useEffect(() => {
    const checkBluetoothEnabled = async () => {
      try {
        const enabled = await BluetoothSerial.isEnabled();
        if (!enabled) {
          setAlertInfo({ isVisible: true, message: 'Please enable Bluetooth to connect to your watch.', type: 'error' });
        }
      } catch (e) { console.error(e); }
    };
    checkBluetoothEnabled();

    // Listener for incoming data from the watch
    // FIXED: Added types for the callback parameters
    BluetoothSerial.on('read', (data: ReadData) => {
      console.log('Received data:', data.data);
      // The watch sends "FALL:lat,lng". We split it to get the location.
      if (data && data.data && data.data.includes('FALL:')) {
        const location = data.data.split(':')[1];
        onFallDetected(location.trim());
      }
    });

    // FIXED: Added types for the callback parameters
    BluetoothSerial.on('error', (err: { message: string }) => console.log(`Error: ${err.message}`));
    BluetoothSerial.on('connectionLost', () => {
      setConnectedDevice(null);
      setAlertInfo({ isVisible: true, message: 'Connection to watch lost.', type: 'error' });
    });

  }, []);

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted'
      );
    }
    return true;
  };

  // --- UPDATED: This function now lists PAIRED devices ---
  const listPairedDevices = async () => {
    const permissionsGranted = await requestBluetoothPermissions();
    if (!permissionsGranted) {
        setAlertInfo({ isVisible: true, message: 'Bluetooth permissions are required.', type: 'error'});
        return;
    }

    setIsSearching(true);
    setDevices([]);
    try {
        // Use .list() to get devices already paired in the phone's OS settings
        const pairedDevices = await BluetoothSerial.list();
        if (pairedDevices.length > 0) {
            setDevices(pairedDevices);
        } else {
            setAlertInfo({ isVisible: true, message: 'No paired devices found. Please pair your "FallGuardian" watch in your phone\'s main Bluetooth settings first.', type: 'error' });
        }
    } catch (e: any) {
        setAlertInfo({ isVisible: true, message: `Error listing devices: ${e.message}`, type: 'error'});
    }
    setIsSearching(false);
  };
  
  // --- Function to connect to the selected device ---
  const connectToDevice = async (device: Device) => {
    try {
        setAlertInfo({ isVisible: true, message: `Connecting to ${device.name}...`, type: 'success'});
        await BluetoothSerial.connect(device.id);
        setConnectedDevice(device);
        setAlertInfo({ isVisible: true, message: `Successfully connected to ${device.name}!`, type: 'success'});
        setDevices([]); // Clear the list after connecting
    } catch (e: any) {
        setAlertInfo({ isVisible: true, message: `Failed to connect: ${e.message}`, type: 'error'});
    }
  };

  const disconnectFromDevice = async () => {
      try {
          await BluetoothSerial.disconnect();
          setConnectedDevice(null);
      } catch (e) {
          console.error(e);
      }
  };
  
  // --- RE-ADDED: Function to send a test command ---
  const sendCheckInCommand = async () => {
      if(!connectedDevice) {
          setAlertInfo({ isVisible: true, message: 'Not connected to any device.', type: 'error'});
          return;
      }
      try {
          await BluetoothSerial.write("CHECK_IN");
          setAlertInfo({ isVisible: true, message: '"Check-in" signal sent to watch!', type: 'success'});
      } catch (e: any) {
          setAlertInfo({ isVisible: true, message: `Failed to send command: ${e.message}`, type: 'error'});
      }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Pair & Connect Watch</Text>
      
      {connectedDevice ? (
        <View style={styles.connectedContainer}>
            <Text style={styles.connectedText}>Connected to: {connectedDevice.name}</Text>
            {/* --- RE-ADDED: The test button --- */}
            <View style={styles.buttonContainer}>
                <Button title="Send Test 'Check-in' Signal" onPress={sendCheckInCommand} />
            </View>
            <View style={styles.buttonContainer}>
                <Button title="Disconnect" onPress={disconnectFromDevice} color="#c1121f" />
            </View>
        </View>
      ) : (
        <>
            <Text style={styles.description}>
                First, pair your "FallGuardian" watch in your phone's main Bluetooth settings. Then, press the button below to find and connect to it.
            </Text>
            <View style={styles.buttonContainer}>
                <Button 
                    title={isSearching ? "Searching..." : "Find Paired Devices"} 
                    onPress={listPairedDevices} 
                    disabled={isSearching} 
                />
            </View>
            {isSearching && <ActivityIndicator size="large" color="#0d47a1" style={{ marginVertical: 20 }} />}
        </>
      )}

      <FlatList
        style={styles.deviceList}
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <TouchableOpacity style={styles.deviceButton} onPress={() => connectToDevice(item)}>
                <Text style={styles.deviceName}>{item.name || "Unnamed Device"}</Text>
                <Text style={styles.deviceId}>{item.id}</Text>
            </TouchableOpacity>
        )}
      />

      <CustomAlert
        isVisible={alertInfo.isVisible}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo({ ...alertInfo, isVisible: false })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f7' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  description: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  buttonContainer: { width: '90%', marginVertical: 5, alignSelf: 'center' },
  deviceList: { marginTop: 20 },
  deviceButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  connectedContainer: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: '#e8f5e9',
      borderRadius: 10,
      marginBottom: 20,
  },
  connectedText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2e7d32',
      marginBottom: 15,
  }
});

export default DevicePairingScreen;
