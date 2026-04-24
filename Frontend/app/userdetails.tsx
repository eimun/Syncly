import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { apiGetUser } from '../services/api';
import { useTransition } from './_layout';
import { useGameStore } from '../store';

const { width, height } = Dimensions.get('window');

const UserDetails = () => {
  const { navigateWithTransition } = useTransition();
  const { user, level, currentXp, nextLevelXp, logout, theme } = useGameStore();

  const isLight = theme === 'light';
  const styles = getStyles(theme);

  // Fetch fresh user data from backend
  const { data: freshUser } = useQuery({
    queryKey: ['user'],
    queryFn: apiGetUser,
    enabled: !!user,
  });

  const displayName = freshUser?.display_name ?? user?.username ?? 'UNKNOWN';
  const displayXp   = freshUser?.xp   ?? currentXp;
  const displayLevel = freshUser?.level ?? level;
  const xpToNext = nextLevelXp - displayXp;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch { /* ignore */ }
    logout();
    navigateWithTransition('/userAuth', 'wipe');
  };

  const rows = [
    { label: 'Name',          value: displayName.toUpperCase() },
    { label: 'Email',         value: user?.email ?? '—' },
    { label: 'Class',         value: 'Knight' },
    { label: 'Level',         value: displayLevel.toString() },
    { label: 'Next Ascension', value: `${xpToNext} XP` },
  ];

  return (
    <View style={styles.container}>
      {/* Micro-grid */}
      <View style={styles.gridContainer} pointerEvents="none">
        {[...Array(Math.floor(height / 40))].map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: i * 40 }]} />
        ))}
        {[...Array(Math.floor(width / 40))].map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: i * 40 }]} />
        ))}
      </View>
      <View style={styles.glowSource} />

      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.headerContainer}
      >
        <Text style={styles.heading}>Who art thou?</Text>
      </MotiView>

      {/* Avatar card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 100 }}
        style={styles.glassCard}
      >
        <View style={styles.avatarInner}>
          <Text style={styles.placeholderText}>Avatar Preview</Text>
        </View>
      </MotiView>

      {/* Detail rows */}
      <View style={styles.detailsContainer}>
        {rows.map((item, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, translateX: -12 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 150 + index * 60 }}
            style={styles.glassDetailRow}
          >
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </MotiView>
        ))}

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 550 }}
        >
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>TERMINATE SESSION</Text>
          </Pressable>
        </MotiView>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <Pressable onPress={() => navigateWithTransition('/settings', 'zoom')}>
          <Image style={styles.navIcon} source={require('../assets/images/settings.png')} />
        </Pressable>
        <Pressable onPress={() => navigateWithTransition('/', 'zoom')}>
          <Image style={styles.navIcon} source={require('../assets/images/Home.png')} />
        </Pressable>
        <Pressable onPress={() => {}}>
          <Image style={[styles.navIcon, { tintColor: isLight ? '#8000FF' : '#FF6500' }]} source={require('../assets/images/userIcon.png')} />
        </Pressable>
      </View>
    </View>
  );
};

const getStyles = (theme: 'dark' | 'light') => {
  const isLight = theme === 'light';
  const primaryText = isLight ? '#000000' : '#FFFFFF';
  const accent = isLight ? '#8000FF' : '#FF6500';
  const bg = isLight ? '#FFFFFF' : '#070708';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, alignItems: 'center', paddingTop: 80 },
    gridContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isLight ? 0.08 : 0.05 },
    gridLineH: { position: 'absolute', width: '100%', height: 0.5, backgroundColor: isLight ? '#000000' : 'rgba(255,255,255,0.4)' },
    gridLineV: { position: 'absolute', height: '100%', width: 0.5, backgroundColor: isLight ? '#000000' : 'rgba(255,255,255,0.4)' },
    glowSource: { position: 'absolute', bottom: 120, left: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: isLight ? 'rgba(128,0,255,0.15)' : 'rgba(255,101,0,0.15)' },
    headerContainer: { width: '100%', paddingHorizontal: 25, marginBottom: 30 },
    heading: { fontSize: 32, color: accent, fontWeight: '900', letterSpacing: -1, textShadowColor: isLight ? 'rgba(128,0,255,0.6)' : 'rgba(255,101,0,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
    glassCard: { width: width * 0.8, height: width * 0.8, backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 1, marginBottom: 40, borderWidth: 1.5, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' },
    avatarInner: { flex: 1, backgroundColor: isLight ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)', borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)', fontWeight: '700', fontSize: 10, letterSpacing: 4 },
    detailsContainer: { width: '100%', paddingHorizontal: 25, gap: 12 },
    glassDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', paddingVertical: 18, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' },
    label: { color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    value: { color: primaryText, fontSize: 17, fontWeight: '600' },
    logoutButton: { marginTop: 20, backgroundColor: isLight ? 'rgba(128,0,255,0.1)' : 'rgba(255,101,0,0.1)', borderWidth: 1, borderColor: isLight ? 'rgba(128,0,255,0.5)' : 'rgba(255,101,0,0.5)', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    logoutText: { color: accent, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: isLight ? '#F5F5F5' : 'rgba(7,7,8,0.92)', height: 90, position: 'absolute', bottom: 0, width: '100%', borderTopWidth: 1, borderTopColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', paddingBottom: 20 },
    navIcon: { width: 24, height: 24, tintColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)' },
  });
};

export default UserDetails;