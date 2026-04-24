import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Base URL for the Questify backend API.
 * Priority:
 * 1) EXPO_PUBLIC_API_BASE_URL (manual override)
 * 2) Auto-detected host from Expo dev server (native)
 * 3) localhost fallback (web)
 */
const DEFAULT_BACKEND_PORT = '5000';

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const getExpoDevHost = (): string | null => {
  const expoConfigHost = (Constants.expoConfig as any)?.hostUri as string | undefined;
  const manifest2Host = (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost as string | undefined;
  const manifestHost = (Constants as any)?.manifest?.debuggerHost as string | undefined;

  const hostWithPort = expoConfigHost || manifest2Host || manifestHost;
  return hostWithPort ? hostWithPort.split(':')[0] : null;
};

const defaultBaseUrl = () => {
  if (Platform.OS === 'web') {
    return `http://127.0.0.1:${DEFAULT_BACKEND_PORT}`;
  }
  const detectedHost = getExpoDevHost() || '127.0.0.1';
  return `http://${detectedHost}:${DEFAULT_BACKEND_PORT}`;
};

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = stripTrailingSlash(
  envBaseUrl && envBaseUrl.length > 0 ? envBaseUrl : defaultBaseUrl()
);

console.log(`[CONFIG] API_BASE_URL set to: ${API_BASE_URL} (Platform: ${Platform.OS})`);

