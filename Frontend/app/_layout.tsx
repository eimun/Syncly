import { Stack, useRouter } from "expo-router";
import { View, StyleSheet, Dimensions, Animated, Easing } from "react-native";
import { createContext, useContext, useRef, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { apiGetUser, apiCreateUser } from "../services/api";
import { useGameStore } from "../store";

const { width, height } = Dimensions.get("window");

// ── React Query client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

// ── Transition context ────────────────────────────────────────────────────────
type TransitionContextType = {
  navigateWithTransition: (path: any, mode?: "wipe" | "shutter" | "zoom") => void;
};

const TransitionContext = createContext<TransitionContextType>({
  navigateWithTransition: () => {},
});
export const useTransition = () => useContext(TransitionContext);

// ── Auth listener (inner — has access to store) ───────────────────────────────
function AuthListener() {
  const { setUser, logout } = useGameStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        logout();
        return;
      }
      try {
        let userData = await apiGetUser().catch(async (err) => {
          // 404 → first login, create the user record
          if (err.message.includes('404') || err.message.includes('User not found')) {
            return apiCreateUser(
              firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Adventurer'
            );
          }
          throw err;
        });
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          username: userData.display_name,
          xp: userData.xp ?? 0,
          level: userData.level ?? 1,
        });
      } catch (err) {
        console.warn('Failed to load user from backend:', err);
      }
    });
    return unsubscribe;
  }, []);

  return null;
}

// ── Root layout ───────────────────────────────────────────────────────────────
export default function RootLayout() {
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(-width * 1.5)).current;
  const shutterTop = useRef(new Animated.Value(-height / 2)).current;
  const shutterBottom = useRef(new Animated.Value(height)).current;
  const fadeZoom = useRef(new Animated.Value(0)).current;

  const { theme } = useGameStore();
  const isLight = theme === "light";

  const [activeMode, setActiveMode] = useState<"wipe" | "shutter" | "zoom" | null>(null);

  const navigateWithTransition = (path: any, mode: "wipe" | "shutter" | "zoom" = "wipe") => {
    setActiveMode(mode);

    if (mode === "wipe") {
      Animated.timing(slideAnim, {
        toValue: 0, duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true,
      }).start(() => {
        router.push(path);
        Animated.timing(slideAnim, {
          toValue: width * 1.5, duration: 250, delay: 50, useNativeDriver: true,
        }).start(() => { slideAnim.setValue(-width * 1.5); setActiveMode(null); });
      });
    } else if (mode === "shutter") {
      Animated.parallel([
        Animated.timing(shutterTop, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(shutterBottom, { toValue: height / 2, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        router.push(path);
        Animated.parallel([
          Animated.timing(shutterTop, { toValue: -height / 2, duration: 200, delay: 100, useNativeDriver: true }),
          Animated.timing(shutterBottom, { toValue: height, duration: 200, delay: 100, useNativeDriver: true }),
        ]).start(() => setActiveMode(null));
      });
    } else if (mode === "zoom") {
      Animated.timing(fadeZoom, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
        router.push(path);
        Animated.timing(fadeZoom, { toValue: 0, duration: 300, delay: 100, useNativeDriver: true })
          .start(() => setActiveMode(null));
      });
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TransitionContext.Provider value={{ navigateWithTransition }}>
        <AuthListener />
        <View style={{ flex: 1, backgroundColor: isLight ? "#FFFFFF" : "#050506" }}>
          <Stack screenOptions={{ headerShown: false, animation: "none" }} />

          {activeMode === "wipe" && (
            <Animated.View style={[styles.wipeOverlay, {
              transform: [{ translateX: slideAnim }, { skewX: "-10deg" }],
              backgroundColor: isLight ? "#F5F5F5" : "#000000",
            }]} />
          )}
          {activeMode === "shutter" && (
            <>
              <Animated.View style={[styles.shutterBar, { top: 0, transform: [{ translateY: shutterTop }], backgroundColor: isLight ? "#8000FF" : "#FF6500" }]} />
              <Animated.View style={[styles.shutterBar, { top: 0, transform: [{ translateY: shutterBottom }], backgroundColor: isLight ? "#8000FF" : "#FF6500" }]} />
            </>
          )}
          {activeMode === "zoom" && (
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: isLight ? "#FFFFFF" : "#050506", opacity: fadeZoom }]} />
          )}
        </View>
      </TransitionContext.Provider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  wipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    width: width * 1.3,
    left: -width * 0.15,
  },
  shutterBar: {
    position: "absolute",
    width,
    height: height / 2,
    zIndex: 9999,
  },
});