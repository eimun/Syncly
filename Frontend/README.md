# Questify

A mobile app built with React Native and Expo.

## Tech Stack

- **React Native** 0.81 with **New Architecture** enabled
- **Expo** SDK 54 with **Expo Router** for file-based navigation
- **TypeScript**
- **React Native Reanimated** for animations
- **Expo Image** for optimized image rendering

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your phone (for testing on a physical device)

## Getting Started

1. **Clone the repository**

   ```bash
git clone https://github.com/gauresh-7/Questify.git
   cd Questify
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   - Copy `.env.example` to `.env`
   - Fill in Firebase `EXPO_PUBLIC_FIREBASE_*` values from your Firebase project settings
   - Rotate previously exposed Firebase API keys before using this app
   - In Firebase Console, ensure Email/Password sign-in is enabled and your app/domain is authorized

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Run on a device or emulator**

   - Scan the QR code with the Expo Go app (Android) or the Camera app (iOS)
   - Or press `a` for Android emulator / `i` for iOS simulator

## Project Structure

```
Questify/
├── app/
│   ├── _layout.tsx    # Root layout (Stack navigator)
│   ├── index.tsx      # Home screen
│   └── styles.jsx     # Shared styles
├── assets/
│   └── images/        # App icons, splash screen, and other images
├── app.json           # Expo configuration
├── package.json
└── tsconfig.json
```

## Available Scripts

| Command           | Description            |
| ----------------- | ---------------------- |
| `npm start`       | Start Expo dev server  |
| `npm run android` | Start on Android       |
| `npm run ios`     | Start on iOS           |
| `npm run web`     | Start on web           |
| `npm run lint`    | Run ESLint             |

## License

This project is private.
