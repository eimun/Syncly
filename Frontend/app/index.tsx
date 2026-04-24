import React from "react";
import { Text, View, StyleSheet, ScrollView, Pressable, Dimensions, Platform, SafeAreaView } from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { useQuery } from "@tanstack/react-query";
import { useTransition } from "./_layout";
import { useGameStore } from "../store";
import { apiGetUser } from "../services/api";
import { Redirect } from "expo-router";

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = width * 0.24;

export default function Index() {
  const { navigateWithTransition } = useTransition();
  const { user, setUser, currentXp, nextLevelXp, level, theme } = useGameStore();

  const isLight = theme === 'light';
  const localStyles = getStyles(theme);
  const xpPercentage = nextLevelXp > 0 ? (currentXp / nextLevelXp) * 100 : 0;

  // Keep user data fresh from the backend
  useQuery({
    queryKey: ['user'],
    queryFn: apiGetUser,
    enabled: !!user,
    onSuccess: (data) => {
      if (user && data) {
        setUser({
          ...user,
          username: data.display_name,
          xp: data.xp,
          level: data.level,
        });
      }
    },
  } as any);

  if (!user) {
    return <Redirect href="/userAuth" />;
  }

  return (
    <View style={localStyles.container}>
      <StatusBar style={isLight ? "dark" : "light"} />

      <View style={localStyles.glowPositioner} pointerEvents="none">
        <View style={localStyles.ambientBloomInner} />
        <View style={localStyles.subtleStreak} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={localStyles.topSpacing} />

        <ScrollView contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* XP Card */}
          <MotiView
            from={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={localStyles.glassLevelCard}
          >
            <View style={localStyles.levelHeader}>
              <View>
                <Text style={localStyles.welcomeLabel}>CHAMPION</Text>
                <Text style={localStyles.welcomeText}>{user.username.toUpperCase()}</Text>
              </View>
              <View style={localStyles.xpBadge}>
                <Text style={localStyles.xpScoreText}>{currentXp}</Text>
                <Image style={localStyles.profileIconSmall} source={require('../assets/images/userIcon.png')} />
              </View>
            </View>

            <View style={localStyles.progressBarContainer}>
              <MotiView
                from={{ width: '0%' }}
                animate={{ width: `${xpPercentage}%` as any }}
                transition={{ type: 'timing', duration: 600, delay: 200 }}
                style={localStyles.progressBarFill}
              />
            </View>

            <Text style={localStyles.progressText}>
              LEVEL {level}  •  {currentXp} / {nextLevelXp} XP
            </Text>
          </MotiView>

          <View style={localStyles.mainBodyRow}>
            {/* Avatar placeholder */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400, delay: 150 }}
              style={localStyles.glassAvatarWrapper}
            >
              <View style={localStyles.avatarInner}>
                <Text style={localStyles.placeholderText}>INITIALIZING_SYSTEM...</Text>
              </View>
            </MotiView>

            {/* Action buttons */}
            <View style={localStyles.buttonColumn}>
              <MotiView from={{ opacity: 0, translateX: 16 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 200 }}>
                <Pressable
                  style={({ pressed }) => [localStyles.actionButton, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
                  onPress={() => navigateWithTransition("/tasks", "wipe")}
                >
                  <View style={localStyles.glassIconCircle}>
                    <Image style={localStyles.questIconInner} source={require('../assets/images/questIcon.png')} contentFit="contain" />
                  </View>
                  <Text style={localStyles.buttonLabel}>Quests</Text>
                </Pressable>
              </MotiView>

              <MotiView from={{ opacity: 0, translateX: 16 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 300 }}>
                <Pressable
                  style={({ pressed }) => [localStyles.actionButton, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
                  onPress={() => navigateWithTransition("/timer", "shutter")}
                >
                  <View style={localStyles.glassIconCircle}>
                    <Image style={localStyles.focusIconInner} source={require('../assets/images/clock icon.png')} contentFit="contain" />
                  </View>
                  <Text style={localStyles.buttonLabel}>Focus</Text>
                </Pressable>
              </MotiView>
            </View>
          </View>

          {/* Stat rows */}
          <View style={localStyles.statsContainer}>
            {[
              { label: 'IDENTITY_TAG', value: `@${user.username.toLowerCase()}` },
              { label: 'EMAIL',        value: user.email || '—' },
              { label: 'CLASS',        value: 'Knight' },
            ].map((row, i) => (
              <MotiView
                key={i}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 350 + i * 70 }}
                style={localStyles.etchedStatRow}
              >
                <Text style={localStyles.statLabel}>{row.label}</Text>
                <Text style={localStyles.statValue}>{row.value}</Text>
              </MotiView>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Nav */}
      <View style={localStyles.bottomNav}>
        <Pressable onPress={() => navigateWithTransition("/settings", "zoom")}>
          <Image style={localStyles.navIcon} source={require('../assets/images/settings.png')} />
        </Pressable>
        <Pressable onPress={() => navigateWithTransition("/", "zoom")}>
          <Image style={[localStyles.navIcon, { tintColor: isLight ? '#8000FF' : '#FF6500' }]} source={require('../assets/images/Home.png')} />
        </Pressable>
        <Pressable onPress={() => navigateWithTransition("/userdetails", "zoom")}>
          <Image style={localStyles.navIcon} source={require('../assets/images/userIcon.png')} />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (theme: 'dark' | 'light') => {
  const isLight = theme === 'light';
  const primaryText = isLight ? '#000000' : '#FFFFFF';
  const accent = isLight ? '#8000FF' : '#FF6500';
  const bg = isLight ? '#FFFFFF' : '#050506';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    topSpacing: { height: Platform.OS === 'ios' ? 40 : 50 },
    glowPositioner: { position: 'absolute', top: 200, right: -100, width: 300, height: 300, zIndex: -1 },
    ambientBloomInner: { width: 250, height: 250, borderRadius: 125, backgroundColor: isLight ? 'rgba(128,0,255,0.15)' : 'rgba(255,101,0,0.15)' },
    subtleStreak: { position: 'absolute', width: height, height: 1, backgroundColor: isLight ? 'rgba(128,0,255,0.2)' : 'rgba(255,101,0,0.2)', transform: [{ rotate: '45deg' }] },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
    glassLevelCard: { backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' },
    levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    welcomeLabel: { color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    welcomeText: { color: accent, fontSize: 32, fontWeight: '900' },
    xpBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    xpScoreText: { color: primaryText, fontSize: 14, fontWeight: '800' },
    profileIconSmall: { width: 20, height: 20, borderRadius: 10 },
    progressBarContainer: { height: 6, backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 20, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: accent },
    progressText: { color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', marginTop: 10, textAlign: 'center' },
    mainBodyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    glassAvatarWrapper: { width: '58%', height: 320, backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', borderRadius: 24, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' },
    avatarInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)', fontWeight: '900', fontSize: 10, letterSpacing: 4, transform: [{ rotate: '-90deg' }] },
    buttonColumn: { width: '35%', gap: 20, alignItems: 'center' },
    actionButton: { alignItems: 'center', width: '100%' },
    glassIconCircle: { width: BUTTON_SIZE, height: BUTTON_SIZE, borderRadius: BUTTON_SIZE / 2, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)', backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    questIconInner: { width: '50%', height: '50%', tintColor: isLight ? '#000000' : undefined },
    focusIconInner: { width: '50%', height: '50%', tintColor: isLight ? '#000000' : undefined },
    buttonLabel: { color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    statsContainer: { marginTop: 25, gap: 10 },
    etchedStatRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)' },
    statLabel: { color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '800' },
    statValue: { color: primaryText, fontSize: 14, fontWeight: '600' },
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: isLight ? '#F5F5F5' : 'rgba(10,10,12,0.98)', height: 90, position: 'absolute', bottom: 0, width: '100%', borderTopWidth: 1, borderTopColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)', paddingBottom: Platform.OS === 'ios' ? 25 : 10 },
    navIcon: { width: 22, height: 22, tintColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' },
  });
};