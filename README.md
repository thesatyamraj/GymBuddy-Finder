# 🏋️ GymBuddy Finder

GymBuddy Finder is a **React Native + Firebase** mobile app designed to help fitness enthusiasts connect with workout partners based on their gym, workout type, and preferred timing.  
Built with **Expo**, **Firestore**, and **React Navigation**, this app brings a Tinder-style swipe experience to fitness networking.

---

## 🚀 Features

- 🔐 **User Authentication** (via Firebase Auth)
- 🧍‍♂️ **Profile Creation & Editing**
  - Add your gym name, workout type, timing, and profile photo  
  - Photos are stored securely and displayed in Base64 format or Firebase Storage
- 💪 **Swipe to Connect**
  - Swipe right to like, left to skip — match when both users like each other
- ❤️ **Match System**
  - Real-time notifications when a match occurs
- 💬 **Chat System**
  - Real-time messaging between matched users (Firestore)
- 🧠 **Firestore Security Rules**
  - Secure per-user data access and message privacy
- ⚙️ **Persistent Sessions**
  - Users stay logged in until they sign out

---

## 🧩 Tech Stack

| Category | Technology |
|-----------|-------------|
| Framework | [React Native (Expo)](https://expo.dev) |
| Backend | [Firebase Authentication](https://firebase.google.com/docs/auth) |
| Database | [Cloud Firestore](https://firebase.google.com/docs/firestore) |
| Storage | Firebase Storage / Base64 |
| Navigation | [React Navigation](https://reactnavigation.org/) |
| Swiping UI | [react-native-deck-swiper](https://github.com/alexbrillant/react-native-deck-swiper) |
| Icons | [Expo Vector Icons (Ionicons)](https://docs.expo.dev/guides/icons/) |

---

## 📱 Screens Overview

| Screen | Description |
|--------|--------------|
| `AuthScreen` | Handles user login and registration |
| `ProfileSetupScreen` | First-time profile setup after signup |
| `SwipeScreen` | Swipe left/right to find gym buddies |
| `MatchesScreen` | View matched users |
| `ChatsScreen` | Displays all active chats |
| `ChatScreen` | Real-time one-on-one chat |
| `ProfileScreen` | View user profile |
| `EditProfileScreen` | Edit user details and photo |

---

## 🛠️ Installation & Setup (Mac / Expo CLI)

```bash
# 1️⃣ Clone this repository
git clone https://github.com/thesatyamraj/GymBuddy-Finder.git
cd GymBuddy-Finder

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start Expo
npx expo start
Folder Structure
gym-buddy-classic/
│
├── assets/               # App assets (icons, images)
├── navigation/           # All navigation and tab files
├── screens/              # All screen components
│   ├── AuthScreen.js
│   ├── ProfileSetupScreen.js
│   ├── SwipeScreen.js
│   ├── MatchesScreen.js
│   ├── ChatsScreen.js
│   ├── ChatScreen.js
│   ├── ProfileScreen.js
│   └── EditProfileScreen.js
│
├── firebase.js           # Firebase initialization
├── App.js                # Root app entry
├── app.json              # Expo app configuration
└── package.json          # Dependencies & scripts
