import { dev } from '$app/environment'
import { derived, readable } from 'svelte/store'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

let config
if (dev) {
  config = import.meta.env?.VITE_FIREBASE_API_KEY
    ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    }
    : { apiKey: 'demo', authDomain: 'demo.firebaseapp.com' }
} else {
  // figure out
}

export const app = readable(initializeApp(config))

function createAuth() {
  let auth
  const { subscribe } = derived(app, ($app, set) => {
    auth = getAuth($app)
    set(auth)
  })
  async function signUp(email, password, profile) {
    const { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } = await import(
      'firebase/auth'
    )
    const res = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(res.user, profile)
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
  // TODO: reimplement if time remaining and make sure to ref https://developers.google.com/identity/branding-guidelines
  // async function signInWithGoogle() {
  //   const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
  //   const provider = new GoogleAuthProvider()
  //   return await signInWithPopup(auth, provider)
  // }
  return {
    subscribe,
    signUp,
    signIn,
    signOut
  }
}

export const auth = createAuth()

function createUser() {
  let user = undefined
  const { subscribe } = derived(auth, async ($auth, set) => {
    set(user)
    const unsubscribe = onAuthStateChanged($auth, userData => {
      user = userData
      set(user)
    })
    return unsubscribe
  })
  async function get() {
    let unsubscribe
    const userData = new Promise(resolve => {
      unsubscribe = subscribe(userData => {
        if (userData !== undefined) {
          if (userData) {
            resolve(userData)
          } else {
            resolve(null)
          }
        }
      })
    })
    return new Promise(resolve => {
      userData.then(result => {
        unsubscribe()
        resolve(result)
      })
    })
  }
  async function loaded() {
    let unsubscribe
    const userData = new Promise(resolve => {
      unsubscribe = subscribe(userData => {
        if (userData !== undefined) {
          if (userData) {
            resolve(true)
          }
        }
      })
    })
    return new Promise(resolve => {
      userData.then(result => {
        unsubscribe()
        resolve(result)
      })
    })
  }
  return {
    subscribe,
    get,
    loaded
  }
}

export const user = createUser()

export const db = derived(app, ($app, set) => {
  set(getFirestore($app))
})

// uploads a file to firebase storage
async function uploadFile(file, filePath) {
  const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage')
  const storage = getStorage()
  const storageRef = ref(storage, filePath)
  console.log(file.name)
  console.log(file)
  const uploadTask = uploadBytesResumable(storageRef, file)
  uploadTask.on('state_changed', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    console.log('Upload is ' + progress + '% done')
    switch (snapshot.state) {
      case 'paused':
        console.log('Upload is paused')
        break
      case 'running':
        console.log('Upload is running')
        break
    }
  }, (error) => {
    console.log(error)
  }, () => {
    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
      return downloadURL
    });
  })
}
export { uploadFile }
