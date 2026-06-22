# MamaPlus Mobile

Expo React Native app for the MamaPlus caregiving platform.

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your device (for development)
- The **MamaPlus portal** (`mamaplus` repo) running — the mobile app calls its API

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_URL to your portal's address

# 3. Start Expo
npx expo start --clear
```

## API Connection

The app connects to the MamaPlus Next.js portal API. Configure the URL in `.env`:

| Environment | URL |
|---|---|
| Local dev (web/iOS sim) | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` |
| Physical device | `http://<YOUR_PC_LAN_IP>:3000` |
| Production | `https://mamaplus.co.ke` |

The app auto-detects the LAN IP from Expo Metro when using Expo Go on a physical device.

## Project Structure

```
mamaplus-mobile/
├── App.tsx                    # Root: auth-gated stack + tab navigator
├── app.config.js              # Expo config (OAuth, app metadata)
├── src/
│   ├── api/
│   │   └── client.ts          # HTTP client, auth storage (SecureStore)
│   ├── components/            # Shared UI components
│   ├── context/
│   │   └── AuthContext.tsx    # Auth state (sign in/out, session restore)
│   ├── navigation/
│   │   └── TabNavigator.tsx   # Bottom tab bar (Home, Courses, Profile)
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── CoursesScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── LoadingScreen.tsx
│   ├── constants.ts           # API URL resolution, role labels
│   └── types.ts               # TypeScript types
└── assets/                    # Icons, splash screen
```

## API Endpoints Used

All endpoints are on the MamaPlus portal (`mamaplus` repo):

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/users/login` | Email/password sign in |
| POST | `/api/users/register` | New account registration |
| POST | `/api/auth/social` | Google / Microsoft OAuth |
| GET | `/api/enrollments` | Fetch enrolled courses |

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS (first time)
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

Set `EXPO_PUBLIC_API_URL=https://mamaplus.co.ke` in your EAS environment variables before building.
