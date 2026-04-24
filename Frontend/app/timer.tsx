import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Dimensions, Keyboard, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useGameStore } from '../store';
 
const { width } = Dimensions.get('window');
 

const AUDIO_URI = 'https://YOUR_HOST/lofi.wav';
// ─────────────────────────────────────────────────────────────────────────────
 
const TimerApp = () => {
  const [minutes, setMinutes] = useState('45');
  const [secondsLeft, setSecondsLeft] = useState(45 * 60);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const { theme } = useGameStore();
  const isLight = theme === 'light';
  const localStyles = getStyles(theme);
 
  // 1. Initial Sound Setup — loaded from URI, never touches the bundler
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
 
        const { sound } = await Audio.Sound.createAsync(
          { uri: AUDIO_URI },
          { shouldPlay: false, isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
      } catch (error) {
        console.log('Audio load error:', error);
      }
    }
    setupAudio();
 
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);
 
  // 2. Timer Logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
 
      soundRef.current?.playAsync().catch(() => {});
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      soundRef.current?.pauseAsync().catch(() => {});
    }
 
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);
 
  // 3. Stop sound when timer hits zero
  useEffect(() => {
    if (secondsLeft === 0) {
      soundRef.current?.stopAsync().catch(() => {});
    }
  }, [secondsLeft]);
 
  const formatTime = () => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
 
  const handleInputChange = (val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal.length <= 3) {
      setMinutes(cleanVal);
      setSecondsLeft((parseInt(cleanVal) || 0) * 60);
    }
  };
 
  return (
    <View style={localStyles.container}>
      <View style={[localStyles.bgGlow, { opacity: isActive ? 0.3 : 0.1, top: 100, left: -50 }]} />
      <View style={[localStyles.bgGlow, { opacity: isActive ? 0.2 : 0.05, bottom: 50, right: -100, backgroundColor: isLight ? '#BF80FF' : '#FF2D00' }]} />
 
      <View style={localStyles.glassCard}>
        <LinearGradient colors={isLight ? ['rgba(0,0,0,0.06)', 'transparent'] : ['rgba(255,255,255,0.12)', 'transparent']} style={localStyles.specularHighlight} />
 
        <Text style={localStyles.label}>FOCUS SESSION</Text>
 
        <View style={localStyles.timerOuterRing}>
          <LinearGradient
            colors={isActive ? (isLight ? ['#8000FF', '#BF80FF'] : ['#FF6500', '#FF2D00']) : (isLight ? ['#E0E0E0', '#CCCCCC'] : ['#333', '#111'])}
            style={localStyles.timerCircle}
          >
            <View style={localStyles.innerCore}>
              <View style={localStyles.artifactReflection} />
              <Text style={[localStyles.timerText, isActive && localStyles.glowText]}>
                {formatTime()}
              </Text>
            </View>
          </LinearGradient>
        </View>
 
        <View style={localStyles.inputContainer}>
          <TextInput
            style={[localStyles.input, isActive && { opacity: 0.5 }]}
            keyboardType="number-pad"
            value={minutes}
            onChangeText={handleInputChange}
            placeholder="00"
            placeholderTextColor={isLight ? "#999" : "#333"}
            editable={!isActive}
          />
          <Text style={localStyles.inputLabel}>MINUTES</Text>
        </View>
 
        <View style={localStyles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              localStyles.mainButton,
              pressed && { transform: [{ scale: 0.97 }] }
            ]}
            onPress={() => {
              Keyboard.dismiss();
              setIsActive(!isActive);
            }}
          >
            {isActive ? (
              <View style={localStyles.buttonHalt}>
                <Text style={localStyles.buttonTextHalt}>HALT</Text>
              </View>
            ) : (
              <LinearGradient
                colors={isLight ? ['#A64DFF', '#8000FF'] : ['#FF8533', '#FF6500']}
                style={localStyles.buttonGradient}
              >
                <Text style={localStyles.buttonText}>IGNITE</Text>
              </LinearGradient>
            )}
          </Pressable>
 
          <Pressable
            onPress={() => {
              setIsActive(false);
              setSecondsLeft((parseInt(minutes) || 0) * 60);
              soundRef.current?.stopAsync().catch(() => {});
            }}
          >
            <Text style={localStyles.resetText}>RESET SYSTEM</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
 
const getStyles = (theme: 'dark' | 'light') => {
  const isLight = theme === 'light';
  const primaryText = isLight ? '#000000' : '#FFFFFF';
  const accent = isLight ? '#8000FF' : '#FF6500';
  const bg = isLight ? '#FFFFFF' : '#050505';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
    bgGlow: { position: 'absolute', width: width, height: width, borderRadius: width / 2, backgroundColor: accent },
    glassCard: { width: width * 0.9, paddingVertical: 50, borderRadius: 40, borderWidth: 1, borderColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)', alignItems: 'center', backgroundColor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(25, 25, 28, 0.85)', overflow: 'hidden' },
    specularHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
    label: { color: accent, fontSize: 10, letterSpacing: 6, fontWeight: '900', marginBottom: 40 },
    timerOuterRing: { padding: 10, borderRadius: 120, backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)', marginBottom: 40 },
    timerCircle: { width: 210, height: 210, borderRadius: 105, padding: 2 },
    innerCore: { flex: 1, borderRadius: 105, backgroundColor: isLight ? '#FAFAFA' : '#0a0a0c', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    artifactReflection: { position: 'absolute', top: '10%', left: '20%', width: '60%', height: '20%', backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', borderRadius: 50, transform: [{ rotate: '-15deg' }] },
    timerText: { color: primaryText, fontSize: 54, fontWeight: '200', ...Platform.select({ ios: { fontFamily: 'Courier' }, android: { fontFamily: 'monospace' } }) },
    glowText: { textShadowColor: isLight ? 'rgba(128, 0, 255, 0.5)' : 'rgba(255, 101, 0, 0.8)', textShadowRadius: 12 },
    inputContainer: { alignItems: 'center', marginBottom: 40 },
    input: { color: primaryText, fontSize: 32, fontWeight: '800', width: 120, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: isLight ? 'rgba(128, 0, 255, 0.5)' : 'rgba(255, 101, 0, 0.5)' },
    inputLabel: { color: accent, fontSize: 9, letterSpacing: 2, marginTop: 10, fontWeight: '700', opacity: 0.6 },
    buttonRow: { width: '100%', alignItems: 'center', gap: 20 },
    mainButton: { width: '75%', height: 58, borderRadius: 16, overflow: 'hidden' },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    buttonHalt: { flex: 1, borderWidth: 1.5, borderColor: accent, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
    buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 4 },
    buttonTextHalt: { color: accent, fontSize: 13, fontWeight: '900', letterSpacing: 4 },
    resetText: { color: isLight ? '#888' : '#444', fontSize: 10, fontWeight: '800', letterSpacing: 2, padding: 10 }
  });
};
 
export default TimerApp;