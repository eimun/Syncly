import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  Dimensions, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { apiGetUser, apiCreateUser } from '../services/api';
import { API_BASE_URL } from '../constants/config';
import { useGameStore } from '../store';
import { useTransition } from './_layout';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const getAuthErrorMessage = (code?: string) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Switch to sign in or use a different email.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is disabled for this Firebase project.';
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    case 'auth/invalid-api-key':
      return 'Firebase API key is invalid. Update your frontend Firebase environment variables.';
    case 'auth/app-not-authorized':
      return 'This app is not authorized in Firebase. Check authorized domains and API key restrictions.';
    default:
      return 'Authentication failed. Check your Firebase configuration and try again.';
  }
};

export default function UserAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setUser, theme } = useGameStore();
  const { navigateWithTransition } = useTransition();

  const isLight = theme === 'light';
  const styles = getStyles(theme);

  const handleAuth = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('INPUT_REQUIRED', 'Email and password cannot be empty.');
      return;
    }
    setLoading(true);
    console.log('--- Auth Started ---');
    console.log('Targeting API:', API_BASE_URL);
    try {
      let credential;
      if (isSignUp) {
        const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
        if (methods.length > 0) {
          setIsSignUp(false);
          Alert.alert(
            'ACCOUNT_EXISTS',
            'This email is already registered. Switched to sign in mode—enter your password to continue.'
          );
          return;
        }
        console.log(`Attempting Firebase Sign Up for: \"${normalizedEmail}\"`);
        credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        console.log('Firebase Sign Up Success:', credential.user.uid);
      } else {
        console.log('Attempting Firebase Sign In...');
        credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        console.log('Firebase Sign In Success:', credential.user.uid);
      }

      // Sync with backend
      console.log('Syncing with Backend...');
      let userData;
      try {
        userData = await apiGetUser();
        console.log('User found in DB:', userData.display_name);
      } catch (err) {
        console.log('User not found in DB, creating record...');
        userData = await apiCreateUser(normalizedEmail.split('@')[0]);
        console.log('User created in DB:', userData.display_name);
      }

      setUser({
        uid: credential.user.uid,
        email: credential.user.email ?? '',
        username: userData.display_name,
        xp: userData.xp ?? 0,
        level: userData.level ?? 1,
      });

      console.log('Store updated, navigating...');
      navigateWithTransition('/', 'zoom');
    } catch (err: any) {
      console.error('AUTH_ERROR_LOG:', err);
      if (isSignUp && err?.code === 'auth/email-already-in-use') {
        setIsSignUp(false);
      }
      const msg = getAuthErrorMessage(err?.code);
      Alert.alert('AUTH_ERROR', msg);
    } finally {
      console.log('--- Auth Finished ---');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isLight ? 'dark' : 'light'} />

      {/* Background Grid */}
      <View style={styles.gridContainer} pointerEvents="none">
        {[...Array(Math.floor(height / 40))].map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: i * 40 }]} />
        ))}
        {[...Array(Math.floor(width / 40))].map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: i * 40 }]} />
        ))}
      </View>
      <View style={styles.glowSourceTop} />
      <View style={styles.glowSourceBottom} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subHeading}>SYSTEM_ACCESS</Text>
          <Text style={styles.heading}>{isSignUp ? 'REGISTER' : 'INITIALIZE'}</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IDENTITY_TAG</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              selectionColor={isLight ? '#8000FF' : '#FF6500'}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSCODE</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              selectionColor={isLight ? '#8000FF' : '#FF6500'}
            />
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              email.trim() && password ? styles.loginButtonActive : styles.loginButtonDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleAuth}
            disabled={loading || !email.trim() || !password}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>
                {isSignUp ? 'CREATE_ACCOUNT' : 'AUTHENTICATE'}
              </Text>
            )}
          </Pressable>

          {/* Toggle Sign In / Sign Up */}
          <Pressable style={styles.toggleRow} onPress={() => setIsSignUp((v) => !v)}>
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account?  SIGN IN'
                : "Don't have an account?  REGISTER"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: 'dark' | 'light') => {
  const isLight = theme === 'light';
  const primaryText = isLight ? '#000000' : '#FFFFFF';
  const accent = isLight ? '#8000FF' : '#FF6500';
  const bg = isLight ? '#FFFFFF' : '#050506';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    gridContainer: { ...StyleSheet.absoluteFillObject, opacity: isLight ? 0.08 : 0.05, zIndex: -2 },
    gridLineH: { position: 'absolute', width: '100%', height: 1, backgroundColor: isLight ? '#000000' : '#FFFFFF' },
    gridLineV: { position: 'absolute', height: '100%', width: 1, backgroundColor: isLight ? '#000000' : '#FFFFFF' },
    glowSourceTop: { position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: isLight ? 'rgba(128,0,255,0.15)' : 'rgba(255,101,0,0.15)', zIndex: -1 },
    glowSourceBottom: { position: 'absolute', bottom: -150, right: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: isLight ? 'rgba(128,0,255,0.08)' : 'rgba(255,101,0,0.08)', zIndex: -1 },
    content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', paddingBottom: 50 },
    header: { marginBottom: 50 },
    subHeading: { color: isLight ? 'rgba(128,0,255,0.8)' : 'rgba(255,101,0,0.8)', fontSize: 12, fontWeight: '800', letterSpacing: 4, marginBottom: 8 },
    heading: { color: primaryText, fontSize: 42, fontWeight: '900', letterSpacing: -1 },
    formContainer: { backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' },
    inputGroup: { marginBottom: 24 },
    inputLabel: { color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
    input: { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', height: 56, borderRadius: 12, paddingHorizontal: 16, color: primaryText, fontSize: 16, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' },
    loginButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    loginButtonActive: { backgroundColor: accent },
    loginButtonDisabled: { backgroundColor: isLight ? 'rgba(128,0,255,0.2)' : 'rgba(255,101,0,0.2)' },
    loginButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
    toggleRow: { marginTop: 20, alignItems: 'center' },
    toggleText: { color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  });
};
