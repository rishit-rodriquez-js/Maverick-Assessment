import React, { useState, useEffect, createContext, useContext, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, collection, getDoc, getDocs } from 'firebase/firestore';
import Chart from 'chart.js/auto';
import { Home, User, Target, Brain, Award, Users, LogOut, Edit, BarChart, BookOpen, MessageSquare, Briefcase, UploadCloud, Code, Play, CheckCircle, XCircle, Settings, Search, FileText, FileText as FileTextIcon, UserCog, BriefcaseBusiness } from 'lucide-react';

// --- Firebase Context ---
// Provides Firebase app, db, auth instances, userId, and auth readiness status to all components.
const FirebaseContext = createContext(null);

// Export FirebaseProvider so it can be imported in main.jsx
export const FirebaseProvider = ({ children }) => {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userRole, setUserRole] = useState(null); // New state for user role
    const [geminiApiKey] = useState("AIzaSyA-4-3FTYo7yicpgD6aVhg1smciwNGnFgk"); // State for Gemini API Key - REPLACE WITH YOUR ACTUAL KEY

    // Firebase Configuration - wrapped in useMemo for stability.
    // IMPORTANT: Replace with your actual Firebase project configuration.
    const localFirebaseConfig = useMemo(() => ({
        apiKey: "AIzaSyCkeJrNLrv4u1et8kqiYqwhVVUaW5ZPQ8I",
        authDomain: "maverick-assessment.firebaseapp.com",
        projectId: "maverick-assessment",
        storageBucket: "maverick-assessment.firebasestorage.app",
        messagingSenderId: "125120689173",
        appId: "1:125120689173:web:0a4599f860f19d36908a1c"
    }), []);

    useEffect(() => {
        // Initialize Firebase only once when the component mounts.
        if (!app) {
            try {
                const initializedApp = initializeApp(localFirebaseConfig);
                const firestoreDb = getFirestore(initializedApp);
                const firebaseAuth = getAuth(initializedApp);

                setApp(initializedApp);
                setDb(firestoreDb);
                setAuth(firebaseAuth);
                console.log("FirebaseProvider: Firebase initialized.");

                // Listen for authentication state changes to manage user sessions.
                const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                    console.log("FirebaseProvider: Auth state changed. User:", user ? user.uid : "null");
                    setUserId(user ? user.uid : null); // Set userId immediately

                    // Set auth ready as soon as the auth state is known.
                    setIsAuthReady(true);
                    console.log("FirebaseProvider: isAuthReady set to true (after auth state change)");

                    if (user) {
                        // Now, fetch user role. This can be asynchronous and won't block isAuthReady.
                        const userProfileRef = doc(firestoreDb, `artifacts/${localFirebaseConfig.appId}/users/${user.uid}/profile`, 'data');
                        try {
                            const docSnap = await getDoc(userProfileRef);
                            if (docSnap.exists()) {
                                const role = docSnap.data().userType || 'employee'; // Default to 'employee' if userType is missing
                                setUserRole(role);
                                console.log("FirebaseProvider: User role fetched:", role);
                            } else {
                                setUserRole('employee'); // Default if profile doesn't exist yet (e.g., new registration)
                                console.log("FirebaseProvider: User profile does not exist, defaulting to employee role.");
                            }
                        } catch (profileError) {
                            console.error("FirebaseProvider: Error fetching user profile for role:", profileError);
                            setUserRole('employee'); // Default on error
                        }
                    } else {
                        setUserRole(null); // Clear user role if no user is authenticated
                    }
                });

                return () => unsubscribe(); // Cleanup the auth listener on component unmount.
            } catch (error) {
                console.error("FirebaseProvider: Failed to initialize Firebase:", error);
                // If Firebase initialization itself fails, still set isAuthReady to true
                // so the App component can handle the error state or redirect.
                setIsAuthReady(true);
            }
        }
    }, [app, localFirebaseConfig]); // Dependencies ensure effect runs only when necessary.

    const appId = localFirebaseConfig.appId; // Get appId from the stable config.

    return (
        <FirebaseContext.Provider value={{ app, db, auth, userId, isAuthReady, appId, localFirebaseConfig, geminiApiKey, userRole }}>
            {children}
        </FirebaseContext.Provider>
    );
};

// --- Reusable Components ---

// Input field component for text and textarea.
function Input({ label, type = 'text', value, onChange, placeholder, className = '', onKeyPress }) {
    const InputElement = type === 'textarea' ? 'textarea' : 'input';
    return (
        <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2">{label}</label>
            <InputElement
                type={type === 'textarea' ? undefined : type} // Type prop not for textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={type === 'textarea' ? 4 : undefined} // Rows for textarea
                onKeyPress={onKeyPress} // Pass onKeyPress prop
                className={`shadow-inner appearance-none border rounded-lg w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline
                            bg-gray-700 border-gray-600 placeholder-gray-400
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out ${className}`}
            />
        </div>
    );
}

// Button component with consistent styling and optional icon.
const Button = ({ onClick, children, className = '', disabled = false, icon: Icon = null }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg
                    bg-gradient-to-r from-blue-600 to-purple-700
                    hover:from-blue-700 hover:to-purple-800
                    transform hover:scale-105 transition duration-300 ease-in-out
                    focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
                    ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {Icon && <Icon size={20} />}
        {children}
    </button>
);

// Progress Bar component for visualizing progress.
const ProgressBar = ({ label, progress }) => (
    <div className="mb-4">
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-gray-300">{label}</span>
            <span className="text-sm font-medium text-blue-400">{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 shadow-inner">
            <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    </div>
);

// Message Box Component for displaying alerts or confirmations.
const MessageBox = ({ message, onConfirm, onCancel, showCancel = false }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-700">
                <p className="text-gray-100 text-lg mb-6 text-center">{message}</p>
                <div className="flex justify-center space-x-4">
                    {showCancel && (
                        <Button onClick={onCancel} className="bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800">Cancel</Button>
                    )}
                    <Button onClick={onConfirm} className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">OK</Button>
                </div>
            </div>
        </div>
    );
};

// Workflow Progress Bar Component to show overall learning journey progress.
const WorkflowProgressBar = ({ currentStage }) => {
    const stages = [
        { name: 'Profile Loaded', value: 0 },
        { name: 'Assessment Pending', value: 25 },
        { name: 'Assessment Completed', value: 50 },
        { name: 'Recommendations Generated', value: 75 },
        { name: 'Learning In Progress', value: 100 },
    ];

    const currentStageIndex = stages.findIndex(stage => stage.name === currentStage);
    const progress = currentStageIndex !== -1 ? stages[currentStageIndex].value : 0;

    return (
        <div className="bg-gray-800 p-6 rounded-3xl shadow-2xl mb-8 border border-gray-700 transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-2xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Your Learning Workflow Progress</h3>
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between text-gray-300 text-sm">
                    <span>{currentStage}</span>
                    <span className="font-semibold">{progress}%</span>
                </div>
                <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-full bg-gray-700 shadow-inner">
                    <div
                        style={{ width: `${progress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-700 ease-out"
                    ></div>
                </div>
                <div className="flex justify-between text-gray-400 text-xs mt-2">
                    {stages.map((stage, index) => (
                        <span key={stage.name} className={`relative flex flex-col items-center ${index <= currentStageIndex ? 'text-blue-400 font-semibold' : ''}`}>
                            <div className={`w-3 h-3 rounded-full border-2 ${index <= currentStageIndex ? 'bg-blue-500 border-blue-500' : 'bg-gray-600 border-gray-500'}`}></div>
                            <span className="mt-1 text-center">{stage.name}</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- App Pages/Components ---

// Authentication Component: Handles user login and registration.
const Auth = ({ setCurrentPage, onAuthSuccessAndMessageDismissed }) => {
    const { auth, db, isAuthReady, appId } = useContext(FirebaseContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [authMode, setAuthMode] = useState('choose'); // 'choose', 'employeeLogin', 'adminLogin', 'employeeRegister'

    const handleLogin = async (expectedUserType) => {
        if (!isAuthReady) {
            setMessage("Firebase not ready. Please wait.");
            console.log("Auth: Firebase not ready for login.");
            return;
        }
        console.log(`Auth: Login attempt for email: ${email}, expecting role: ${expectedUserType}`);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Auth: User signed in successfully with Firebase Auth:", user.uid);

            // Fetch user profile to verify role
            const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
            const docSnap = await getDoc(userProfileRef);
            console.log("Auth: Profile fetched after login. Doc exists:", docSnap.exists());

            if (docSnap.exists()) {
                const actualUserType = docSnap.data().userType;
                console.log(`Auth: User profile found. Actual user type: ${actualUserType}. Expected user type: ${expectedUserType}.`);

                if (actualUserType === expectedUserType) {
                    setMessage("Login successful!");
                    console.log(`Auth: Role match! Message set. onAuthSuccessAndMessageDismissed will be called on OK.`);
                } else {
                    // Role mismatch: Log out the user and inform them.
                    await signOut(auth);
                    const msg = `Login failed: Your account is registered as a '${actualUserType}', but you tried to log in as '${expectedUserType}'. Please use the correct login option or contact support.`;
                    setMessage(msg);
                    console.log(`Auth: Role mismatch. Logged out user. Message: ${msg}`);
                }
            } else {
                // Profile does not exist for this user ID
                console.log("Auth: User profile document does not exist for this user ID.");
                if (expectedUserType === 'employee') {
                    setMessage("Login successful! Please complete your profile.");
                    console.log("Auth: New employee, message set. onAuthSuccessAndMessageDismissed will be called on OK.");
                } else {
                    // Admin login without a profile is an invalid state, log them out.
                    await signOut(auth);
                    const msg = "Login failed: Admin profile not found. Please ensure your admin profile is set up correctly.";
                    setMessage(msg);
                    console.log(`Auth: Admin login without profile. Logged out user. Message: ${msg}`);
                }
            }
        } catch (error) {
            console.error("Auth: Authentication or profile fetch failed:", error);
            setMessage(`Authentication failed: ${error.message}. Please check your credentials.`);
        }
    };

    const handleRegister = async () => {
        if (!isAuthReady) {
            setMessage("Firebase not ready. Please wait.");
            return;
        }
        console.log("Auth: Registration attempt for:", email);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Auth: User registered:", user.uid);

            // Create user profile in Firestore upon registration as 'employee'.
            const userRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
            await setDoc(userRef, {
                email: user.email,
                skills: [],
                targetRole: '',
                points: 0,
                badges: [],
                userId: user.uid,
                workflowProgress: 'Profile Loaded',
                userType: 'employee', // Always 'employee' for registration
                completedModules: [], // Initialize completedModules
                inferredSkillVectors: {} // Initialize inferredSkillVectors
            });
            console.log("Auth: Profile created for new employee:", user.uid);
            setMessage("Registration successful! Please log in.");
            setAuthMode('employeeLogin'); // Switch to employee login after successful registration.
            console.log("Auth: Registration successful. User needs to login. No immediate redirect.");
        } catch (error) {
            console.error("Auth: Registration failed:", error);
            setMessage(`Registration failed: ${error.message}`);
        }
    };

    const handleMessageBoxConfirm = () => {
        console.log("Auth: MessageBox 'OK' clicked. Clearing message.");
        setMessage(''); // Clear the message to dismiss the box
        // After message is dismissed, signal to App component to re-evaluate routing
        if (onAuthSuccessAndMessageDismissed) {
            console.log("Auth: Calling onAuthSuccessAndMessageDismissed callback.");
            onAuthSuccessAndMessageDismissed();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-gray-950 p-4 font-inter">
            <div className="flex flex-col lg:flex-row bg-gray-800 rounded-3xl shadow-2xl w-full h-full border border-gray-700 overflow-hidden">
                {/* Left Section: Value Proposition */}
                <div className="lg:w-1/2 p-10 flex flex-col justify-center items-center text-center lg:text-left bg-gradient-to-br from-blue-700 to-purple-800 text-white">
                    <div className="max-w-md mx-auto">
                        <h1 className="text-5xl font-extrabold mb-6 leading-tight">
                            Accelerate Your <span className="text-yellow-300">Professional Growth</span>
                        </h1>
                        <p className="text-lg mb-8 opacity-90">
                            Identify skill gaps, take personalized assessments, and follow curated learning paths designed for your career advancement.
                        </p>
                        <ul className="text-left text-lg space-y-3 mb-10">
                            <li className="flex items-center gap-3">
                                <CheckCircle size={24} className="text-green-300" />
                                <span>In-depth Skill Gap Analysis</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Brain size={24} className="text-purple-300" />
                                <span>AI-Powered Interactive Assessments</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Target size={24} className="text-orange-300" />
                                <span>Personalized Learning Paths</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Award size={24} className="text-yellow-300" />
                                <span>Gamified Progress Tracking</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Section: Login/Register Form */}
                <div className="lg:w-1/2 p-10 flex flex-col justify-center bg-gray-800">
                    {authMode === 'choose' && (
                        <>
                            <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                                Choose Your Role
                            </h2>
                            <Button onClick={() => setAuthMode('employeeLogin')} className="w-full mb-6 text-xl" icon={BriefcaseBusiness}>
                                Employee Login
                            </Button>
                            <Button onClick={() => setAuthMode('adminLogin')} className="w-full text-xl bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800" icon={UserCog}>
                                Admin Login
                            </Button>
                        </>
                    )}

                    {(authMode === 'employeeLogin' || authMode === 'adminLogin' || authMode === 'employeeRegister') && (
                        <>
                            <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                                {authMode === 'employeeLogin' ? 'Employee Login' : authMode === 'adminLogin' ? 'Admin Login' : 'Employee Registration'}
                            </h2>
                            <Input
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                className="mb-6"
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 6 characters"
                                className="mb-8"
                            />

                            {authMode === 'employeeLogin' && (
                                <Button onClick={() => handleLogin('employee')} className="w-full mb-6 text-xl">
                                    Sign In as Employee
                                </Button>
                            )}
                            {authMode === 'adminLogin' && (
                                <Button onClick={() => handleLogin('admin')} className="w-full mb-6 text-xl bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800">
                                    Sign In as Admin
                                </Button>
                            )}
                            {authMode === 'employeeRegister' && (
                                <Button onClick={handleRegister} className="w-full mb-6 text-xl">
                                    Register Employee Account
                                </Button>
                            )}

                            {authMode === 'employeeLogin' && (
                                <p className="text-center text-gray-400 text-md">
                                    Don't have an account?{' '}
                                    <span
                                        className="text-blue-400 cursor-pointer hover:underline font-semibold"
                                        onClick={() => setAuthMode('employeeRegister')}
                                    >
                                        Register here
                                    </span>
                                </p>
                            )}
                            {(authMode === 'employeeLogin' || authMode === 'adminLogin' || authMode === 'employeeRegister') && (
                                <p className="text-center text-gray-400 text-md mt-4">
                                    <span
                                        className="text-gray-400 cursor-pointer hover:underline font-semibold"
                                        onClick={() => { setAuthMode('choose'); setEmail(''); setPassword(''); setMessage(''); }}
                                    >
                                        Back to Role Selection
                                    </span>
                                </p>
                            )}
                        </>
                    )}
                    <MessageBox message={message} onConfirm={handleMessageBoxConfirm} />
                </div>
            </div>
        </div>
    );
};

// Profile Setup Component: Allows users to define their skills and target role.
const ProfileSetup = ({ setCurrentPage }) => {
    const { db, userId, isAuthReady, appId, geminiApiKey, auth } = useContext(FirebaseContext);
    const [userSkills, setUserSkills] = useState([]); // Now stores array of { name: string, level: number }
    const [targetRole, setTargetRole] = useState('');
    const [resumeFile, setResumeFile] = useState(null); // State for resume PDF file.
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [suggestedRoles, setSuggestedRoles] = useState([]);
    const [selectedSuggestedRole, setSelectedSuggestedRole] = useState('');
    const [customSkillInput, setCustomSkillInput] = useState(''); // State for new custom skill input.


    useEffect(() => {
        // Fetch user profile data when component mounts or userId changes.
        const fetchUserProfile = async () => {
            if (isAuthReady && userId && db) {
                setLoading(true);
                console.log("ProfileSetup: Fetching profile for userId:", userId);
                try {
                    const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log("ProfileSetup: Profile data fetched:", data);
                        // Initialize userSkills with existing data, ensuring it's an array of objects.
                        setUserSkills(data.skills || []);
                        setTargetRole(data.targetRole || '');
                    } else {
                        console.log("ProfileSetup: No existing profile found for userId:", userId);
                    }
                } catch (error) {
                    console.error("ProfileSetup: Error fetching user profile:", error);
                    setMessage("Error loading profile.");
                } finally {
                    setLoading(false);
                }
            } else if (isAuthReady && !userId) {
                console.log("ProfileSetup: Not authenticated, redirecting to auth.");
                setCurrentPage('auth'); // Redirect if not authenticated.
            }
        };

        fetchUserProfile();
    }, [userId, isAuthReady, db, appId, setCurrentPage]);

    // Handles AI suggestion for job roles based on user's current skills.
    const handleGetRoleSuggestions = async () => {
        setLoading(true);
        setMessage('');
        setSuggestedRoles([]);

        const skillsString = userSkills.map(s => s.name).join(', ');
        if (!skillsString.trim()) {
            setMessage("Please enter some skills or extract from resume to get role suggestions.");
            setLoading(false);
            return;
        }

        const promptText = `Based on these skills: "${skillsString}", suggest 3-5 relevant job roles and the key skills required for each role, along with a brief description for each role. Provide the output as a JSON array of objects, where each object has 'roleName' (string), 'description' (string), and 'requiredSkills' (an array of strings).`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: promptText }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                roleName: { type: "STRING" },
                                description: { type: "STRING" },
                                requiredSkills: { type: "ARRAY", items: { type: "STRING" } }
                            },
                            required: ["roleName", "description", "requiredSkills"]
                        }
                    }
                }
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}. Response: ${errorBody}`);
            }

            const result = await response.json();
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(result.candidates[0].content.parts[0].text);
            } catch (parseError) {
                console.error("ProfileSetup: Error parsing JSON response from Gemini API for suggestions:", parseError);
                setMessage("Failed to parse role suggestions from AI. Please try again.");
                return;
            }

            if (jsonResponse && jsonResponse.length > 0) {
                setSuggestedRoles(jsonResponse);
                setMessage("AI suggestions loaded!");
            } else {
                setMessage("AI could not generate role suggestions based on your skills.");
            }

        } catch (error) {
            console.error("ProfileSetup: Error getting AI suggestions:", error);
            setMessage(`Failed to get AI suggestions: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handles AI extraction of skills from the uploaded resume PDF via backend.
    const handleExtractSkillsFromResume = async () => {
        setLoading(true);
        setMessage('');

        if (!resumeFile) {
            setMessage("Please upload a resume PDF file first.");
            setLoading(false);
            return;
        }

        // Create FormData to send the file.
        const formData = new FormData();
        formData.append('resume', resumeFile);

        try {
            // IMPORTANT: Replace with the actual URL of your backend endpoint.
            // For local development, it might be something like 'http://localhost:5000/extract-skills'
            const backendUrl = 'http://localhost:5000/extract-skills'; 
            
            setMessage("Uploading resume and extracting skills via backend...");
            const response = await fetch(backendUrl, {
                method: 'POST',
                body: formData, // FormData automatically sets 'Content-Type': 'multipart/form-data'
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Backend error! Status: ${response.status}. Response: ${errorBody}`);
            }

            const result = await response.json();
            if (result.skills && result.skills.length > 0) {
                // Merge extracted skills with existing skills, avoiding duplicates and setting default level 0.
                const currentSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
                const newSkills = result.skills
                    .filter(skillName => !currentSkillNames.has(skillName.toLowerCase()))
                    .map(skillName => ({ name: skillName, level: 0 }));

                const combinedSkills = [...userSkills, ...newSkills];
                setUserSkills(combinedSkills);
                setMessage("Skills extracted from resume successfully!");
            } else {
                setMessage("Backend extracted no skills from your resume.");
            }
        } catch (error) {
            console.error("ProfileSetup: Error extracting skills via backend:", error);
            setMessage(`Failed to extract skills: ${error.message}. Ensure your backend server is running.`);
        } finally {
            setLoading(false);
        }
    };

    // Updates the level of a specific skill.
    const handleSkillLevelChange = (skillName, level) => {
        setUserSkills(prevSkills =>
            prevSkills.map(s =>
                s.name === skillName ? { ...s, level: parseInt(level, 10) } : s
            )
        );
    };

    // Adds a new custom skill to the list for rating.
    const handleAddCustomSkill = () => {
        if (customSkillInput.trim() && !userSkills.some(s => s.name.toLowerCase() === customSkillInput.toLowerCase())) {
            const newSkill = { name: customSkillInput.trim(), level: 0 };
            setUserSkills(prevSkills => [...prevSkills, newSkill]);
            setCustomSkillInput(''); // Clear input field after adding.
        } else if (userSkills.some(s => s.name.toLowerCase() === customSkillInput.toLowerCase())) {
            setMessage("Skill already exists!");
        }
    };

    // Removes a skill from the list.
    const handleRemoveSkill = (skillName) => {
        setUserSkills(prevSkills => prevSkills.filter(s => s.name !== skillName));
    };

    // Saves the user's profile, including the new skill structure.
    const handleSaveProfile = async () => {
        if (!isAuthReady || !userId || !db) {
            setMessage("Firebase not ready. Please wait.");
            return;
        }
        setLoading(true);
        try {
            let finalTargetRole = targetRole;
            let finalSkills = [...userSkills]; // Start with current user-rated skills

            if (selectedSuggestedRole) {
                const chosenRole = suggestedRoles.find(role => role.roleName === selectedSuggestedRole);
                if (chosenRole) {
                    finalTargetRole = chosenRole.roleName;
                    // Merge suggested required skills into finalSkills, setting default level 0 if new.
                    const currentSkillNames = new Set(finalSkills.map(s => s.name.toLowerCase()));
                    chosenRole.requiredSkills.forEach(reqSkill => {
                        if (!currentSkillNames.has(reqSkill.toLowerCase())) {
                            finalSkills.push({ name: reqSkill, level: 0 }); // Add new required skills at level 0
                        }
                    });
                }
            }

            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            console.log("ProfileSetup: Saving profile for userId:", userId, "with data:", { skills: finalSkills, targetRole: finalTargetRole });
            await setDoc(userRef, {
                email: auth.currentUser.email, // Ensure email is saved with profile
                skills: finalSkills, // Save skills as array of objects.
                targetRole: finalTargetRole,
                workflowProgress: 'Assessment Pending', // Update workflow stage.
                // Placeholder for inferred data from a real backend "Profile Agent".
                // In a real scenario, a backend would process resume/HR data
                // and compute these vectors.
                inferredSkillVectors: userSkills.reduce((acc, skill) => {
                    acc[skill.name] = skill.level / 5; // Simple normalization for visualization
                    return acc;
                }, {})
            }, { merge: true }); // Use merge to update existing fields without overwriting others.
            setMessage("Profile saved successfully!");
            console.log("ProfileSetup: Profile saved successfully, navigating to dashboard.");
            setCurrentPage('dashboard'); // Navigate to dashboard after saving.
        } catch (error) {
            console.error("ProfileSetup: Error saving profile:", error);
            setMessage("Error saving profile.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingPage message="Loading profile..." />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
            <div className="bg-gray-800 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 animate-pulse">
                    Setup Your Profile
                </h2>

                {/* Resume Upload Section (Now sends to Backend) */}
                <h3 className="text-xl font-bold mb-4 text-gray-300">Upload Resume (PDF) & Extract Skills</h3>
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2">Upload Your Resume (PDF)</label>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-300
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                    {resumeFile && <p className="text-gray-400 text-xs mt-2">Selected: {resumeFile.name}</p>}
                </div>
                {/* Removed "Describe your resume content" textarea */}
                <Button onClick={handleExtractSkillsFromResume} className="w-full mb-6 text-xl" disabled={loading || !resumeFile} icon={UploadCloud}>
                    {loading ? 'Extracting Skills...' : 'Extract Skills from Resume (AI)'}
                </Button>

                {/* Dynamic Skill Rating Section */}
                <h3 className="text-xl font-bold mb-4 text-gray-300">Rate Your Skills (0-5)</h3>
                {userSkills.length === 0 && (
                    <p className="text-gray-400 text-sm mb-4">No skills to rate yet. Extract from resume or add manually below.</p>
                )}
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto p-2 rounded-lg bg-gray-700 border border-gray-600">
                    {userSkills.map((skill, index) => ( // Corrected JSX syntax here
                        <div key={skill.name} className="flex items-center justify-between bg-gray-600 p-3 rounded-lg shadow-inner">
                            <span className="text-gray-100 font-medium text-lg">{skill.name}</span>
                            <div className="flex items-center gap-2">
                                <select
                                    value={skill.level}
                                    onChange={(e) => handleSkillLevelChange(skill.name, e.target.value)}
                                    className="bg-gray-800 text-gray-100 border border-gray-500 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {[0, 1, 2, 3, 4, 5].map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                                <button onClick={() => handleRemoveSkill(skill.name)} className="text-red-400 hover:text-red-500 transition">
                                    <XCircle size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Custom Skill Input */}
                <div className="flex gap-2 mb-6">
                    <Input
                        placeholder="Add custom skill"
                        className="flex-grow"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleAddCustomSkill();
                            }
                        }}
                    />
                    <Button onClick={handleAddCustomSkill} className="flex-shrink-0">Add</Button>
                </div>


                <Button onClick={handleGetRoleSuggestions} className="w-full mb-6 text-xl" disabled={loading} icon={Brain}>
                    {loading ? 'Getting Suggestions...' : 'Get AI Role Suggestions'}
                </Button>

                {suggestedRoles.length > 0 && (
                    <div className="mb-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2">Suggested Target Roles</label>
                        <select
                            value={selectedSuggestedRole}
                            onChange={(e) => {
                                setSelectedSuggestedRole(e.target.value);
                                setTargetRole(e.target.value); // Also set the targetRole input
                                const chosenRole = suggestedRoles.find(role => role.roleName === selectedSuggestedRole);
                                if (chosenRole) {
                                    // Merge suggested required skills with current user skills, setting default level 0.
                                    const currentSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
                                    const newSkillsFromSuggestion = chosenRole.requiredSkills
                                        .filter(reqSkill => !currentSkillNames.has(reqSkill.toLowerCase()))
                                        .map(reqSkill => ({ name: reqSkill, level: 0 }));
                                    
                                    const combinedSkills = [...userSkills, ...newSkillsFromSuggestion];
                                    setUserSkills(combinedSkills);
                                }
                            }}
                            className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:shadow-outline
                                       bg-gray-700 border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 ease-in-out text-lg"
                        >
                            <option value="">Select a suggested role</option>
                            {suggestedRoles.map((role, index) => (
                                <option key={index} value={role.roleName}>{role.roleName}</option>
                            ))}
                        </select>
                        {selectedSuggestedRole && (
                            <div className="mt-4 p-4 bg-gray-700 border border-gray-600 rounded-lg text-gray-300">
                                <h5 className="font-semibold text-blue-400 mb-2">{selectedSuggestedRole}</h5>
                                <p className="text-sm mb-2">{suggestedRoles.find(r => r.roleName === selectedSuggestedRole)?.description}</p>
                                <p className="text-sm">Required Skills: <span className="font-medium">{suggestedRoles.find(r => r.roleName === selectedSuggestedRole)?.requiredSkills.join(', ')}</span></p>
                            </div>
                        )}
                    </div>
                )}

                <Input
                    label="Target Role (or select from suggestions)"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Frontend Developer, Data Scientist"
                    className="mb-8"
                />

                <Button onClick={handleSaveProfile} className="w-full text-xl" icon={Briefcase}>Save Profile</Button>
                <MessageBox message={message} onConfirm={() => setMessage('')} />
            </div>
        </div>
    );
};

// Mock Role Benchmarks: Defines required proficiency levels for various roles.
const roleBenchmarks = {
    'Frontend Developer': {
        'HTML': 5, 'CSS': 5, 'JavaScript': 5, 'React': 4, 'Tailwind CSS': 3, 'Node.js': 2, 'Databases': 1
    },
    'Backend Developer': {
        'Node.js': 5, 'Python': 4, 'Databases': 5, 'APIs': 4, 'Cloud': 3, 'Frontend': 2
    },
    'Data Scientist': {
        'Python': 5, 'R': 4, 'Statistics': 5, 'Machine Learning': 4, 'SQL': 4, 'Data Visualization': 3
    },
    'Project Manager': {
        'Communication': 5, 'Leadership': 4, 'Agile Methodologies': 4, 'Risk Management': 3, 'Budgeting': 3
    },
    'UI/UX Designer': {
        'Figma': 5, 'User Research': 4, 'Wireframing': 4, 'Prototyping': 4, 'Graphic Design': 3
    }
    // Add more roles and their required skills/proficiency levels (1-5)
};

// Skill Gap Analysis Component: Visualizes skill gaps using Chart.js.
const SkillGapAnalysis = ({ userSkills, targetRole }) => {
    const [skillGaps, setSkillGaps] = useState([]);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null); // To store the Chart.js instance

    useEffect(() => {
        // Calculate skill gaps whenever userSkills or targetRole changes.
        if (userSkills && targetRole && roleBenchmarks[targetRole]) {
            const requiredSkills = roleBenchmarks[targetRole];
            const gaps = [];
            const userSkillsMap = new Map(userSkills.map(skill => [skill.name.toLowerCase(), skill.level]));

            for (const skill in requiredSkills) {
                const requiredProficiency = requiredSkills[skill];
                const userProficiency = userSkillsMap.has(skill.toLowerCase()) ? userSkillsMap.get(skill.toLowerCase()) : 0;
                const gapValue = Math.max(0, requiredProficiency - userProficiency);
                if (gapValue > 0) {
                    gaps.push({ skill: skill, required: requiredProficiency, user: userProficiency, gap: (gapValue / requiredProficiency) * 100 });
                }
            }
            setSkillGaps(gaps.sort((a, b) => b.gap - a.gap)); // Sort by largest gap first.
        } else {
            setSkillGaps([]);
        }
    }, [userSkills, targetRole]);

    useEffect(() => {
        // Destroy existing chart before creating a new one to prevent rendering issues.
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        if (chartRef.current && skillGaps.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: skillGaps.map(g => g.skill),
                    datasets: [
                        {
                            label: 'Required Proficiency',
                            data: skillGaps.map(g => g.required),
                            backgroundColor: 'rgba(54, 162, 235, 0.8)', // Brighter blue
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                        },
                        {
                            label: 'Your Proficiency',
                            data: skillGaps.map(g => g.user),
                            backgroundColor: 'rgba(75, 192, 192, 0.8)', // Brighter teal
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 5, // Max proficiency level.
                            title: {
                                display: true,
                                text: 'Proficiency Level (0-5)',
                                color: '#E0E0E0'
                            },
                            ticks: {
                                color: '#B0B0B0'
                            },
                            grid: {
                                color: '#444'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#B0B0B0'
                            },
                            grid: {
                                color: '#444'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#E0E0E0'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                },
            });
        }
    }, [skillGaps]); // Chart updates when skillGaps changes.

    return (
        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl mb-8 border border-gray-700 transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-500">Skill Gap Analysis for {targetRole}</h3>
            {skillGaps.length === 0 ? (
                <p className="text-gray-400 text-lg text-center py-4">Please set your skills and target role in your profile to see skill gaps.</p>
            ) : (
                <>
                    <div className="h-72 mb-6">
                        <canvas ref={chartRef}></canvas>
                    </div>
                    <h4 className="text-xl font-medium mb-4 text-gray-300">Detailed Gaps:</h4>
                    {skillGaps.map((gap, index) => (
                        <ProgressBar key={index} label={`${gap.skill} Gap`} progress={Math.round(gap.gap)} />
                    ))}
                </>
            )}
        </div>
    );
};

// Learning Platform Component: Displays recommended and completed learning modules.
const LearningPlatform = ({ userSkills, targetRole, completedModules, showCompletedOnly = false }) => {
    const { db, userId, appId } = useContext(FirebaseContext); // Removed geminiApiKey
    const [message, setMessage] = useState('');
    const [viewMode, setViewMode] = useState(showCompletedOnly ? 'completed' : 'recommended'); // 'recommended' or 'completed'

    const recommendedModules = useMemo(() => {
        if (!userSkills || !targetRole || !roleBenchmarks[targetRole]) {
            return [];
        }

        const requiredSkills = roleBenchmarks[targetRole];
        const gaps = [];

        // Calculate skill gaps based on user's rated proficiency.
        const userSkillsMap = new Map(userSkills.map(skill => [skill.name.toLowerCase(), skill.level]));
        for (const skill in requiredSkills) {
            const requiredProficiency = requiredSkills[skill];
            const userProficiency = userSkillsMap.has(skill.toLowerCase()) ? userSkillsMap.get(skill.toLowerCase()) : 0;
            const gapPercentage = Math.max(0, ((requiredProficiency - userProficiency) / requiredProficiency) * 100);
            if (gapPercentage > 0) {
                gaps.push({ skill: skill, gap: gapPercentage });
            }
        }

        // Sort by largest gap first and map to module format.
        return gaps
            .sort((a, b) => b.gap - a.gap)
            .map(gap => ({
                skill: gap.skill,
                moduleName: `${gap.skill} Fundamentals`,
                description: `Learn the core concepts and practices of ${gap.skill}.`,
                points: 50,
                estimatedTime: `${Math.floor(Math.random() * 3) + 1} hours`,
                status: completedModules.includes(`${gap.skill} Fundamentals`) ? 'Done' : 'Not Started'
            }));
    }, [userSkills, targetRole, completedModules]);

    // Generates mock completed modules for demonstration if none exist.
    const mockCompletedModules = useMemo(() => {
        // Filter recommended modules to show only those marked as completed.
        const actualCompleted = recommendedModules.filter(module => completedModules.includes(module.moduleName));
        
        // If there are no actual completed modules, provide a static mock for display.
        if (actualCompleted.length === 0 && showCompletedOnly) {
            return [
                { skill: 'HTML', moduleName: 'HTML Basics', description: 'Fundamental web structuring.', points: 50, estimatedTime: '2 hours', status: 'Done' },
                { skill: 'CSS', moduleName: 'Advanced CSS', description: 'Deep dive into modern CSS.', points: 50, estimatedTime: '3 hours', status: 'Done' },
            ].filter(module => completedModules.includes(module.moduleName)); // Still filter by actual completed, but provide mock if empty.
        }
        return actualCompleted;
    }, [completedModules, recommendedModules, showCompletedOnly]);


    // Handles marking a module as complete and updating user points/workflow.
    const handleMarkComplete = async (pointsAwarded, moduleName) => {
        if (!userId || !db) {
            setMessage("Cannot update points. User not authenticated or Firestore not ready.");
            return;
        }
        try {
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const currentData = docSnap.data();
                const newPoints = (currentData.points || 0) + pointsAwarded;
                const updatedCompletedModules = [...(currentData.completedModules || []), moduleName];

                await updateDoc(userRef, {
                    points: newPoints,
                    completedModules: updatedCompletedModules,
                    workflowProgress: 'Learning In Progress' // Update workflow stage.
                });
                setMessage(`Module "${moduleName}" completed! You earned ${pointsAwarded} points.`);
            }
        } catch (error) {
            console.error("LearningPlatform: Error updating points:", error);
            setMessage("Failed to update points.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 sm:p-6 md:p-8 font-inter text-gray-100">
            <div className="max-w-6xl mx-auto bg-gray-800 p-8 rounded-3xl shadow-2xl mb-8 border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                <div className="flex justify-center gap-4 mb-6">
                    <Button
                        onClick={() => setViewMode('recommended')}
                        className={`text-lg ${viewMode === 'recommended' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                        Recommended Modules
                    </Button>
                    <Button
                        onClick={() => setViewMode('completed')}
                        className={`text-lg ${viewMode === 'completed' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                        Completed Modules
                    </Button>
                </div>

                <h3 className="text-3xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    {viewMode === 'recommended' ? 'Recommended Learning Modules' : 'Your Completed Courses'}
                </h3>

                {viewMode === 'recommended' ? (
                    recommendedModules.length === 0 ? (
                        <p className="text-gray-400 text-lg text-center py-4">Great! No significant skill gaps found for your target role, or please set your target role.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedModules.map((module, index) => (
                                <div key={index} className="bg-gray-700 border border-gray-600 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition duration-300 ease-in-out hover:scale-105">
                                    <div>
                                        <h4 className="text-2xl font-semibold text-blue-400 mb-3">{module.moduleName}</h4>
                                        <p className="text-gray-300 text-md mb-3">{module.description}</p>
                                        <p className="text-gray-400 text-sm mb-2">Estimated Time: <span className="font-bold">{module.estimatedTime}</span></p>
                                        <p className="text-gray-400 text-sm">Status: <span className={`font-bold ${module.status === 'Done' ? 'text-green-400' : 'text-yellow-400'}`}>{module.status}</span></p>
                                        <p className="text-gray-400 text-sm">Points for completion: <span className="font-bold">{module.points}</span></p>
                                    </div>
                                    <Button
                                        onClick={() => handleMarkComplete(module.points, module.moduleName)}
                                        className="mt-6 self-end text-md"
                                        icon={Award}
                                        disabled={module.status === 'Done'}
                                    >
                                        {module.status === 'Done' ? 'Completed' : 'Mark as Complete'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )
                ) : ( // Display Completed Modules
                    mockCompletedModules.length === 0 ? (
                        <p className="text-gray-400 text-lg text-center py-4">No courses completed yet. Start learning!</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mockCompletedModules.map((module, index) => (
                                <div key={index} className="bg-gray-700 border border-gray-600 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition duration-300 ease-in-out hover:scale-105">
                                    <div>
                                        <h4 className="text-2xl font-semibold text-green-400 mb-3">{module.moduleName}</h4>
                                        <p className="text-gray-300 text-md mb-3">{module.description}</p>
                                        <p className="text-gray-400 text-sm mb-2">Estimated Time: <span className="font-bold">{module.estimatedTime}</span></p>
                                        <p className="text-gray-400 text-sm">Status: <span className="font-bold text-green-400">Completed</span></p>
                                        <p className="text-gray-400 text-sm">Points Earned: <span className="font-bold">{module.points}</span></p>
                                    </div>
                                    <Button className="mt-6 self-end text-md bg-gray-500 cursor-not-allowed" disabled>
                                        <CheckCircle size={20} className="mr-2" /> Already Completed
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )
                )}
                <MessageBox message={message} onConfirm={() => setMessage('')} />
            </div>
        </div>
    );
};


// Leaderboard Component: Displays users ranked by points.
const Leaderboard = () => {
    const { db, isAuthReady, appId } = useContext(FirebaseContext);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isAuthReady || !db) return;

        // Listen for real-time updates to all user profiles to build the leaderboard.
        const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
        const unsubscribe = onSnapshot(usersCollectionRef, async (snapshot) => {
            setLoading(true);
            const users = [];
            // Fetch each user's profile 'data' document.
            for (const userDoc of snapshot.docs) {
                const profileDocRef = doc(db, `artifacts/${appId}/users/${userDoc.id}/profile`, 'data');
                try {
                    const profileSnap = await getDoc(profileDocRef);
                    if (profileSnap.exists()) {
                        const data = profileSnap.data();
                        users.push({
                            id: userDoc.id,
                            email: data.email || 'N/A',
                            points: data.points || 0,
                            targetRole: data.targetRole || 'Not Set',
                            userType: data.userType || 'employee' // Include userType
                        });
                    }
                } catch (error) {
                    console.error("Leaderboard: Error fetching user profile for leaderboard:", error);
                }
            }
            users.sort((a, b) => b.points - a.points); // Sort by points in descending order.
            setLeaderboardData(users);
            setLoading(false);
        }, (error) => {
            console.error("Leaderboard: Error listening to leaderboard data:", error);
            setMessage("Error loading leaderboard.");
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on component unmount.
    }, [db, isAuthReady, appId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 sm:p-6 md:p-8 font-inter text-gray-100">
            <div className="max-w-6xl mx-auto bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Global Leaderboard</h3>
                {loading ? (
                    <LoadingPage message="Loading leaderboard..." />
                ) : message ? (
                    <p className="text-red-500 text-center text-lg">{message}</p>
                ) : leaderboardData.length === 0 ? (
                    <p className="text-gray-400 text-center text-lg py-4">No users on the leaderboard yet.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-inner">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-xl">Rank</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User ID</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User Type</th> {/* New column */}
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Target Role</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-xl">Points</th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {leaderboardData.map((user, index) => (
                                    <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700 hover:bg-gray-600 transition duration-150'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 break-all">{user.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">{user.userType}</td> {/* Display user type */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.targetRole}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-100 font-extrabold">{user.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <MessageBox message={message} onConfirm={() => setMessage('')} />
            </div>
        </div>
    );
};


// Assessment Component for Gen-AI driven quizzes.
const Assessment = ({ setCurrentPage }) => {
    const { db, userId, appId, isAuthReady, geminiApiKey } = useContext(FirebaseContext);
    const [userProfile, setUserProfile] = useState(null);
    const [skillToAssess, setSkillToAssess] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // Corrected to useState
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [questionType, setQuestionType] = useState('mcq');
    const [userCode, setUserCode] = useState('');
    const [codeOutput, setCodeOutput] = useState(''); // Corrected to useState
    const [testResults, setTestResults] = useState([]); // Corrected to useState
    const [improvementSuggestions, setImprovementSuggestions] = useState([]); // New state for suggestions.

    // Fetch user profile on mount or auth state change.
    useEffect(() => {
        let unsubscribe;
        if (isAuthReady && userId && db) {
            setLoading(true);
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            unsubscribe = onSnapshot(userRef, (docSnap) => {
                console.log("Assessment onSnapshot: docSnap exists?", docSnap.exists());
                if (docSnap.exists()) {
                    console.log("Assessment onSnapshot: Profile data:", docSnap.data());
                    setUserProfile(docSnap.data());
                } else {
                    setUserProfile(null);
                    setMessage("Please set up your profile first.");
                    // Only redirect if not already on profile setup to avoid loop
                    if (window.location.hash !== '#profileSetup') { // Simple hash check for current page
                        setCurrentPage('profileSetup');
                    }
                }
                setLoading(false);
            }, (error) => {
                console.error("Assessment: Error fetching user profile in Assessment:", error);
                setMessage("Error loading user profile for assessment.");
                setLoading(false);
            });
        } else if (isAuthReady && !userId) {
            console.log("Assessment: Not authenticated, redirecting to auth.");
            setCurrentPage('auth');
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [userId, isAuthReady, db, appId, setCurrentPage]);


    // Helper to calculate skill gaps based on user's rated skills.
    const calculateSkillGaps = (currentSkills, targetRole) => {
        if (!currentSkills || !targetRole || !roleBenchmarks[targetRole]) {
            return [];
        }
        const requiredSkills = roleBenchmarks[targetRole];
        const gaps = [];
        const userSkillsMap = new Map(currentSkills.map(skill => [skill.name.toLowerCase(), skill.level]));

        for (const skill in requiredSkills) {
            const requiredProficiency = requiredSkills[skill];
            const userProficiency = userSkillsMap.has(skill.toLowerCase()) ? userSkillsMap.get(skill.toLowerCase()) : 0;
            const gapPercentage = Math.max(0, ((requiredProficiency - userProficiency) / requiredProficiency) * 100);
            if (gapPercentage > 0) {
                gaps.push({ skill: skill, gap: gapPercentage });
            }
        }
        return gaps.sort((a, b) => b.gap - a.gap);
    };

    // Generates quiz questions using Gemini API.
    const handleGenerateQuiz = async () => {
        setLoading(true);
        setMessage('');
        setQuizQuestions([]);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setShowResults(false);
        setUserCode('');
        setCodeOutput('');
        setTestResults([]);
        setImprovementSuggestions([]);

        if (!userProfile) {
            setMessage("User profile not loaded. Please ensure your profile is set up.");
            setLoading(false);
            return;
        }

        let promptText = "";
        let targetSkillForPrompt = skillToAssess;

        if (!skillToAssess && userProfile.skills && userProfile.targetRole) {
            const gaps = calculateSkillGaps(userProfile.skills, userProfile.targetRole);
            if (gaps.length > 0) {
                targetSkillForPrompt = gaps[0].skill; // Focus on the largest gap.
                promptText = `Generate 10 ${difficulty} difficulty quiz questions about ${targetSkillForPrompt} to help fill a skill gap. Include a mix of multiple-choice and coding challenges.`;
            } else {
                promptText = `Generate 10 ${difficulty} difficulty quiz questions about general software development. Include a mix of multiple-choice and coding challenges.`;
            }
        } else if (skillToAssess) {
            promptText = `Generate 10 ${difficulty} difficulty quiz questions about ${skillToAssess}. Include a mix of multiple-choice and coding challenges.`;
        } else {
            setMessage("Please enter a skill to assess or ensure your profile is set up to identify skill gaps.");
            setLoading(false);
            return;
        }

        promptText += ` For multiple-choice, provide 4 options and the correct answer. For coding challenges, provide a starter code, the language (javascript or python), and at least 2 test cases with input and expected output. Ensure the output is a JSON array of question objects.`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: promptText }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                question: { type: "STRING" },
                                type: { type: "STRING", enum: ["mcq", "coding"] },
                                options: { type: "ARRAY", items: { type: "STRING" } },
                                correctAnswer: { type: "STRING" },
                                starterCode: { type: "STRING" },
                                language: { type: "STRING" },
                                testCases: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            input: { type: "STRING" },
                                            expectedOutput: { type: "STRING" }
                                        },
                                        required: ["input", "expectedOutput"]
                                    }
                                },
                            },
                            required: ["question", "type"]
                        }
                    }
                }
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}. Response: ${errorBody}`);
            }

            const result = await response.json();
            
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(result.candidates[0].content.parts[0].text);
            } catch (parseError) {
                console.error("Assessment: Error parsing JSON response from Gemini API:", parseError);
                setMessage("Failed to parse quiz data from Gemini API. It might have returned malformed JSON. Falling back to mock data.");
                setQuizQuestions(generateMockQuestions(questionType, targetSkillForPrompt));
                return;
            }

            if (jsonResponse && jsonResponse.length > 0) {
                const filteredQuestions = jsonResponse.filter(q => {
                    if (q.type === 'coding') {
                        return q.starterCode && q.language && q.testCases && q.testCases.length > 0;
                    }
                    return true;
                });

                if (filteredQuestions.length > 0) {
                    setQuizQuestions(filteredQuestions);
                    setMessage("Quiz generated successfully with Gemini API!");
                    // Update workflow to 'Assessment Completed' after quiz generation.
                    if (db && userId && appId) {
                        const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
                        await updateDoc(userRef, { workflowProgress: 'Assessment Completed' });
                    }
                } else {
                    setMessage("Gemini API returned no valid questions after filtering. Falling back to mock data.");
                    setQuizQuestions(generateMockQuestions(questionType, targetSkillForPrompt));
                }
            } else {
                setMessage("Gemini API returned no questions or an empty array. Falling back to mock data.");
                setQuizQuestions(generateMockQuestions(questionType, targetSkillForPrompt));
            }
        } catch (error) {
            console.error("Assessment: Error generating quiz with Gemini API:", error);
            setMessage(`Failed to generate quiz with Gemini API: ${error.message}. Falling back to mock data.`);
            setQuizQuestions(generateMockQuestions(questionType, targetSkillForPrompt));
        } finally {
            setLoading(false);
        }
    };

    // Mock data generator for fallback if AI fails.
    const generateMockQuestions = (type, skill) => {
        const mockQuestions = [];
        for (let i = 0; i < 5; i++) { // Reduced mock questions to 5 for quicker testing.
            if (type === 'mcq') {
                mockQuestions.push({
                    type: 'mcq',
                    question: `(Mock MCQ ${i + 1} for ${skill || 'General'}) What is the capital of France?`,
                    options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
                    correctAnswer: 'Paris'
                });
            } else { // Coding challenge mock.
                mockQuestions.push({
                    type: 'coding',
                    question: `(Mock Coding ${i + 1} for ${skill || 'General'}) Write a JavaScript function 'addNumbers' that takes two numbers and returns their sum.`,
                    starterCode: `function addNumbers(a, b) {\n  // Your code here\n  return a + b;\n}`,
                    language: 'javascript',
                    testCases: [
                        { input: '[1,2]', expectedOutput: '3' },
                        { input: '[10,20]', expectedOutput: '30' }
                    ]
                });
            }
        }
        return mockQuestions;
    };

    const handleAnswerSelect = (questionIndex, selectedOption) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: selectedOption }));
    };

    const handleCodeChange = (e) => {
        setUserCode(e.target.value);
    };

    // Simulates code execution (JavaScript only, Python is placeholder).
    const handleRunCode = () => {
        const currentQuestion = quizQuestions[currentQuestionIndex];
        if (currentQuestion.type !== 'coding' || !currentQuestion.testCases) return;

        if (!userCode.trim()) {
            setCodeOutput("Please write some code before running tests.");
            setTestResults([]);
            return;
        }

        setCodeOutput('Running tests...');
        setTestResults([]);

        setTimeout(() => { // Simulate network delay.
            let passedTests = 0;
            const results = [];

            currentQuestion.testCases.forEach((test) => {
                let testPassed = false;
                let actualOutput = 'N/A';

                try {
                    if (currentQuestion.language === 'javascript') {
                        // WARNING: This is a very basic client-side simulation and not secure for production.
                        // For robust and secure code execution, you'd send the user's code and test cases
                        // to a secure backend environment (e.g., a Cloud Function or dedicated sandbox).
                        const functionNameMatch = userCode.match(/function\s+(\w+)\s*\(/);
                        const functionName = functionNameMatch ? functionNameMatch[1] : null;

                        if (functionName) {
                            const parsedInput = JSON.parse(`[${test.input}]`); // Ensure input is parsed as array for spread operator.
                            
                            const func = new Function(`
                                ${userCode}
                                try {
                                    return ${functionName}(...${JSON.stringify(parsedInput)});
                                } catch (e) {
                                    return 'ERROR: ' + e.message;
                                }
                            `);
                            actualOutput = func().toString();
                        } else {
                            actualOutput = "Error: Could not find function name in your code.";
                        }

                    } else if (currentQuestion.language === 'python') {
                        // Python execution cannot be simulated directly in browser JS.
                        // This is a placeholder for a backend call.
                        actualOutput = `Python simulation: (Input: ${test.input}) -> ${test.expectedOutput}`;
                    }

                    testPassed = (actualOutput === test.expectedOutput);
                } catch (e) {
                    actualOutput = `Error during execution: ${e.message}`;
                    testPassed = false;
                }

                if (testPassed) {
                    passedTests++;
                }
                results.push({
                    testCase: `Input: ${test.input}, Expected: ${test.expectedOutput}`,
                    actualOutput: actualOutput,
                    passed: testPassed
                });
            });

            setCodeOutput(`Tests completed. Passed ${passedTests}/${currentQuestion.testCases.length} tests.`);
            setTestResults(results);
        }, 2000);
    };

    // Submits the quiz, calculates score, updates skill level, and gets improvement suggestions.
    const handleSubmitQuiz = async () => {
        setShowResults(true);
        const score = calculateScore();
        const totalQuestions = quizQuestions.length;
        const percentage = (score / totalQuestions) * 100;
        const assessedSkill = skillToAssess || (userProfile?.targetRole ? calculateSkillGaps(userProfile.skills, userProfile.targetRole)[0]?.skill : 'General Skills');

        if (!db || !userId || !appId || !userProfile) return;

        try {
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            const currentSkills = userProfile.skills || [];
            let updatedSkills = [...currentSkills];
            let skillFound = false;

            // Find and update the assessed skill's level.
            updatedSkills = updatedSkills.map(s => {
                if (s.name.toLowerCase() === assessedSkill.toLowerCase()) {
                    skillFound = true;
                    // Simple logic: if score > 50%, increase level by 1 (max 5), else decrease by 1 (min 0).
                    let newLevel = s.level;
                    if (percentage > 50) {
                        newLevel = Math.min(s.level + 1, 5);
                    } else if (percentage <= 50 && s.level > 0) {
                        newLevel = Math.max(s.level - 1, 0);
                    }
                    return { ...s, level: newLevel, lastAssessed: new Date().toISOString() };
                }
                return s;
            });

            // If the assessed skill was not in the profile, add it with an new initial level.
            if (!skillFound && assessedSkill !== 'General Skills') {
                updatedSkills.push({
                    name: assessedSkill,
                    level: percentage > 50 ? 3 : 1, // Initial level based on performance.
                    lastAssessed: new Date().toISOString()
                });
            }

            // Update workflow progress and skill levels in Firestore.
            await updateDoc(userRef, {
                workflowProgress: 'Recommendations Generated',
                skills: updatedSkills // Save updated skill levels.
            });
            setMessage("Quiz submitted! Workflow progress and skill levels updated.");

            // Get improvement suggestions from Gemini API.
            await getImprovementSuggestions(assessedSkill, percentage);

        } catch (error) {
            console.error("Assessment: Error updating workflow progress or skill levels:", error);
            setMessage("Error submitting quiz and updating workflow.");
        }
    };

    // Requests improvement suggestions from Gemini API.
    const getImprovementSuggestions = async (skill, scorePercentage) => {
        setLoading(true);
        setImprovementSuggestions([]);
        const feedback = scorePercentage > 75 ? "excellent" : scorePercentage > 50 ? "good" : scorePercentage > 25 ? "fair" : "needs significant improvement";
        const promptText = `I just took an assessment on ${skill} and my score was ${scorePercentage.toFixed(0)}% (${feedback}). Based on this, suggest 3-5 specific concepts, resources (e.g., topics, types of exercises, project ideas), or learning paths to improve my proficiency in ${skill}. Provide the output as a JSON array of strings.`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: promptText }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                    }
                }
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}. Response: ${errorBody}`);
            }

            const result = await response.json();
            let suggestionsArray;
            try {
                suggestionsArray = JSON.parse(result.candidates[0].content.parts[0].text);
            } catch (parseError) {
                console.error("Assessment: Error parsing JSON response for suggestions:", parseError);
                setImprovementSuggestions(["Could not generate specific suggestions. Focus on core concepts."]);
                return;
            }

            if (suggestionsArray && suggestionsArray.length > 0) {
                setImprovementSuggestions(suggestionsArray);
            } else {
                setImprovementSuggestions(["No specific improvement suggestions could be generated by AI."]);
            }
        } catch (error) {
            console.error("Assessment: Error getting improvement suggestions:", error);
            setImprovementSuggestions([`Failed to get suggestions: ${error.message}.`]);
        } finally {
            setLoading(false);
        }
    };

    const calculateScore = () => {
        let score = 0;
        quizQuestions.forEach((q, index) => {
            if (q.type === 'mcq') {
                if (userAnswers[index] === q.correctAnswer) {
                    score++;
                }
            } else if (q.type === 'coding') {
                // For coding, check if all simulated tests passed.
                const currentQuestionTestResults = testResults.filter(r => r.passed);
                if (currentQuestionTestResults.length === q.testCases.length && userCode.trim()) {
                     score++;
                }
            }
        });
        return score;
    };

    const currentQuestion = quizQuestions[currentQuestionIndex];

    if (loading || !userProfile) {
        return <LoadingPage message={loading ? "Loading assessment..." : "User profile not loaded. Please ensure your profile is set up."} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 sm:p-6 md:p-8 font-inter text-gray-100">
            <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">AI-Powered Assessment</h3>

                {!quizQuestions.length ? (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <label className="block text-gray-300 text-sm font-bold mb-2">Question Type</label>
                            <select
                                value={questionType}
                                onChange={(e) => setQuestionType(e.target.value)}
                                className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:shadow-outline
                                           bg-gray-700 border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 ease-in-out text-lg"
                            >
                                <option value="mcq">Multiple Choice</option>
                                <option value="coding">Coding Challenge</option>
                            </select>
                        </div>
                        <Input
                            label="Skill to Assess (Leave blank to assess skill gaps)"
                            value={skillToAssess}
                            onChange={(e) => setSkillToAssess(e.target.value)}
                            placeholder="e.g., React Hooks, Python Data Structures"
                            className="text-lg"
                        />
                        <div className="mb-6">
                            <label className="block text-gray-300 text-sm font-bold mb-2">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:shadow-outline
                                           bg-gray-700 border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 ease-in-out text-lg"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        <Button onClick={handleGenerateQuiz} className="w-full text-xl" disabled={loading} icon={Brain}>
                            {loading ? 'Generating Quiz...' : 'Generate New Quiz'}
                        </Button>
                        <Button onClick={() => setCurrentPage('dashboard')} className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-xl" icon={Home}>Back to Dashboard</Button>
                        <MessageBox message={message} onConfirm={() => setMessage('')} />
                    </div>
                ) : showResults ? (
                    <div className="space-y-6">
                        <h4 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-6">Quiz Results</h4>
                        <p className="text-2xl text-center text-gray-200 mb-6">You scored: <span className="font-bold text-green-400">{calculateScore()}</span> out of <span className="font-bold text-blue-400">{quizQuestions.length}</span></p>
                        
                        {/* Improvement Suggestions */}
                        {improvementSuggestions.length > 0 && (
                            <div className="bg-gray-700 p-6 rounded-xl shadow-md border border-gray-600 mb-6">
                                <h5 className="text-xl font-semibold text-yellow-400 mb-3">Improvement Suggestions:</h5>
                                <ul className="list-disc list-inside text-gray-300 text-lg space-y-2">
                                    {improvementSuggestions.map((suggestion, idx) => (
                                        <li key={idx}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            {quizQuestions.map((q, qIndex) => (
                                <div key={qIndex} className="mb-4 p-6 rounded-xl bg-gray-700 border border-gray-600 shadow-md">
                                    <p className="font-semibold text-xl mb-3 text-gray-100">{qIndex + 1}. {q.question}</p>
                                    {q.type === 'mcq' ? (
                                        <ul className="list-disc list-inside text-gray-300 text-lg space-y-2">
                                            {q.options.map((option, oIndex) => (
                                                <li key={oIndex} className={`mb-1 ${userAnswers[qIndex] === option ? (option === q.correctAnswer ? 'text-green-400 font-bold' : 'text-red-400 font-bold line-through') : ''}`}>
                                                    {option} {userAnswers[qIndex] === option && (option === q.correctAnswer ? ' (Your Correct Answer)' : ' (Your Answer)')}
                                                    {option === q.correctAnswer && userAnswers[qIndex] !== option && <span className="text-green-500"> (Correct Answer)</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="mt-4">
                                            <p className="text-gray-300 font-semibold mb-2">Your Code:</p>
                                            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-200 border border-gray-700">{userCode}</pre>
                                            <p className="text-gray-300 font-semibold mt-4 mb-2">Test Results:</p>
                                            {testResults.length > 0 ? (
                                                <div className="space-y-2">
                                                    {testResults.map((res, resIndex) => (
                                                        <div key={resIndex} className={`p-2 rounded-lg flex items-center gap-2 ${res.passed ? 'bg-green-800/20 text-green-300' : 'bg-red-800/20 text-red-300'}`}>
                                                            {res.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                            <span>{res.testCase}</span>
                                                            <span className="ml-auto">Actual: {res.actualOutput}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-400">No test results available.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setQuizQuestions([])} className="w-full mt-6 text-xl" icon={BookOpen}>Take Another Quiz</Button>
                        <Button onClick={() => setCurrentPage('dashboard')} className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-xl" icon={Home}>Back to Dashboard</Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h4 className="text-3xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                            {currentQuestion.type === 'mcq' ? `Quiz on ${skillToAssess || 'Skill Gap'}` : `Coding Challenge: ${skillToAssess || 'Skill Gap'}`}
                        </h4>
                        {currentQuestion && (
                            <div className="bg-gray-700 p-8 rounded-xl shadow-lg border border-gray-600">
                                <p className="text-2xl font-semibold mb-6 text-gray-100">
                                    {currentQuestionIndex + 1}. {currentQuestion.question}
                                </p>
                                {currentQuestion.type === 'mcq' ? (
                                    <div className="space-y-4">
                                        {currentQuestion.options.map((option, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
                                                className={`w-full text-left p-4 rounded-lg border transition duration-200 text-lg
                                                    ${userAnswers[currentQuestionIndex] === option
                                                        ? 'bg-blue-600 border-blue-700 text-white shadow-inner transform scale-100'
                                                        : 'bg-gray-600 border-gray-500 text-gray-200 hover:bg-gray-500 hover:border-gray-400'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="block text-gray-300 text-sm font-bold mb-2">Write your {currentQuestion.language} code here:</label>
                                        <textarea
                                            value={userCode || currentQuestion.starterCode}
                                            onChange={handleCodeChange}
                                            rows="10"
                                            className="w-full p-4 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Start coding..."
                                        ></textarea>
                                        <Button onClick={handleRunCode} className="w-full text-lg" icon={Play}>Run Code</Button>
                                        {codeOutput && (
                                            <div className="mt-4 p-4 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-sm">
                                                <p className="font-semibold mb-2">Output:</p>
                                                <pre className="whitespace-pre-wrap">{codeOutput}</pre>
                                                {testResults.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="font-semibold mb-2">Detailed Test Results:</p>
                                                        {testResults.map((res, resIndex) => (
                                                            <div key={resIndex} className={`p-2 rounded-lg flex items-center gap-2 ${res.passed ? 'bg-green-800/20 text-green-300' : 'bg-red-800/20 text-red-300'}`}>
                                                                {res.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                                <span>{res.testCase}</span>
                                                                <span className="ml-auto">Actual: {res.actualOutput}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between mt-8">
                            {currentQuestionIndex > 0 && (
                                <Button onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="bg-gray-600 hover:bg-gray-700 text-lg">Previous</Button>
                            )}
                            {currentQuestionIndex < quizQuestions.length - 1 ? (
                                <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="ml-auto text-lg">Next</Button>
                            ) : (
                                <Button onClick={handleSubmitQuiz} className="ml-auto bg-green-600 hover:bg-green-700 text-lg">Submit Quiz</Button>
                            )}
                        </div>
                        <MessageBox message={message} onConfirm={() => setMessage('')} />
                    </div>
                )}
            </div>
        </div>
    );
};


// Dashboard Component: Main landing page after login, shows user progress and navigation.
const Dashboard = ({ setCurrentPage }) => {
    const { db, auth, userId, isAuthReady, appId } = useContext(FirebaseContext);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Set up real-time listener for user profile.
        let unsubscribe;
        if (isAuthReady && userId && db) {
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            unsubscribe = onSnapshot(userRef, (docSnap) => {
                console.log("Dashboard onSnapshot: docSnap exists?", docSnap.exists());
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("Dashboard onSnapshot: Profile data:", data);
                    setUserProfile(data);
                    console.log("Dashboard: userProfile state updated to:", data);
                    console.log("Dashboard: Current workflowProgress:", data.workflowProgress);
                } else {
                    console.log("Dashboard onSnapshot: Profile document does not exist for userId:", userId);
                    setUserProfile(null);
                    setMessage("Please set up your profile.");
                }
                setLoading(false);
            }, (error) => {
                console.error("Dashboard: Error fetching user profile in Dashboard:", error);
                setMessage("Error loading user profile.");
                setLoading(false);
            });
        } else if (isAuthReady && !userId) {
            console.log("Dashboard: Not authenticated, redirecting to auth.");
            setCurrentPage('auth');
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [userId, isAuthReady, db, appId, setCurrentPage]);

    const handleLogout = async () => {
        if (auth) {
            try {
                await signOut(auth);
                setCurrentPage('auth');
                console.log("User logged out.");
            } catch (error) {
                console.error("Dashboard: Error logging out:", error);
                setMessage("Error logging out.");
            }
        }
    };

    if (loading) {
        return <LoadingPage message="Loading dashboard..." />;
    }

    // If no user profile, prompt to set it up.
    if (!userProfile) {
        console.log("Dashboard: userProfile is null, showing profile setup prompt.");
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
                <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl text-center border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <p className="text-gray-300 text-lg mb-4">Welcome! Please set up your profile to get started.</p>
                    <Button onClick={() => setCurrentPage('profileSetup')} icon={User} className="text-lg">Go to Profile Setup</Button>
                    <MessageBox message={message} onConfirm={() => setMessage('')} />
                </div>
            </div>
        );
    }
    // ADDED LOG HERE:
    console.log("Dashboard: Rendering with userProfile:", userProfile);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 sm:p-6 md:p-8 font-inter text-gray-100">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6 sm:mb-0">
                        Welcome, {userProfile.email ? userProfile.email.split('@')[0] : 'Maverick User'}!
                    </h1>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-4">
                        <Button onClick={() => setCurrentPage('profileSetup')} icon={Edit} className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-lg">Edit Profile</Button>
                        {/* New button to view completed courses */}
                        <Button onClick={() => setCurrentPage('learningPlatform', { showCompletedOnly: true })} icon={FileTextIcon} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg">View Completed Courses</Button>
                        <Button onClick={() => setCurrentPage('leaderboard')} icon={Users} className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-lg">View Leaderboard</Button>
                        <Button onClick={() => setCurrentPage('assessment')} icon={Brain} className="bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-lg">Take Assessment</Button>
                        <Button onClick={() => setCurrentPage('learningPlatform')} icon={BookOpen} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-lg">Learning Modules</Button>
                        <Button onClick={handleLogout} icon={LogOut} className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-lg">Logout</Button>
                    </div>
                </div>

                {/* Workflow Progress Bar */}
                <WorkflowProgressBar currentStage={userProfile.workflowProgress || 'Profile Loaded'} />

                {/* User Progress Card */}
                <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl mb-8 border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">Your Progress</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-300 text-lg">
                        <div className="flex items-center gap-3">
                            <Award size={28} className="text-yellow-400" />
                            <p>Current Points: <span className="font-bold text-yellow-300 text-xl">{userProfile.points || 0}</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Target size={28} className="text-purple-400" />
                            <p>Target Role: <span className="font-bold text-purple-300 text-xl">{userProfile.targetRole || 'Not Set'}</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                            <BookOpen size={28} className="text-green-400" />
                            <p>Total Skills Rated: <span className="font-bold text-green-300 text-xl">{userProfile.skills?.length || 0}</span></p>
                        </div>
                    </div>
                </div>

                {/* Skill Gap Analysis Section */}
                <SkillGapAnalysis userSkills={userProfile.skills || []} targetRole={userProfile.targetRole || ''} />

                {/* Learning Recommendations Section */}
                <LearningPlatform
                    userSkills={userProfile.skills || []}
                    targetRole={userProfile.targetRole || ''}
                    completedModules={userProfile.completedModules || []}
                />
                <MessageBox message={message} onConfirm={() => setMessage('')} />
            </div>
        </div>
    );
};

// Admin Dashboard Component (Placeholder)
const AdminDashboard = ({ setCurrentPage }) => {
    const { auth, userRole, db, appId, isAuthReady } = useContext(FirebaseContext);
    const [message, setMessage] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        // Only proceed if Firebase is ready, db is available, and userRole is determined.
        if (!isAuthReady || !db || userRole === null) {
            console.log("AdminDashboard useEffect: Not ready or userRole not determined. isAuthReady:", isAuthReady, "db:", !!db, "userRole:", userRole);
            return;
        }

        if (userRole !== 'admin') {
            console.log("AdminDashboard useEffect: User is not admin (userRole:", userRole, "), redirecting to dashboard.");
            setMessage("Access Denied: You are not authorized to view the admin dashboard.");
            setCurrentPage('dashboard'); // Redirect non-admins to employee dashboard
            return;
        }

        const fetchAllUsers = async () => {
            setLoadingUsers(true);
            try {
                const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
                const snapshot = await getDocs(usersCollectionRef); // Use getDocs for one-time fetch
                const usersData = [];
                for (const userDoc of snapshot.docs) {
                    const profileDocRef = doc(db, `artifacts/${appId}/users/${userDoc.id}/profile`, 'data');
                    const profileSnap = await getDoc(profileDocRef);
                    if (profileSnap.exists()) {
                        usersData.push({ id: userDoc.id, ...profileSnap.data() });
                    }
                }
                setAllUsers(usersData);
                console.log("AdminDashboard: All users fetched:", usersData.length);
            } catch (error) {
                console.error("AdminDashboard: Error fetching all users for admin dashboard:", error);
                setMessage("Failed to load user data.");
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchAllUsers();
        // You might want to set up an onSnapshot listener here for real-time updates
        // if the admin dashboard needs to be highly dynamic, but for simplicity,
        // a one-time fetch on mount is used.
    }, [db, appId, isAuthReady, userRole, auth, setCurrentPage]); // Added userRole to dependencies

    const handleLogout = async () => {
        if (auth) {
            try {
                await signOut(auth);
                setCurrentPage('auth');
                console.log("Admin logged out.");
            } catch (error) {
                console.error("AdminDashboard: Error logging out admin:", error);
                setMessage("Error logging out.");
            }
        }
    };

    if (loadingUsers) {
        return <LoadingPage message="Loading admin dashboard..." />;
    }

    // This check is redundant due to the useEffect logic above, but kept for clarity.
    if (userRole !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
                <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl text-center border border-gray-700">
                    <h2 className="text-3xl font-extrabold text-red-500 mb-4">Access Denied</h2>
                    <p className="text-gray-300 text-lg mb-6">You do not have administrative privileges to view this page.</p>
                    <Button onClick={() => setCurrentPage('dashboard')} icon={Home} className="text-lg">Go to Employee Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 sm:p-6 md:p-8 font-inter text-gray-100">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-6 sm:mb-0">
                        Admin Dashboard
                    </h1>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-4">
                        <Button onClick={handleLogout} icon={LogOut} className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-lg">Logout</Button>
                    </div>
                </div>

                <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl mb-8 border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">All Users Overview</h2>
                    {allUsers.length === 0 ? (
                        <p className="text-gray-400 text-center text-lg py-4">No users registered yet.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-inner">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-xl">Email</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User Type</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Target Role</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Points</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-xl">Workflow Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {allUsers.map((user) => (
                                        <tr key={user.id} className="bg-gray-800 hover:bg-gray-700 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">{user.userType}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.targetRole || 'Not Set'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.points || 0}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.workflowProgress || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <MessageBox message={message} onConfirm={() => setMessage('')} />
            </div>
        </div>
    );
};


// Loading Page Component
const LoadingPage = ({ message = "Loading..." }) => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-400 text-2xl">
        <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>{message}</p>
        </div>
    </div>
);


// The main App component that handles routing and overall application flow.
const App = () => {
    const { userId, isAuthReady, db, appId, userRole, auth } = useContext(FirebaseContext);
    const [currentPage, setCurrentPage] = useState('loading'); // Start with loading
    const [pageProps, setPageProps] = useState({}); // To pass additional props to pages

    // This callback is specifically for when Auth component signals a successful login
    // AND the message box is dismissed.
    const handleAuthSuccessAndMessageDismissed = useCallback(async () => {
        console.log("App: handleAuthSuccessAndMessageDismissed called. Re-evaluating route.");
        // Re-evaluate the route based on current auth state and user role
        // This is crucial because userRole might have just been set by FirebaseProvider
        // after the login.
        if (userId && userRole) { // Ensure userId and userRole are available
            try {
                const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
                const docSnap = await getDoc(userProfileRef);

                if (docSnap.exists()) {
                    const profileData = docSnap.data();
                    if (profileData.userType === 'admin') {
                        setCurrentPage('adminDashboard');
                        console.log("App: Redirecting to adminDashboard after auth success and message dismissed.");
                    } else { // employee
                        // Check if profile is complete, otherwise go to profile setup
                        if (profileData.targetRole && profileData.skills && profileData.skills.length > 0) {
                             setCurrentPage('dashboard');
                             console.log("App: Redirecting to dashboard after auth success and message dismissed (profile complete).");
                        } else {
                             setCurrentPage('profileSetup');
                             console.log("App: Redirecting to profileSetup after auth success and message dismissed (profile incomplete).");
                        }
                    }
                } else {
                    // This case should ideally not happen if login was successful, but as a fallback
                    setCurrentPage('profileSetup');
                    console.log("App: Redirecting to profileSetup after auth success and message dismissed (no profile found).");
                }
            } catch (error) {
                console.error("App: Error during post-auth routing:", error);
                setCurrentPage('auth'); // Fallback to auth on error
            }
        } else {
            // If userId or userRole are still null, it means the auth state change hasn't propagated fully
            // or the user was logged out (e.g., role mismatch). Stay on auth page.
            setCurrentPage('auth');
            console.log("App: userId or userRole not ready after message dismissed. Staying on auth.");
        }
    }, [userId, userRole, db, appId]); // Depend on relevant states

    // Initial routing logic when the App component mounts or dependencies change
    useEffect(() => {
        console.log("App useEffect (initial routing): isAuthReady:", isAuthReady, "userId:", userId, "userRole:", userRole);

        if (!isAuthReady) {
            setCurrentPage('loading');
            return;
        }

        if (!userId) {
            console.log("App useEffect: No user ID, setting page to auth.");
            setCurrentPage('auth');
            return;
        }

        if (userRole === null) {
            console.log("App useEffect: User ID present, but userRole is null. Waiting for role.");
            setCurrentPage('loading'); // Keep loading until role is fetched
            return;
        }

        // Now that userId and userRole are known, determine the page
        const determinePage = async () => {
            try {
                const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
                const docSnap = await getDoc(userProfileRef);

                if (userRole === 'admin') {
                    // Defensive check for auto-logged in admin not explicitly going to admin dashboard
                    if (!docSnap.exists() || docSnap.data().userType !== 'admin') {
                        console.warn("App useEffect: Auto-logged in user is not a registered admin. Forcing logout.");
                        await signOut(auth);
                        setCurrentPage('auth');
                        return;
                    }
                    console.log("App useEffect: User is admin, setting page to adminDashboard.");
                    setCurrentPage('adminDashboard');
                } else { // employee
                    if (docSnap.exists() && docSnap.data().targetRole && docSnap.data().skills && docSnap.data().skills.length > 0) {
                        console.log("App useEffect: Employee profile complete, setting page to dashboard.");
                        setCurrentPage('dashboard');
                    } else {
                        console.log("App useEffect: Employee profile incomplete or not found, setting page to profileSetup.");
                        setCurrentPage('profileSetup');
                    }
                }
            } catch (error) {
                console.error("App useEffect: Error determining initial page:", error);
                setCurrentPage('auth'); // Fallback on error
            }
        };

        // Only run determination if we are currently in a loading or auth state
        // and all necessary auth/role info is available.
        if (currentPage === 'loading' || currentPage === 'auth') {
            determinePage();
        }

    }, [isAuthReady, userId, userRole, db, appId, auth]); // Dependencies for initial routing

    // Function to change page, potentially with props
    const navigateTo = (page, props = {}) => {
        console.log(`App: navigateTo called. Setting currentPage to ${page} with props:`, props);
        setCurrentPage(page);
        setPageProps(props);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'loading':
                return <LoadingPage message="Initializing application..." />; // Use LoadingPage component
            case 'auth':
                return <Auth setCurrentPage={navigateTo} onAuthSuccessAndMessageDismissed={handleAuthSuccessAndMessageDismissed} />;
            case 'profileSetup':
                return <ProfileSetup setCurrentPage={navigateTo} />;
            case 'dashboard':
                return <Dashboard setCurrentPage={navigateTo} />;
            case 'adminDashboard':
                return <AdminDashboard setCurrentPage={navigateTo} />;
            case 'assessment':
                return <Assessment setCurrentPage={navigateTo} />;
            case 'learningPlatform':
                return <LearningPlatform setCurrentPage={navigateTo} {...pageProps} />;
            case 'leaderboard':
                return <Leaderboard setCurrentPage={navigateTo} />;
            default:
                return (
                    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-red-400 text-2xl">
                        404: Page Not Found
                        <Button onClick={() => navigateTo('dashboard')} className="mt-4">Go to Dashboard</Button>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 font-inter">
            {renderPage()}
        </div>
    );
};

// Default export the main App component
export default App;
