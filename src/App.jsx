import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react'; // Added useMemo
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, collection, getDoc } from 'firebase/firestore'; // Removed getDocs
import Chart from 'chart.js/auto'; // Import Chart.js
import { Home, User, Target, Brain, Award, Users, LogOut, Edit, BarChart, BookOpen, MessageSquare, Briefcase, UploadCloud, Code, Play, CheckCircle, XCircle, Settings, Search, FileText } from 'lucide-react'; // Reverted to import for better compatibility

// --- Firebase Context ---
const FirebaseContext = createContext(null);

const FirebaseProvider = ({ children }) => {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState("AIzaSyDoTy24lAZVPkcN-B5JTz8xh4shI0MwgdB4"); // State for Gemini API Key

    // --- Firebase Configuration (YOUR ACTUAL CONFIG) ---
    // Wrapped localFirebaseConfig in useMemo to stabilize it for useEffect dependencies
    const localFirebaseConfig = useMemo(() => ({
        apiKey: "AIzaSyCkeJrNLrv4u1et8kqiYqwhVVUaW5ZPQ8I", // Firebase API Key
        authDomain: "maverick-assessment.firebaseapp.com", // Replace with your actual auth domain
        projectId: "maverick-assessment", // Replace with your actual project ID
        storageBucket: "maverick-assessment.firebasestorage.app", // Replace with your actual storage bucket
        messagingSenderId: "125120689173", // Replace with your actual messaging sender ID
        appId: "1:125120689173:web:0a4599f860f19d36908a1c" // Replace with your actual app ID
    }), []); // Empty dependency array means it's created once

    // --- END OF Firebase Configuration ---

    useEffect(() => {
        // Initialize Firebase only once
        if (!app) {
            try {
                const initializedApp = initializeApp(localFirebaseConfig);
                const firestoreDb = getFirestore(initializedApp);
                const firebaseAuth = getAuth(initializedApp);

                setApp(initializedApp);
                setDb(firestoreDb);
                setAuth(firebaseAuth);

                // Listen for auth state changes
                const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                    if (user) {
                        setUserId(user.uid);
                    } else {
                        try {
                            await signInAnonymously(firebaseAuth);
                            const currentUserId = firebaseAuth.currentUser?.uid || crypto.randomUUID();
                            setUserId(currentUserId);
                        } catch (error) {
                            console.error("Error during anonymous sign-in:", error);
                            setUserId(crypto.randomUUID()); // Fallback if anonymous fails
                        }
                    }
                    setIsAuthReady(true);
                });

                return () => unsubscribe(); // Cleanup auth listener
            } catch (error) {
                console.error("Failed to initialize Firebase:", error);
            }
        }
    }, [app, localFirebaseConfig]); // localFirebaseConfig is now stable due to useMemo

    // This appId now correctly references localFirebaseConfig.appId
    const appId = localFirebaseConfig.appId;

    return (
        <FirebaseContext.Provider value={{ app, db, auth, userId, isAuthReady, appId, localFirebaseConfig, geminiApiKey }}> {/* Added geminiApiKey to context */}
            {children}
        </FirebaseContext.Provider>
    );
};

// --- Reusable Components ---

// Input field component
function Input({ label, type = 'text', value, onChange, placeholder, className = '' }) {
    return (
        <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`shadow-inner appearance-none border rounded-lg w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline
                            bg-gray-700 border-gray-600 placeholder-gray-400
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out ${className}`} />
        </div>
    );
}

// Button component
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

// Progress Bar component
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

// Message Box Component (for alerts/confirmations)
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

// Workflow Progress Bar Component
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

// Authentication Component
const Auth = ({ setCurrentPage }) => {
    const { auth, db, userId, isAuthReady, appId } = useContext(FirebaseContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [message, setMessage] = useState('');

    const handleAuth = async () => {
        if (!isAuthReady) {
            setMessage("Firebase not ready. Please wait.");
            return;
        }

        try {
            let userCredential;
            if (isRegister) {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Create user profile in Firestore
                const userRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile`, 'data');
                await setDoc(userRef, {
                    email: userCredential.user.email,
                    skills: [],
                    targetRole: '',
                    points: 0,
                    badges: [],
                    userId: userCredential.user.uid, // Store userId in the document
                    workflowProgress: 'Profile Loaded' // Initial workflow stage
                });
                setMessage("Registration successful! Please log in.");
                setIsRegister(false); // Switch to login after registration
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                setMessage("Login successful!");
                setCurrentPage('dashboard');
            }
        } catch (error) {
            console.error("Auth error:", error);
            setMessage(`Authentication failed: ${error.message}`);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-gray-950 p-4 font-inter">
            <div className="flex flex-col lg:flex-row bg-gray-800 rounded-3xl shadow-2xl w-full h-full border border-gray-700 overflow-hidden">
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

                <div className="lg:w-1/2 p-10 flex flex-col justify-center bg-gray-800">
                    <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        {isRegister ? 'Join Maverick' : 'Welcome Back!'}
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
                    <Button onClick={handleAuth} className="w-full mb-6 text-xl">
                        {isRegister ? 'Register Account' : 'Sign In'}
                    </Button>
                    <p className="text-center text-gray-400 text-md">
                        {isRegister ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
                        <span
                            className="text-blue-400 cursor-pointer hover:underline font-semibold"
                            onClick={() => setIsRegister(!isRegister)}
                        >
                            {isRegister ? 'Login here' : 'Register here'}
                        </span>
                    </p>
                    <MessageBox message={message} onConfirm={() => setMessage('')} />
                </div>
            </div>
        </div>
    );
};

// Profile Setup Component
const ProfileSetup = ({ setCurrentPage }) => {
    const { db, userId, isAuthReady, appId } = useContext(FirebaseContext);
    const [userSkills, setUserSkills] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user profile data when component mounts or userId changes
        const fetchUserProfile = async () => {
            if (isAuthReady && userId && db) {
                setLoading(true);
                try {
                    const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserSkills(data.skills ? data.skills.join(', ') : '');
                        setTargetRole(data.targetRole || '');
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setMessage("Error loading profile.");
                } finally {
                    setLoading(false);
                }
            } else if (isAuthReady && !userId) {
                // If auth is ready but no userId (e.g., failed anonymous sign-in), redirect to auth
                setCurrentPage('auth');
            }
        };

        fetchUserProfile();
    }, [userId, isAuthReady, db, appId, setCurrentPage]);

    const handleSaveProfile = async () => {
        if (!isAuthReady || !userId || !db) {
            setMessage("Firebase not ready. Please wait.");
            return;
        }
        setLoading(true);
        try {
            const skillsArray = userSkills.split(',').map(s => s.trim()).filter(s => s !== '');
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            await setDoc(userRef, {
                skills: skillsArray,
                targetRole: targetRole,
                workflowProgress: 'Assessment Pending' // Update workflow stage here
            }, { merge: true }); // Use merge to update existing fields without overwriting others
            setMessage("Profile saved successfully!");
            setCurrentPage('dashboard'); // Navigate to dashboard after saving
        } catch (error) {
            console.error("Error saving profile:", error);
            setMessage("Error saving profile.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-400 text-2xl">Loading profile...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
            <div className="bg-gray-800 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                <h2 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 animate-pulse">
                    Setup Your Profile
                </h2>
                <Input
                    label="Your Known Skills (comma-separated)"
                    value={userSkills}
                    onChange={(e) => setUserSkills(e.target.value)}
                    placeholder="e.g., JavaScript, React, HTML, CSS"
                    className="mb-6"
                />
                <Input
                    label="Target Role"
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

// Mock Role Benchmarks
const roleBenchmarks = {
    'Frontend Developer': {
        'HTML': 5, 'CSS': 5, 'JavaScript': 5, 'React': 4, 'Tailwind CSS': 3, 'Node.js': 2, 'Databases': 1
    },
    'Backend Developer': {
        'Node.js': 5, 'Python': 4, 'Databases': 5, 'APIs': 4, 'Cloud': 3, 'Frontend': 2
    },
    'Data Scientist': {
        'Python': 5, 'R': 4, 'Statistics': 5, 'Machine Learning': 4, 'SQL': 4, 'Data Visualization': 3
    }
    // Add more roles and their required skills/proficiency levels (1-5)
};

// Skill Gap Analysis Component
const SkillGapAnalysis = ({ userSkills, targetRole }) => {
    const [skillGaps, setSkillGaps] = useState([]);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null); // To store the Chart.js instance

    useEffect(() => {
        if (!userSkills || !targetRole || !roleBenchmarks[targetRole]) {
            setSkillGaps([]);
            return;
        }

        const requiredSkills = roleBenchmarks[targetRole];
        const gaps = [];

        // Convert userSkills array to a map for easier lookup
        const userSkillsMap = new Map(userSkills.map(skill => [skill.toLowerCase(), 5])); // Assume user has max proficiency in stated skills

        for (const skill in requiredSkills) {
            const requiredProficiency = requiredSkills[skill];
            const userProficiency = userSkillsMap.has(skill.toLowerCase()) ? 5 : 0; // If user has skill, assume max, else 0

            // Calculate gap: (required - user_proficiency) / required * 100
            const gapPercentage = Math.max(0, ((requiredProficiency - userProficiency) / requiredProficiency) * 100);

            gaps.push({
                skill: skill,
                required: requiredProficiency,
                user: userProficiency,
                gap: gapPercentage
            });
        }
        setSkillGaps(gaps);
    }, [userSkills, targetRole]);

    useEffect(() => {
        // Destroy existing chart before creating a new one
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
                            max: 5, // Max proficiency level
                            title: {
                                display: true,
                                text: 'Proficiency Level (1-5)',
                                color: '#E0E0E0' // Light gray for text
                            },
                            ticks: {
                                color: '#B0B0B0' // Lighter gray for ticks
                            },
                            grid: {
                                color: '#444' // Darker grid lines
                            }
                        },
                        x: {
                            ticks: {
                                color: '#B0B0B0' // Lighter gray for ticks
                            },
                            grid: {
                                color: '#444' // Darker grid lines
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#E0E0E0' // Light gray for legend labels
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
                        duration: 1000, // Animation duration in milliseconds
                        easing: 'easeOutQuart' // Easing function
                    }
                },
            });
        }
    }, [userSkills, targetRole]);

    return (
        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl mb-8 border border-gray-700 transform hover:scale-105 transition-transform duration-300"> {/* Enhanced card styling */}
            <h3 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-500">Skill Gap Analysis for {targetRole}</h3>
            {skillGaps.length === 0 ? (
                <p className="text-gray-400 text-lg text-center py-4">Please set your skills and target role in your profile to see skill gaps.</p>
            ) : (
                <>
                    <div className="h-72 mb-6"> {/* Increased height for the chart */}
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

// Learning Recommendations Component
const LearningRecommendations = ({ skillGaps, onCompleteModule, completedModules }) => {
    const recommendedModules = skillGaps
        .filter(gap => gap.gap > 0) // Only recommend for skills with a gap
        .sort((a, b) => b.gap - a.gap) // Sort by largest gap first
        .map(gap => ({
            skill: gap.skill,
            moduleName: `${gap.skill} Fundamentals`,
            description: `Learn the core concepts and practices of ${gap.skill}.`,
            points: 50, // Points awarded for completing this module
            estimatedTime: `${Math.floor(Math.random() * 3) + 1} hours`, // Mock estimated time
            status: completedModules.includes(`${gap.skill} Fundamentals`) ? 'Done' : 'Not Started' // Initial status
        }));

    return (
        <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl mb-8 border border-gray-700 transform hover:scale-105 transition-transform duration-300"> {/* Enhanced card styling */}
            <h3 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Recommended Learning Modules</h3>
            {recommendedModules.length === 0 ? (
                <p className="text-gray-400 text-lg text-center py-4">Great! No significant skill gaps found for your target role, or please set your target role.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* More columns on larger screens */}
                    {recommendedModules.map((module, index) => (
                        <div key={index} className="bg-gray-700 border border-gray-600 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition duration-300 ease-in-out hover:scale-105"> {/* Enhanced module card */}
                            <div>
                                <h4 className="text-2xl font-semibold text-blue-400 mb-3">{module.moduleName}</h4>
                                <p className="text-gray-300 text-md mb-3">{module.description}</p>
                                <p className="text-gray-400 text-sm mb-2">Estimated Time: <span className="font-bold">{module.estimatedTime}</span></p>
                                <p className="text-gray-400 text-sm">Status: <span className={`font-bold ${module.status === 'Done' ? 'text-green-400' : 'text-yellow-400'}`}>{module.status}</span></p>
                                <p className="text-gray-400 text-sm">Points for completion: <span className="font-bold">{module.points}</span></p>
                            </div>
                            <Button
                                onClick={() => onCompleteModule(module.points, module.moduleName)}
                                className="mt-6 self-end text-md"
                                icon={Award}
                                disabled={module.status === 'Done'} // Disable if already done
                            >
                                {module.status === 'Done' ? 'Completed' : 'Mark as Complete'}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Leaderboard Component
const Leaderboard = () => {
    const { db, isAuthReady, appId } = useContext(FirebaseContext);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!isAuthReady || !db) return;

        // Listen for real-time updates to all user profiles to build the leaderboard
        const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
        const unsubscribe = onSnapshot(usersCollectionRef, async (snapshot) => {
            setLoading(true);
            const users = [];
            for (const userDoc of snapshot.docs) {
                // Each userDoc represents a user's top-level folder, we need to get their profile 'data' document
                const profileDocRef = doc(db, `artifacts/${appId}/users/${userDoc.id}/profile`, 'data');
                try {
                    const profileSnap = await getDoc(profileDocRef);
                    if (profileSnap.exists()) {
                        const data = profileSnap.data();
                        users.push({
                            id: userDoc.id,
                            email: data.email || 'N/A', // Email might not be set for anonymous users
                            points: data.points || 0,
                            targetRole: data.targetRole || 'Not Set'
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user profile for leaderboard:", error);
                }
            }
            // Sort by points in descending order
            users.sort((a, b) => b.points - a.points);
            setLeaderboardData(users);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to leaderboard data:", error);
            setMessage("Error loading leaderboard.");
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener
    }, [db, isAuthReady, appId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 sm:p-6 md:p-8 font-inter text-gray-100">
            <div className="max-w-6xl mx-auto bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-4xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Global Leaderboard</h3>
                {loading ? (
                    <p className="text-gray-400 text-center text-lg py-4">Loading leaderboard...</p>
                ) : message ? (
                    <p className="text-red-500 text-center text-lg">{message}</p>
                ) : leaderboardData.length === 0 ? (
                    <p className="text-gray-400 text-center text-lg py-4">No users on the leaderboard yet.</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-inner"> {/* Table container styling */}
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-xl">Rank</th> {/* Rounded corners */}
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User ID</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Target Role</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-xl">Points</th> {/* Rounded corners */}
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {leaderboardData.map((user, index) => (
                                    <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700 hover:bg-gray-600 transition duration-150'}> {/* Hover effect */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 break-all">{user.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.targetRole}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-100 font-extrabold">{user.points}</td> {/* Larger, bolder points */}
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


// Assessment Component for Gen-AI driven quizzes
const Assessment = ({ setCurrentPage }) => { // Removed userProfile and onAssessmentComplete from props
    const { db, userId, appId, isAuthReady, geminiApiKey } = useContext(FirebaseContext); // Get all necessary context values, including geminiApiKey
    const [userProfile, setUserProfile] = useState(null); // State for userProfile within Assessment
    const [skillToAssess, setSkillToAssess] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true); // Set initial loading to true
    const [message, setMessage] = useState('');
    const [questionType, setQuestionType] = useState('mcq'); // 'mcq' or 'coding'
    const [userCode, setUserCode] = useState('');
    const [codeOutput, setCodeOutput] = useState('');
    const [testResults, setTestResults] = useState([]);

    // Fetch user profile when component mounts or auth state changes
    useEffect(() => {
        let unsubscribe;
        if (isAuthReady && userId && db) {
            setLoading(true);
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                } else {
                    setUserProfile(null); // Profile might not exist yet
                    setMessage("Please set up your profile first.");
                    setCurrentPage('profileSetup'); // Redirect if profile is missing
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user profile in Assessment:", error);
                setMessage("Error loading user profile for assessment.");
                setLoading(false);
            });
        } else if (isAuthReady && !userId) {
            setCurrentPage('auth'); // Redirect to auth if not signed in
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [userId, isAuthReady, db, appId, setCurrentPage]);


    // Helper to calculate skill gaps (reusing logic from SkillGapAnalysis)
    const calculateSkillGaps = (currentSkills, targetRole) => {
        if (!currentSkills || !targetRole || !roleBenchmarks[targetRole]) {
            return [];
        }
        const requiredSkills = roleBenchmarks[targetRole];
        const gaps = [];
        const userSkillsMap = new Map(currentSkills.map(skill => [skill.toLowerCase(), 5]));

        for (const skill in requiredSkills) {
            const requiredProficiency = requiredSkills[skill];
            const userProficiency = userSkillsMap.has(skill.toLowerCase()) ? 5 : 0;
            const gapPercentage = Math.max(0, ((requiredProficiency - userProficiency) / requiredProficiency) * 100);
            if (gapPercentage > 0) {
                gaps.push({ skill: skill, gap: gapPercentage });
            }
        }
        return gaps.sort((a, b) => b.gap - a.gap); // Sort by largest gap first
    };

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

        if (!userProfile) { // Added check for userProfile
            setMessage("User profile not loaded. Please ensure your profile is set up.");
            setLoading(false);
            return;
        }

        let promptText = "";
        let targetSkillForPrompt = skillToAssess;

        if (!skillToAssess && userProfile.skills && userProfile.targetRole) {
            const gaps = calculateSkillGaps(userProfile.skills, userProfile.targetRole);
            if (gaps.length > 0) {
                targetSkillForPrompt = gaps[0].skill; // Focus on the largest gap
                promptText = `Generate 40 ${difficulty} difficulty quiz questions about ${targetSkillForPrompt} to help fill a skill gap. Include a mix of multiple-choice and coding challenges.`;
            } else {
                promptText = `Generate 40 ${difficulty} difficulty quiz questions about general software development. Include a mix of multiple-choice and coding challenges.`;
            }
        } else if (skillToAssess) {
            promptText = `Generate 40 ${difficulty} difficulty quiz questions about ${skillToAssess}. Include a mix of multiple-choice and coding challenges.`;
        } else {
            setMessage("Please enter a skill to assess or ensure your profile is set up to identify skill gaps.");
            setLoading(false);
            return;
        }

        promptText += ` For multiple-choice, provide 4 options and the correct answer. For coding challenges, provide a starter code, the language (javascript or python), and at least 2 test cases with input (as a stringified array/value) and expected output (as a string). Also provide a 'solution' field for coding challenges containing the correct function implementation. Ensure the output is a JSON array of question objects.`;

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
                                options: { type: "ARRAY", items: { type: "STRING" } }, // Only for MCQ
                                correctAnswer: { type: "STRING" }, // For MCQ
                                starterCode: { type: "STRING" }, // Only for Coding
                                language: { type: "STRING" }, // Only for Coding
                                testCases: { // Only for Coding
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
                                solution: { type: "STRING" } // For coding evaluation
                            },
                            required: ["question", "type"]
                        }
                    }
                }
            };

            // Use the dedicated geminiApiKey here
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
                const jsonResponse = JSON.parse(result.candidates[0].content.parts[0].text);
                if (jsonResponse.length > 0) {
                    setQuizQuestions(jsonResponse);
                    setMessage("Quiz generated successfully with Gemini API!");
                    // Update workflow progress directly here
                    if (db && userId && appId) {
                        const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
                        await updateDoc(userRef, { workflowProgress: 'Assessment Completed' });
                    }
                } else {
                    setMessage("Gemini API returned no questions. Falling back to mock data.");
                    setQuizQuestions(generateMockQuestions(questionType, targetSkillForPrompt));
                }
            } else {
                setMessage("Unexpected response from Gemini API. Falling back to mock data.");
                setQuizQuestions(generateMockQuestions(questionType, targetSkillForPrompt));
            }
        } catch (error) {
            console.error("Error generating quiz with Gemini API:", error);
            setMessage(`Failed to generate quiz with Gemini API: ${error.message}. Falling back to mock data.`);
            setQuizQuestions(generateMockQuestions(questionType, targetSkillForPrompt));
        } finally {
            setLoading(false);
        }
    };

    // Mock data generator for fallback
    const generateMockQuestions = (type, skill) => {
        const mockQuestions = [];
        for (let i = 0; i < 40; i++) {
            if (type === 'mcq') {
                mockQuestions.push({
                    type: 'mcq',
                    question: `(Mock MCQ ${i + 1} for ${skill || 'General'}) What is the capital of France?`,
                    options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
                    correctAnswer: 'Paris'
                });
            } else { // Coding challenge mock
                mockQuestions.push({
                    type: 'coding',
                    question: `(Mock Coding ${i + 1} for ${skill || 'General'}) Write a JavaScript function 'addNumbers' that takes two numbers and returns their sum.`,
                    starterCode: `function addNumbers(a, b) {\n  // Your code here\n}`,
                    language: 'javascript',
                    testCases: [
                        { input: '[1,2]', expectedOutput: '3' },
                        { input: '[10,20]', expectedOutput: '30' }
                    ],
                    solution: `function addNumbers(a, b) { return a + b; }`
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

    const handleRunCode = () => {
        const currentQuestion = quizQuestions[currentQuestionIndex];
        if (currentQuestion.type !== 'coding') return;

        if (!userCode.trim()) {
            setCodeOutput("Please write some code before running tests.");
            setTestResults([]);
            return;
        }

        setCodeOutput('Simulating tests...');
        setTestResults([]);

        setTimeout(() => {
            let passedTests = 0;
            const results = [];

            currentQuestion.testCases.forEach((test) => {
                results.push({
                    testCase: `Input: ${test.input}, Expected: ${test.expectedOutput}`,
                    actualOutput: test.expectedOutput, // Simulate actual output matching expected
                    passed: true // Simulate test passing
                });
                passedTests++;
            });

            setCodeOutput(`Tests completed. Passed ${passedTests}/${currentQuestion.testCases.length} tests.`);
            setTestResults(results);
        }, 1500);
    };

    const handleSubmitQuiz = async () => { // Made async to await Firestore update
        setShowResults(true);
        // Update workflow progress directly here
        if (db && userId && appId) {
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            try {
                await updateDoc(userRef, { workflowProgress: 'Recommendations Generated' });
                setMessage("Quiz submitted! Workflow progress updated.");
            } catch (error) {
                console.error("Error updating workflow progress from Assessment:", error);
                setMessage("Error submitting quiz and updating workflow.");
            }
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
                // For coding, assume full points if all mock tests passed (based on simulated results)
                const currentQuestion = quizQuestions[index];
                const passedTestsCount = testResults.filter(r => r.passed).length;
                if (passedTestsCount === currentQuestion.testCases.length && userCode.trim()) { // Only score if code was written and tests simulated pass
                     score++;
                }
            }
        });
        return score;
    };

    const currentQuestion = quizQuestions[currentQuestionIndex];

    if (loading || !userProfile) { // Show loading until profile is fetched
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-400 text-2xl">
                Loading assessment...
                <MessageBox message={message} onConfirm={() => setMessage('')} />
            </div>
        );
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
                                                        <div key={resIndex} className={`p-3 rounded-lg flex items-center gap-2 ${res.passed ? 'bg-green-800/30 text-green-300' : 'bg-red-800/30 text-red-300'}`}>
                                                            {res.passed ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                            <span>{res.testCase}</span>
                                                            <span className="ml-auto">Output: {res.actualOutput}</span>
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


// Dashboard Component
const Dashboard = ({ setCurrentPage }) => {
    const { db, auth, userId, isAuthReady, appId } = useContext(FirebaseContext);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Set up real-time listener for user profile
        let unsubscribe;
        if (isAuthReady && userId && db) {
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                } else {
                    // If profile doesn't exist, prompt user to set it up
                    setUserProfile(null);
                    setMessage("Please set up your profile.");
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user profile:", error);
                setMessage("Error loading user profile.");
                setLoading(false);
            });
        } else if (isAuthReady && !userId) {
            // If auth is ready but no userId (e.g., failed anonymous sign-in), redirect to auth
            setCurrentPage('auth');
        }

        return () => {
            if (unsubscribe) unsubscribe(); // Cleanup listener
        };
    }, [userId, isAuthReady, db, appId, setCurrentPage]);

    const handleLogout = async () => {
        if (auth) {
            try {
                await signOut(auth);
                setCurrentPage('auth');
            } catch (error) {
                console.error("Error logging out:", error);
                setMessage("Error logging out.");
            }
        }
    };

    // Function to handle module completion and update points
    const handleCompleteModule = async (pointsAwarded, moduleName) => {
        if (!isAuthReady || !userId || !db || !userProfile) {
            setMessage("Cannot update points. Firebase not ready or profile missing.");
            return;
        }
        try {
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
            const newPoints = (userProfile.points || 0) + pointsAwarded;
            const updatedCompletedModules = [...(userProfile.completedModules || []), moduleName];

            await updateDoc(userRef, {
                points: newPoints,
                completedModules: updatedCompletedModules,
                workflowProgress: 'Learning In Progress'
            });
            setMessage(`Module "${moduleName}" completed! You earned ${pointsAwarded} points. Total points: ${newPoints}`);
        } catch (error) {
            console.error("Error updating points:", error);
            setMessage("Failed to update points.");
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-400 text-2xl">
                Loading dashboard...
            </div>
        );
    }

    // If no user profile, prompt to set it up
    if (!userProfile) {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 sm:p-6 md:p-8 font-inter text-gray-100">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 transform hover:scale-105 transition-transform duration-300">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6 sm:mb-0">
                        Welcome, {userProfile.email ? userProfile.email.split('@')[0] : 'Maverick User'}!
                    </h1>
                    <div className="flex flex-wrap justify-center sm:justify-end gap-4">
                        <Button onClick={() => setCurrentPage('profileSetup')} icon={Edit} className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-lg">Edit Profile</Button>
                        <Button onClick={() => setCurrentPage('leaderboard')} icon={Users} className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-lg">View Leaderboard</Button>
                        <Button onClick={() => setCurrentPage('assessment')} icon={Brain} className="bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-lg">Take Assessment</Button>
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
                            <p>Your Skills: <span className="font-bold text-green-300 text-xl">{userProfile.skills && userProfile.skills.length > 0 ? userProfile.skills.join(', ') : 'None listed'}</span></p>
                        </div>
                    </div>
                </div>

                {/* Skill Gap Analysis Section */}
                <SkillGapAnalysis userSkills={userProfile.skills || []} targetRole={userProfile.targetRole || ''} />

                {/* Learning Recommendations Section */}
                <LearningRecommendations
                    skillGaps={
                        userProfile.skills && userProfile.targetRole && roleBenchmarks[userProfile.targetRole]
                            ? Object.keys(roleBenchmarks[userProfile.targetRole]).map(skill => {
                                const requiredProficiency = roleBenchmarks[userProfile.targetRole][skill];
                                const userProficiency = userProfile.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase()) ? 5 : 0;
                                const gapPercentage = Math.max(0, ((requiredProficiency - userProficiency) / requiredProficiency) * 100);
                                return { skill, required: requiredProficiency, user: userProficiency, gap: gapPercentage };
                            })
                            : []
                    }
                    onCompleteModule={handleCompleteModule}
                    completedModules={userProfile.completedModules || []}
                />
                <MessageBox message={message} onConfirm={() => setMessage('')} />
            </div>
        </div>
    );
};

// Main App Component
function App() {
    const [currentPage, setCurrentPage] = useState('auth'); // Default to auth page

    const renderPage = () => {
        switch (currentPage) {
            case 'auth':
                return <Auth setCurrentPage={setCurrentPage} />;
            case 'profileSetup':
                return <ProfileSetup setCurrentPage={setCurrentPage} />;
            case 'dashboard':
                return <Dashboard setCurrentPage={setCurrentPage} />;
            case 'leaderboard':
                return <Leaderboard setCurrentPage={setCurrentPage} />;
            case 'assessment': // NEW CASE FOR ASSESSMENT PAGE
                return <Assessment setCurrentPage={setCurrentPage} />;
            default:
                return <Auth setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <FirebaseProvider>
            {/* The styling is purely via Tailwind classes. */}
            {/* IMPORTANT: Tailwind CSS CDN and Inter font MUST be included in public/index.html */}
            {/* IMPORTANT: Global styles for html, body, and #root MUST be in public/index.html */}
            <div className="font-inter antialiased">
                {renderPage()}
            </div>
        </FirebaseProvider>
    );
}

export default App;
