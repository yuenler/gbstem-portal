import { dev } from '$app/environment'
import { derived, readable } from 'svelte/store'
import {
  PUBLIC_FIREBASE_USE_SERVER,
  PUBLIC_FIREBASE_API_KEY,
  PUBLIC_FIREBASE_AUTH_DOMAIN,
  PUBLIC_FIREBASE_PROJECT_ID,
  PUBLIC_FIREBASE_STORAGE_BUCKET,
  PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
  PUBLIC_FIREBASE_APP_ID,
  PUBLIC_FIREBASE_MEASUREMENT_ID
} from '$env/static/public'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

let config
if (dev) {
  config = PUBLIC_FIREBASE_USE_SERVER
    ? {
        apiKey: PUBLIC_FIREBASE_API_KEY,
        authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: PUBLIC_FIREBASE_MESSAGE_SENDER_ID,
        appId: PUBLIC_FIREBASE_APP_ID,
        measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
      }
    : { apiKey: 'demo', authDomain: 'demo.firebaseapp.com' }
} else {
  config = await fetch('/__/firebase/init.json')
}

export const app = readable(initializeApp(config))

function createAuth() {
  let auth
  const { subscribe } = derived(app, ($app, set) => {
    auth = getAuth($app)
    set(auth)
  })
  async function signUp(email, password) {
    const { createUserWithEmailAndPassword, sendEmailVerification } = await import('firebase/auth')
    const res = await createUserWithEmailAndPassword(auth, email, password)
    sendEmailVerification(res.user)
    return res
  }
  async function signIn(email, password) {
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    return await signInWithEmailAndPassword(auth, email, password)
  }
  async function signOut() {
    const { signOut: firebaseSignOut } = await import('firebase/auth')
    return await firebaseSignOut(auth)
  }
  return {
    subscribe,
    signUp,
    signIn,
    signOut
  }
}

export const auth = createAuth()

export const user = derived(auth, ($auth, set) => {
  set(auth.currentUser)
  const unsubscribe = onAuthStateChanged($auth, set)
  return unsubscribe
})
