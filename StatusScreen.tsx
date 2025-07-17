import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Button, Linking } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import CustomAlert from './CustomAlert'; // Import the custom alert

// --- Type definition for a Fall Event ---
type FallEvent = {
  id: string;
  type: 'fall' | 'panic';
  createdAt: {
    toDate: () => Date;
  };
  locationData?: string;
};

const StatusScreen: React.FC = () => {
  const [deviceConfig, setDeviceConfig] = useState<any>(null);
  const [fallHistory, setFallHistory] = useState<FallEvent[]>([]);
  const [loading, setLoading] = useState(true);
  // --- NEW: State for our custom alert ---
  const [alertInfo, setAlertInfo] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({ isVisible: false, message: '', type: 'success' });


  const currentUserId = auth().currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const configSubscriber = firestore()
      .collection('users')
      .doc(currentUserId)
      .collection('deviceSettings')
      .doc('config')
      .onSnapshot(documentSnapshot => {
        setDeviceConfig(documentSnapshot.data());
        if (loading) setLoading(false);
      }, error => {
          console.error("Error fetching device config: ", error);
          if (loading) setLoading(false);
      });

    const historySubscriber = firestore()
      .collection('users')
      .doc(currentUserId)
      .collection('fallEvents')
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const events: FallEvent[] = [];
        querySnapshot.forEach(documentSnapshot => {
          events.push({
            ...documentSnapshot.data(),
            id: documentSnapshot.id,
          } as FallEvent);
        });
        setFallHistory(events);
        if (loading) setLoading(false);
      }, error => {
        console.error("Error fetching fall history: ", error);
        if (loading) setLoading(false);
      });

    return () => {
      configSubscriber();
      historySubscriber();
    };
  }, [currentUserId]);

  const handleShowOnMap = (locationData?: string) => {
    if (!locationData) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${locationData}`;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  // --- NEW: Function to handle the personal check-in ---
  const handlePersonalCheckIn = () => {
      // In a real app, this would use Bluetooth to send a "buzz" command.
      // For now, we simulate it with an alert.
      setAlertInfo({
          isVisible: true,
          message: '"Check-in" signal sent to watch!',
          type: 'success',
      });
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0d47a1" style={{marginTop: 50}} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Device Status & History</Text>

      {/* --- NEW: Personal Check-in Section --- */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Personal Check-in</Text>
        <Text style={styles.checkinDescription}>
            Send a non-emergency alert to the watch. The watch will buzz until the wearer presses a button to confirm they are okay.
        </Text>
        <Button title="Send Personal Check-in" onPress={handlePersonalCheckIn} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Current Device Configuration</Text>
        {deviceConfig ? (
            <>
                <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Buzzer Volume:</Text>
                    <Text style={styles.statusValue}>{deviceConfig.buzzerVolume}</Text>
                </View>
                <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Auto Call Enabled:</Text>
                    <Text style={styles.statusValue}>{deviceConfig.autoCallEnabled ? 'Yes' : 'No'}</Text>
                </View>
                 <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Auto SMS Enabled:</Text>
                    <Text style={styles.statusValue}>{deviceConfig.smsEnabled ? 'Yes' : 'No'}</Text>
                </View>
            </>
        ) : (
            <Text style={styles.noDataText}>No device settings saved yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Fall & Panic Event History</Text>
        {fallHistory.length === 0 ? (
            <Text style={styles.noDataText}>No events recorded yet.</Text>
        ) : (
            fallHistory.map(item => (
              <View key={item.id} style={styles.eventItem}>
                  <Text style={styles.eventType}>
                      {item.type === 'panic' ? 'Panic Alert' : 'Fall Detected'}
                  </Text>
                  <Text style={styles.eventDetail}>
                      Time: {item.createdAt ? item.createdAt.toDate().toLocaleString() : 'No timestamp'}
                  </Text>
                  <View style={styles.locationContainer}>
                      <Text style={styles.eventDetail} ellipsizeMode="tail" numberOfLines={1}>
                          Location: {item.locationData || 'Unknown'}
                      </Text>
                      {item.locationData && (
                          <View style={styles.mapButton}>
                              <Button title="Map" onPress={() => handleShowOnMap(item.locationData)} />
                          </View>
                      )}
                  </View>
              </View>
            ))
        )}
      </View>
      <CustomAlert 
        isVisible={alertInfo.isVisible} 
        message={alertInfo.message} 
        type={alertInfo.type} 
        onClose={() => setAlertInfo({ isVisible: false, message: '', type: 'success' })}
      />
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 20, backgroundColor: 'white', borderRadius: 8, padding: 15, elevation: 2 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#424242', marginBottom: 10 },
  checkinDescription: { fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
  statusItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statusLabel: { fontSize: 16, color: '#666' },
  statusValue: { fontSize: 16, fontWeight: 'bold' },
  eventItem: { backgroundColor: '#f9f9f9', borderRadius: 5, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  eventType: { fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 5 },
  eventDetail: { fontSize: 14, color: '#333', flexShrink: 1 },
  noDataText: { fontSize: 16, color: '#757575', textAlign: 'center', padding: 20 },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  mapButton: {
    marginLeft: 10,
  }
});

export default StatusScreen;
