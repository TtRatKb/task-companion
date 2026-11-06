/**
 * The same public Firebase web-app configuration already used by Life RPG.
 * Task Companion stores data ONLY in its own /users/{uid}/taskCompanion/state
 * document and does not touch Life RPG save documents.
 * This configuration is public client metadata, not an authentication secret.
 *
 * Firebase's GitHub Pages authorized-domain and per-UID Firestore rules
 * must be configured before cloud functionality can be used.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBFW-vUovZVkqTrxz-6UgZbSkH3eHjK-Ns",
  authDomain: "life-rpg-3afb7.firebaseapp.com",
  projectId: "life-rpg-3afb7",
  storageBucket: "life-rpg-3afb7.firebasestorage.app",
  messagingSenderId: "88670369654",
  appId: "1:88670369654:web:864bc94bbb5f25d073ec57"
};

/**
 * Delayed CDN SDK load keeps local task management working even when the
 * Firebase network request is blocked or offline. Matches the Firebase SDK
 * version already used by the Life RPG PWA without modifying npm dependencies.
 */
const sdkBase = 'https://www.gstatic.com/firebasejs/12.17.1/';
export async function firebaseServices() {
  const appUrl = sdkBase + 'firebase-app.js';
  const authUrl = sdkBase + 'firebase-auth.js';
  const firestoreUrl = sdkBase + 'firebase-firestore.js';
  const [appSDK, authSDK, firestoreSDK] = await Promise.all([
    import(/* @vite-ignore */ appUrl),
    import(/* @vite-ignore */ authUrl),
    import(/* @vite-ignore */ firestoreUrl)
  ]);
  const firebaseApp = appSDK.initializeApp(firebaseConfig, 'task-companion');
  const auth = authSDK.getAuth(firebaseApp);
  const db = firestoreSDK.getFirestore(firebaseApp);
  return { auth, db, authSDK, firestoreSDK };
}

export type FirebaseServices = Awaited<ReturnType<typeof firebaseServices>>;
