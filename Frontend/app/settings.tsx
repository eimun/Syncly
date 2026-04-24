import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Platform } from 'react-native';
import { useGameStore } from '../store';
import { useTransition } from './_layout';
import { Image } from 'expo-image';
import { usePathname } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

import { apiLogout } from '../services/api';

export default function Settings() {
  const { theme, toggleTheme, logout } = useGameStore();
  const { navigateWithTransition } = useTransition();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      // Optional: Notify backend to clear cache
      await apiLogout().catch(() => null); 
      await signOut(auth);
      logout();
      navigateWithTransition("/userAuth", "zoom");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isLight = theme === 'light';
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigateWithTransition("/", "zoom")} style={styles.backButton}>
          <Text style={styles.backText}>{"<"} BACK</Text>
        </Pressable>
        <Text style={styles.heading}>SYSTEM_CONFIG</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>AESTHETIC_MODE</Text>
          <View style={styles.switchWrapper}>
            <Text style={styles.switchLabel}>{isLight ? 'DAY' : 'NIGHT'}</Text>
            <Switch
              value={isLight}
              onValueChange={toggleTheme}
              trackColor={{ false: 'rgba(255, 101, 0, 0.4)', true: 'rgba(128, 0, 255, 0.4)' }}
              thumbColor={isLight ? '#8000FF' : '#FF6500'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>TERMINATE_SESSION (LOGOUT)</Text>
        </Pressable>
      </View>

      <View style={styles.bottomNav}>
        <Pressable onPress={() => {}}>
           <Image style={[styles.navIcon, pathname === '/settings' && { tintColor: isLight ? '#8000FF' : '#FF6500' }]} source={require('../assets/images/settings.png')} />
        </Pressable>
        <Pressable onPress={() => navigateWithTransition("/", "zoom")}>
          <Image style={styles.navIcon} source={require('../assets/images/Home.png')} />
        </Pressable>
        <Pressable onPress={() => navigateWithTransition("/userdetails", "zoom")}>
          <Image style={styles.navIcon} source={require('../assets/images/userIcon.png')} />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (theme: 'dark' | 'light') => {
  const isLight = theme === 'light';
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isLight ? '#FFFFFF' : '#050506',
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
    },
    backButton: { marginRight: 20 },
    backText: { color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)', fontWeight: '900', fontSize: 12 },
    heading: { color: isLight ? '#000000' : '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
    content: {
      flex: 1,
      padding: 20,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
    },
    settingLabel: {
      color: isLight ? '#000000' : '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 1,
    },
    switchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    switchLabel: {
      color: isLight ? '#8000FF' : '#FF6500',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2,
    },
    bottomNav: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: isLight ? '#F5F5F5' : 'rgba(10, 10, 12, 0.98)',
      height: 90,
      position: 'absolute',
      bottom: 0,
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
      paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    },
    navIcon: {
      width: 22,
      height: 22,
      tintColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
    },
    logoutButton: {
      marginTop: 40,
      height: 56,
      backgroundColor: isLight ? 'rgba(255, 0, 0, 0.05)' : 'rgba(255, 0, 0, 0.1)',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 0, 0, 0.3)',
    },
    logoutText: {
      color: '#FF4444',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 2,
    },
  });
};
