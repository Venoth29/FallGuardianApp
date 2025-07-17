import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, LogBox, PermissionsAndroid, Platform, ActivityIndicator } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Geolocation from 'react-native-geolocation-service';
// --- NEW: Import Firebase Messaging and the RemoteMessage type ---
import messaging from '@react-native-firebase/messaging';

import AuthScreen from './AuthScreen';
import ContactsScreen from './ContactsScreen';
import SettingsScreen from './SettingsScreen';
import StatusScreen from './StatusScreen';
import TutorialScreen from './TutorialScreen';
import DevicePairingScreen from './DevicePairingScreen';
import FallAlertModal from './FallAlertModal';
import CustomAlert from './CustomAlert';

LogBox.ignoreLogs([ "This method is deprecated" ]);

// --- The Dashboard Component ---
const Dashboard: React.FC<{ onSimulateFall: () => void; onPanic: () => void; isPanicInProgress: boolean; onFallDetected: (location: string) => void; isSimulatingFall: boolean; }> = ({ onSimulateFall, onPanic, isPanicInProgress, onFallDetected, isSimulatingFall }) => {
    const [activeTab, setActiveTab] = useState('tutorial');
    const [showPairingScreen, setShowPairingScreen] = useState(false);

    const handleSignOut = async () => {
        try { await auth().signOut(); } catch (error) { console.error(error); }
    };
    
    const renderContent = () => {
        if (showPairingScreen) {
            return <DevicePairingScreen onFallDetected={onFallDetected} />;
        }
        switch (activeTab) {
            case 'tutorial': return <TutorialScreen />;
            case 'status': return <StatusScreen />;
            case 'contacts': return <ContactsScreen />;
            case 'settings': return <SettingsScreen onNavigateToPairing={() => setShowPairingScreen(true)} onSimulateFall={onSimulateFall} isSimulatingFall={isSimulatingFall} />;
            default: return <TutorialScreen />;
        }
    };

    return (
        <View style={{flex: 1}}>
            <View style={styles.header}>
                {showPairingScreen ? (
                     <TouchableOpacity onPress={() => setShowPairingScreen(false)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={onPanic} style={styles.panicButton} disabled={isPanicInProgress}>
                        {isPanicInProgress ? <ActivityIndicator color="#fff" /> : <Text style={styles.signOutButtonText}>PANIC</Text>}
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>Fall Guardian</Text>
                <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            {!showPairingScreen && (
                <View style={styles.tabsContainer}>
                    <TouchableOpacity onPress={() => setActiveTab('tutorial')} style={[styles.tabButton, activeTab === 'tutorial' && styles.activeTab]}><Text style={styles.tabText}>Tutorial</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('status')} style={[styles.tabButton, activeTab === 'status' && styles.activeTab]}><Text style={styles.tabText}>Status</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('contacts')} style={[styles.tabButton, activeTab === 'contacts' && styles.activeTab]}><Text style={styles.tabText}>Contacts</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('settings')} style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}><Text style={styles.tabText}>Settings</Text></TouchableOpacity>
                </View>
            )}
            <View style={styles.contentArea}>{renderContent()}</View>
        </View>
    );
};


// --- The Main App Component ---
const App: React.FC = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>();
  const [fallAlert, setFallAlert] = useState<{ isVisible: boolean; location: string | null }>({ isVisible: false, location: null });
  const [customAlert, setCustomAlert] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({ isVisible: false, message: '', type: 'success'});
  const [isPanicInProgress, setIsPanicInProgress] = useState(false);
  const [isSimulatingFall, setIsSimulatingFall] = useState(false);

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      getFcmToken();
    }
  }

  async function getFcmToken() {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('Your Firebase Cloud Messaging Token is:', fcmToken);
      const currentUserId = auth().currentUser?.uid;
      if (currentUserId) {
        firestore().collection('users').doc(currentUserId).collection('deviceTokens').doc(fcmToken).set({
            createdAt: firestore.FieldValue.serverTimestamp(),
            platform: Platform.OS,
        });
      }
    } else {
      console.log('Failed to get FCM token');
    }
  }

  useEffect(() => {
    requestUserPermission();

    // --- FIXED: Changed the type of remoteMessage to 'any' to resolve the error ---
    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
      if (remoteMessage.data && remoteMessage.data.location) {
        setFallAlert({ isVisible: true, location: remoteMessage.data.location });
      }
    });

    return unsubscribe;
  }, []);


  const handleFallDetected = (location: string) => { /* ... */ };
  const handleSimulateFall = async () => { /* ... */ };
  const handlePanicFromApp = async () => { /* ... */ };

  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) { setUser(user); if (initializing) setInitializing(false); }
  useEffect(() => { const subscriber = auth().onAuthStateChanged(onAuthStateChanged); return subscriber; }, []);
  
  if (initializing) return null;
  
  if (!user) { return <AuthScreen />; }

  return ( 
    <SafeAreaView style={styles.container}>
        <Dashboard 
            onSimulateFall={handleSimulateFall} 
            onPanic={handlePanicFromApp} 
            isPanicInProgress={isPanicInProgress} 
            isSimulatingFall={isSimulatingFall}
            onFallDetected={handleFallDetected}
        />
        
        <FallAlertModal 
            isVisible={fallAlert.isVisible}
            location={fallAlert.location}
            onDismiss={() => setFallAlert({ isVisible: false, location: null })}
        />
        <CustomAlert
            isVisible={customAlert.isVisible}
            message={customAlert.message}
            type={customAlert.type}
            onClose={() => setCustomAlert({ ...customAlert, isVisible: false })}
        />
    </SafeAreaView> 
  );
};


// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { padding: 15, paddingTop: 40, backgroundColor: '#0d47a1', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  signOutButton: { backgroundColor: '#6c757d', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5 },
  signOutButtonText: { color: 'white', fontWeight: 'bold' },
  backButton: { backgroundColor: '#6c757d', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 5 },
  backButtonText: { color: 'white', fontWeight: 'bold' },
  panicButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'white', elevation: 2 },
  tabButton: { flex: 1, paddingVertical: 15, paddingHorizontal: 5, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#0d47a1' },
  tabText: { fontSize: 14, color: '#333', textAlign: 'center' },
  contentArea: { flex: 1 },
});

export default App;
