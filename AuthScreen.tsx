import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import CustomAlert from './CustomAlert';

// --- Reusable UI Components ---
type PrimaryButtonProps = { title: string; onPress: () => void; };
const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{title}</Text></TouchableOpacity>
);

// --- The Authentication Screen Component ---
const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [alertInfo, setAlertInfo] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({ isVisible: false, message: '', type: 'success' });

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      setAlertInfo({ isVisible: true, message: 'Please enter both email and password.', type: 'error'});
      return;
    }
    try {
      if (isLogin) {
        await auth().signInWithEmailAndPassword(email, password);
      } else {
        await auth().createUserWithEmailAndPassword(email, password);
      }
    } catch (error: any) {
      let userFriendlyMessage = 'An unexpected error occurred. Please try again.';
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-email'
      ) {
        userFriendlyMessage = 'Incorrect email or password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        userFriendlyMessage = 'An account with this email address already exists.';
      }
      setAlertInfo({ isVisible: true, message: userFriendlyMessage, type: 'error'});
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
        setAlertInfo({ isVisible: true, message: 'Please enter your email address first.', type: 'error'});
        return;
    }
    try {
        await auth().sendPasswordResetEmail(email);
        setAlertInfo({ isVisible: true, message: 'Password reset link sent! Please check your email.', type: 'success'});
    } catch (error: any) {
        let userFriendlyMessage = 'Could not send reset email. Please try again.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            userFriendlyMessage = 'No account found with this email address.';
        }
        setAlertInfo({ isVisible: true, message: userFriendlyMessage, type: 'error'});
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.authTitle}>{isLogin ? 'Welcome Back' : 'Create Your Account'}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          autoCapitalize="none" 
        />
      </View>
      
      <PrimaryButton title={isLogin ? 'Log In' : 'Create Account'} onPress={handleAuthSubmit} />

      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggleAuthModeText}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
          </Text>
        </TouchableOpacity>

        {isLogin && (
            <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
        )}
      </View>

      <CustomAlert 
        isVisible={alertInfo.isVisible}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo({ ...alertInfo, isVisible: false })}
      />
    </View>
  );
};


const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f0f4f7' },
    authTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#0d47a1' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 16, color: '#424242', marginBottom: 5 },
    input: { height: 45, borderColor: '#bdbdbd', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, backgroundColor: '#fff' },
    button: { backgroundColor: '#1976d2', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    toggleAuthModeText: { 
        color: '#1976d2', 
        fontSize: 14, // Made font smaller
    },
    forgotPasswordText: {
        color: '#6c757d',
        fontSize: 14, // Made font smaller
    },
});

export default AuthScreen;