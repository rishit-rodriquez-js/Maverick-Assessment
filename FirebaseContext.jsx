/* global __firebase_config, __app_id, __initial_auth_token */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

// Create a context for Firebase
const FirebaseContext = createContext(null);

// Custom hook to use Firebase services
export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};

// Firebase Provider component
export const FirebaseProvider = ({ children }) => {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState('');

    // IMPORTANT: Replace these placeholder values with your actual Firebase project configuration
    // if you are running this application outside of the Canvas environment.
    // When running in Canvas, __firebase_config will be injected.
    const localFirebaseConfig = {
        apiKey: "AIzaSyCkeJrNLrv4u1et8kqiYqwhVVUaW5ZPQ8I", // Firebase API Key
        authDomain: "maverick-assessment.firebaseapp.com", // Replace with your actual auth domain
        projectId: "maverick-assessment", // Replace with your actual project ID
        storageBucket: "maverick-assessment.firebasestorage.app", // Replace with your actual storage bucket
        messagingSenderId: "125120689173", // Replace with your actual messaging sender ID
        appId: "1:125120689173:web:0a4599f860f19d36908a1c" // Replace with your actual app ID
    };

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                // Determine which Firebase config to use
                const firebaseConfig = typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config)).length > 0
                    ? JSON.parse(__firebase_config)
                    : localFirebaseConfig;

                console.log("Firebase Provider: Using Firebase Config:", firebaseConfig);

                // Initialize Firebase app
                const firebaseApp = initializeApp(firebaseConfig);
                setApp(firebaseApp);

                // Initialize Auth and Firestore
                const authInstance = getAuth(firebaseApp);
                const dbInstance = getFirestore(firebaseApp);
                setAuth(authInstance);
                setDb(dbInstance);

                // Authenticate user
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(authInstance, __initial_auth_token);
                    console.log("Firebase Provider: Signed in with custom token.");
                } else {
                    await signInAnonymously(authInstance);
                    console.log("Firebase Provider: Signed in anonymously.");
                }

                // Set the Gemini API key
                setGeminiApiKey('AIzaSyA-4-3FTYo7yicpgD6aVhg1smciwNGnFgk'); // Updated Gemini API Key

                // Listen for auth state changes
                const unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
                    console.log("Firebase Provider: Auth state changed. User:", user ? user.uid : "null");
                    if (user) {
                        setUserId(user.uid);
                        // Fetch user role from Firestore
                        const userDocRef = doc(dbInstance, `artifacts/${appId}/users/${user.uid}/profile/data`);
                        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                            if (docSnap.exists()) {
                                const data = docSnap.data();
                                setUserRole(data.userType || 'employee'); // Default to 'employee' if not set
                                console.log("Firebase Provider: User profile loaded, role:", data.userType);
                            } else {
                                setUserRole(null); // Profile not yet set up
                                console.log("Firebase Provider: User profile does not exist.");
                            }
                            setIsAuthReady(true); // Auth and initial profile check complete
                        }, (error) => {
                            console.error("Firebase Provider: Error fetching user profile:", error);
                            setUserRole(null);
                            setIsAuthReady(true);
                        });
                        return () => unsubscribeProfile();
                    } else {
                        setUserId(null);
                        setUserRole(null);
                        setIsAuthReady(true); // Auth check complete, no user logged in
                        console.log("Firebase Provider: No user logged in.");
                    }
                });

                return () => unsubscribeAuth();
            } catch (error) {
                console.error("Firebase initialization error:", error);
                setIsAuthReady(true); // Mark as ready even on error to avoid infinite loading
            }
        };

        initializeFirebase();
    }, [appId, localFirebaseConfig]); // Depend on appId and localFirebaseConfig

    const value = {
        app,
        db,
        auth,
        userId,
        userRole,
        isAuthReady,
        geminiApiKey,
        appId
    };

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
};

