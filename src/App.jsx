import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, updateDoc, onSnapshot, collection, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Home, User, Target, Brain, Award, Users, LogOut, Edit, BarChart, BookOpen, MessageSquare, UploadCloud, XCircle, Settings, Search, BriefcaseBusiness, TrendingUp, Lightbulb, ClipboardList } from 'lucide-react';

// Import common UI components from the new file
import { Button, Input, Textarea, Select, MessageBox, LoadingPage, ProgressBar } from './components/common/UIComponents.jsx';

// Import useFirebase hook from its dedicated file (UPDATED PATH)
import { useFirebase } from './hooks/useFirebaseHook.jsx';


// --- Auth Page ---
// Handles user registration and login.
const Auth = ({ setCurrentPage, onAuthSuccessAndMessageDismissed }) => {
    const { auth, db, isAuthReady, userId, userRole, appId } = useFirebase();
    // Changed initial state to show role selection first, and treat it as a registration flow initially
    const [isRegistering, setIsRegistering] = useState(true); // Start as registering to show role selection
    const [showRoleSelection, setShowRoleSelection] = useState(true); // Show role selection by default
    const [selectedRegistrationRole, setSelectedRegistrationRole] = useState(null); // Stores chosen role for registration
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);

    useEffect(() => {
        console.log("Auth Component useEffect: isAuthReady:", isAuthReady, "userId:", userId, "userRole:", userRole);
        if (isAuthReady) {
            if (userId) {
                if (userRole === 'admin') {
                    console.log("Auth Component useEffect: User is admin, navigating to adminDashboard.");
                    setCurrentPage('adminDashboard');
                } else if (userRole === 'employee') {
                    console.log("Auth Component useEffect: User is employee, navigating to dashboard.");
                    setCurrentPage('dashboard');
                } else if (userRole === null) {
                    // This means user is authenticated but profile data (userType) is not yet set
                    console.log("Auth Component useEffect: User authenticated but role not set, navigating to profileSetup.");
                    setCurrentPage('profileSetup');
                }
            } else {
                console.log("Auth Component useEffect: No userId, staying on auth page.");
                // Ensure we are indeed on the auth page if no user is logged in
                setCurrentPage('auth');
            }
        }
    }, [isAuthReady, userId, userRole, setCurrentPage]);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setMessage('');
        setShowMessageBox(false);

        if (!auth) {
            setMessage('Firebase Auth not initialized.');
            setMessageType('error');
            setShowMessageBox(true);
            return;
        }

        try {
            if (isRegistering) {
                if (password !== confirmPassword) {
                    setMessage('Passwords do not match.');
                    setMessageType('error');
                    setShowMessageBox(true);
                    return;
                }
                // Use selectedRegistrationRole, default to 'employee' if somehow not set (shouldn't happen with new flow)
                const roleToAssign = selectedRegistrationRole || 'employee';

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("Auth Component: User registered:", user.uid, "with role:", roleToAssign);
                
                const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
                await setDoc(userDocRef, {
                    email: user.email,
                    createdAt: new Date(),
                    userType: roleToAssign, // Use the selected role
                    targetRole: '',
                    skills: [],
                    completedModules: [],
                    points: 0,
                    workflowProgress: 0
                });
                setMessage('Registration successful! Please complete your profile.');
                setMessageType('success');
                setShowMessageBox(true);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                // Navigation handled by the useEffect after auth state changes and role is fetched
            }
        } catch (error) {
            console.error("Auth error:", error);
            setMessage(`Authentication failed: ${error.message}`);
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    const handleMessageBoxConfirm = () => {
        setShowMessageBox(false);
        if (messageType === 'success' && isRegistering) {
            onAuthSuccessAndMessageDismissed(); // Call the callback after message dismissed
            setCurrentPage('profileSetup');
        }
        // For login, useEffect handles navigation after auth state changes
    };

    // Toggle between login and register modes
    const toggleRegistering = () => {
        setIsRegistering(prev => !prev);
        setShowRoleSelection(prev => !prev); // Toggle role selection visibility
        setSelectedRegistrationRole(null); // Reset selected role
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setMessage('');
        setShowMessageBox(false);
    };

    // Handle role selection for registration
    const handleRoleSelect = (role) => {
        setSelectedRegistrationRole(role);
        setIsRegistering(true); // Ensure isRegistering is true when a role is selected
        setShowRoleSelection(false); // Hide role selection and show email/password form
    };

    // This return is intentional for early exit during authentication status check.
    // ESLint might flag the code below this as "unreachable", but it is reachable
    // when the conditions for this 'if' statement are not met.
    if (!isAuthReady || (isAuthReady && userId && userRole)) {
        return <LoadingPage message="Checking authentication status..." />;
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
            {/* Left Section: Accelerate Your Professional Growth */}
            <div className="w-full md:w-1/2 bg-gray-900 p-8 rounded-xl shadow-2xl md:mr-4 mb-4 md:mb-0 flex flex-col justify-center items-center text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-blue-400 mb-6">
                    Accelerate Your Professional Growth
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-md">
                    Identify skill gaps, take personalized assessments, and follow curated learning paths designed for your career advancement.
                </p>
                <ul className="text-left text-gray-200 space-y-3">
                    <li className="flex items-center text-lg"><span className="mr-2 text-green-400">✔</span> In-depth Skill Gap Analysis</li>
                    <li className="flex items-center text-lg"><span className="mr-2 text-green-400">✔</span> AI-Powered Interactive Assessments</li>
                    <li className="flex items-center text-lg"><span className="mr-2 text-green-400">✔</span> Personalized Learning Paths</li>
                    <li className="flex items-center text-lg"><span className="mr-2 text-green-400">✔</span> Gamified Progress Tracking</li>
                </ul>
            </div>

            {/* Right Section: Auth Form */}
            <div className="w-full md:w-1/2 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 flex flex-col justify-center items-center">
                <h2 className="text-3xl font-bold text-white text-center mb-8">
                    {isRegistering && showRoleSelection ? 'Choose Your Role' : (isRegistering ? 'Register' : 'Login')}
                </h2>

                {isRegistering && showRoleSelection ? (
                    // Step 1: Role selection for registration
                    <div className="space-y-6 w-full max-w-sm">
                        <p className="text-gray-300 text-center text-lg mb-4">How would you like to register?</p>
                        <Button
                            onClick={() => handleRoleSelect('employee')}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            Register as Employee
                        </Button>
                        <Button
                            onClick={() => handleRoleSelect('admin')}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            Register as Admin
                        </Button>
                        <p className="text-center text-gray-400 mt-6">
                            Already have an account?
                            <button
                                onClick={toggleRegistering}
                                className="text-blue-400 hover:text-blue-300 font-medium ml-2 focus:outline-none"
                            >
                                Login here
                            </button>
                        </p>
                    </div>
                ) : (
                    // Step 2: Email/password form (for both login and after role selection for registration)
                    <form onSubmit={handleAuthAction} className="space-y-6 w-full max-w-sm">
                        <Input
                            id="email"
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@example.com"
                            required
                        />
                        <Input
                            id="password"
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        {isRegistering && (
                            <Input
                                id="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        )}
                        <Button type="submit" className="w-full">
                            {isRegistering ? `Register as ${selectedRegistrationRole || 'Employee'}` : 'Login'}
                        </Button>
                        <p className="text-center text-gray-400 mt-6">
                            {isRegistering ? 'Already have an account?' : 'Don\'t have an account?'}
                            <button
                                onClick={toggleRegistering}
                                className="text-blue-400 hover:text-blue-300 font-medium ml-2 focus:outline-none"
                            >
                                {isRegistering ? 'Login here' : 'Register here'}
                            </button>
                        </p>
                    </form>
                )}
            </div>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={handleMessageBoxConfirm}
                />
            )}
        </div>
    );
};

// --- Profile Setup Page ---
// Allows users to set up their profile information.
const ProfileSetup = ({ setCurrentPage }) => {
    const { userId, db, isAuthReady, geminiApiKey, appId } = useFirebase();
    const [userType, setUserType] = useState('employee');
    const [targetRole, setTargetRole] = useState('');
    const [skills, setSkills] = useState([{ name: '', level: 0 }]); // Skills now have a level 0-5
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [loading, setLoading] = useState(true);
    const [roleSuggestionPrompt, setRoleSuggestionPrompt] = useState('');
    const [suggestedRoles, setSuggestedRoles] = useState([]);
    const [isGeneratingRoles, setIsGeneratingRoles] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isAuthReady && userId) {
            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserType(data.userType || 'employee');
                    setTargetRole(data.targetRole || '');
                    // Ensure skills are in the new format, or default
                    setSkills(data.skills && data.skills.length > 0 ? data.skills : [{ name: '', level: 0 }]);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching profile:", error);
                setMessage('Failed to load profile data.');
                setMessageType('error');
                setShowMessageBox(true);
                setLoading(false);
            });
            return () => unsubscribe();
        } else if (isAuthReady && !userId) {
            setCurrentPage('auth'); // Redirect to auth if not logged in
        }
    }, [isAuthReady, userId, db, setCurrentPage, appId]);

    const handleSkillChange = (index, field, value) => {
        const newSkills = [...skills];
        newSkills[index][field] = field === 'level' ? parseInt(value) : value;
        setSkills(newSkills);
    };

    const addSkill = () => {
        setSkills([...skills, { name: '', level: 0 }]);
    };

    const removeSkill = (index) => {
        const newSkills = skills.filter((_, i) => i !== index);
        setSkills(newSkills);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setShowMessageBox(false);
        if (!userId || !db) {
            setMessage('User not authenticated or database not ready.');
            setMessageType('error');
            setShowMessageBox(true);
            return;
        }

        try {
            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
            // Changed from updateDoc to setDoc with merge: true to handle document creation if it doesn't exist
            await setDoc(userDocRef, {
                userType,
                targetRole,
                skills: skills.filter(s => s.name.trim() !== ''), // Only save skills with names
                updatedAt: new Date(),
                workflowProgress: 20 // Example: 20% progress for completing profile setup
            }, { merge: true }); // THIS IS THE KEY CHANGE
            setMessage('Profile updated successfully!');
            setMessageType('success');
            setShowMessageBox(true);
            setCurrentPage('dashboard'); // Redirect to dashboard after setup
        } catch (error) {
                console.error("Error updating profile:", error);
                setMessage(`Failed to update profile: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
            }
        };

    const handleGenerateRoleSuggestions = async () => {
        if (!roleSuggestionPrompt.trim()) {
            setMessage('Please enter some keywords or skills to get role suggestions.');
            setMessageType('error');
            setShowMessageBox(true);
            return;
        }

        setIsGeneratingRoles(true);
        setSuggestedRoles([]);
        setMessage('Generating role suggestions, please wait...');
        setMessageType('info');
        setShowMessageBox(true);

        const prompt = `Suggest 3-5 job roles based on the following skills/keywords: "${roleSuggestionPrompt}". For each role, list 3-5 key skills required for that role. Provide the response as a JSON array of objects, where each object has "roleName" (string) and "requiredSkills" (array of strings).`;

        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "roleName": { "type": "STRING" },
                            "requiredSkills": {
                                "type": "ARRAY",
                                "items": { "type": "STRING" }
                            }
                        },
                        "propertyOrdering": ["roleName", "requiredSkills"]
                    }
                }
            }
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

        let retries = 0;
        const maxRetries = 5;
        const baseDelay = 1000;

        while (retries < maxRetries) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.status === 429) {
                    const delay = baseDelay * Math.pow(2, retries);
                    console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise(res => setTimeout(res, delay));
                    retries++;
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const jsonString = result.candidates[0].content.parts[0].text;
                    const parsedJson = JSON.parse(jsonString);
                    setSuggestedRoles(parsedJson);
                    setMessage('Role suggestions generated successfully!');
                    setMessageType('success');
                    setShowMessageBox(true);
                } else {
                    setMessage('Failed to generate role suggestions: No valid response from API.');
                    setMessageType('error');
                    setShowMessageBox(true);
                }
                break;
            } catch (error) {
                console.error("Error generating role suggestions:", error);
                setMessage(`Failed to generate role suggestions: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
                break;
            } finally {
                setIsGeneratingRoles(false);
            }
        }
        if (retries === maxRetries) {
            setMessage('Failed to generate role suggestions after multiple retries due to rate limiting.');
            setMessageType('error');
            setShowMessageBox(true);
            setIsGeneratingRoles(false);
        }
    };

    const handleSelectSuggestedRole = (role) => {
        setTargetRole(role.roleName);
        // Merge required skills into current skills, avoid duplicates, default level 0
        const existingSkillNames = new Set(skills.map(s => s.name.toLowerCase()));
        const newSkillsToAdd = role.requiredSkills.filter(
            reqSkill => !existingSkillNames.has(reqSkill.toLowerCase())
        ).map(reqSkill => ({ name: reqSkill, level: 0 }));

        setSkills(prevSkills => [...prevSkills, ...newSkillsToAdd]);
        setSuggestedRoles([]); // Clear suggestions after selection
        setMessage(`Selected role: ${role.roleName}. Required skills added to your profile.`);
        setMessageType('info');
        setShowMessageBox(true);
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setMessage('Extracting skills from resume, please wait...');
            setMessageType('info');
            setShowMessageBox(true);
            try {
                // IMPORTANT: This is a placeholder for a backend call.
                // You need to implement a backend (e.g., Python Flask/FastAPI)
                // that can receive a PDF, extract text, and use an AI model
                // (like Gemini Vision or NLP) to identify skills.
                // Example backend endpoint: http://localhost:5000/extract-skills
                const backendUrl = 'http://localhost:5000/extract-skills'; // Replace with your backend URL
                const formData = new FormData();
                formData.append('resume', file);

                const response = await fetch(backendUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`Backend error: ${response.statusText}`);
                }

                const data = await response.json();
                if (data.skills && Array.isArray(data.skills)) {
                    const newSkillsToAdd = data.skills.map(skillName => ({ name: skillName, level: 0 }));
                    // Merge with existing skills, avoiding duplicates
                    const existingSkillNames = new Set(skills.map(s => s.name.toLowerCase()));
                    const uniqueNewSkills = newSkillsToAdd.filter(s => !existingSkillNames.has(s.name.toLowerCase()));
                    setSkills(prevSkills => [...prevSkills, ...uniqueNewSkills]);
                    setMessage('Skills extracted from resume successfully!');
                    setMessageType('success');
                    setShowMessageBox(true);
                } else {
                    setMessage('No skills found in resume or unexpected response format.');
                    setMessageType('warning');
                    setShowMessageBox(true);
                }
            } catch (error) {
                console.error("Error extracting skills from resume:", error);
                setMessage(`Failed to extract skills from resume: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
            }
        } else {
            setMessage('Please upload a PDF file.');
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    // This return is intentional for early exit during loading.
    if (loading) {
        return <LoadingPage message="Loading profile..." />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700">
                <h2 className="text-3xl font-bold text-white text-center mb-8">Set Up Your Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Select
                        id="userType"
                        label="I am a:"
                        value={userType}
                        onChange={(e) => setUserType(e.target.value)}
                        options={[
                            { value: 'employee', label: 'Employee' },
                            { value: 'admin', label: 'Admin' }
                        ]}
                    />
                    <Input
                        id="targetRole"
                        label="My Target Role/Job Title:"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g., Software Engineer, Marketing Specialist"
                        required
                    />

                    {/* AI Role Suggestion Section */}
                    <div className="space-y-4 bg-gray-700 p-4 rounded-lg border border-gray-600">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2"><Lightbulb size={20} /> AI Role Suggestions</h3>
                        <Textarea
                            id="roleSuggestionPrompt"
                            placeholder="Enter keywords or skills (e.g., 'Python, Machine Learning, Data Analysis') to get role suggestions."
                            value={roleSuggestionPrompt}
                            onChange={(e) => setRoleSuggestionPrompt(e.target.value)}
                            rows="2"
                        />
                        <Button
                            onClick={handleGenerateRoleSuggestions}
                            disabled={isGeneratingRoles}
                            icon={Brain}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isGeneratingRoles ? 'Generating...' : 'Get Role Suggestions'}
                        </Button>
                        {suggestedRoles.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <h4 className="text-lg font-medium text-gray-300">Suggested Roles:</h4>
                                {suggestedRoles.map((role, index) => (
                                    <div key={index} className="bg-gray-600 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white">{role.roleName}</p>
                                            <p className="text-sm text-gray-300">Skills: {role.requiredSkills.join(', ')}</p>
                                        </div>
                                        <Button onClick={() => handleSelectSuggestedRole(role)} className="bg-green-600 hover:bg-green-700 text-sm py-1 px-3">
                                            Select
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Resume Upload Section */}
                    <div className="space-y-4 bg-gray-700 p-4 rounded-lg border border-gray-600">
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2"><UploadCloud size={20} /> Extract Skills from Resume (PDF)</h3>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="block w-full text-sm text-gray-300
                                       file:mr-4 file:py-2 file:px-4
                                       file:rounded-full file:border-0
                                       file:text-sm file:font-semibold
                                       file:bg-blue-50 file:text-blue-700
                                       hover:file:bg-blue-100 cursor-pointer"
                        />
                        <p className="text-gray-400 text-sm">
                            *Requires a backend server to process the PDF and extract skills using AI.
                            (e.g., Python Flask/FastAPI with Gemini Vision/NLP)
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-gray-300 text-sm font-medium mb-2">Your Key Skillsets (Rate 0-5):</label>
                        {skills.map((skill, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 items-center">
                                <Input
                                    id={`skillName-${index}`}
                                    placeholder="Skill Name (e.g., JavaScript, Project Management)"
                                    value={skill.name}
                                    onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                                    className="flex-grow"
                                />
                                <Input
                                    id={`skillLevel-${index}`}
                                    type="number"
                                    label="Level"
                                    value={skill.level}
                                    onChange={(e) => handleSkillChange(index, 'level', e.target.value)}
                                    min="0"
                                    max="5"
                                    className="w-20 text-center"
                                />
                                <Button
                                    type="button"
                                    onClick={() => removeSkill(index)}
                                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button type="button" onClick={addSkill} className="bg-green-600 hover:bg-green-700 w-full">
                            Add Skill
                        </Button>
                    </div>
                    <Button type="submit" className="w-full">
                        Save Profile
                    </Button>
                </form>
            </div>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

// --- Dashboard Page (For Employees) ---
// Displays user-specific information, progress, and navigation options.
const Dashboard = ({ setCurrentPage }) => {
    const { userId, db, isAuthReady, userRole, auth, geminiApiKey, appId } = useFirebase();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [jobAnalysisResult, setJobAnalysisResult] = useState(null);
    const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);


    useEffect(() => {
        console.log("Dashboard Component useEffect: isAuthReady:", isAuthReady, "userId:", userId, "userRole:", userRole);
        if (isAuthReady && userId) {
            // Redirect if not an employee
            if (userRole && userRole !== 'employee') {
                console.log("Dashboard Component useEffect: Not employee, redirecting to:", userRole === 'admin' ? 'adminDashboard' : 'auth');
                setCurrentPage(userRole === 'admin' ? 'adminDashboard' : 'auth');
                return;
            }

            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                    console.log("Dashboard Component useEffect: Profile loaded.");
                } else {
                    // If profile doesn't exist, redirect to profile setup
                    console.log("Dashboard Component useEffect: Profile does not exist, redirecting to profileSetup.");
                    setCurrentPage('profileSetup');
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching profile:", error);
                setMessage('Failed to load profile data.');
                setMessageType('error');
                setShowMessageBox(true);
                setLoading(false);
            });
            return () => unsubscribe();
        } else if (isAuthReady && !userId) {
            console.log("Dashboard Component useEffect: Not authenticated, redirecting to auth.");
            setCurrentPage('auth'); // Redirect to auth if not logged in
        }
    }, [isAuthReady, userId, db, setCurrentPage, userRole, appId]);

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            console.log("Dashboard Component: User logged out.");
            setCurrentPage('auth'); // Explicitly navigate to auth page
        } catch (error) {
            console.error("Error logging out:", error);
            setMessage(`Logout failed: ${error.message}`);
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    const analyzeJobDescription = async () => {
        if (!jobDescription.trim()) {
            setMessage('Please paste a job description to analyze.');
            setMessageType('error');
            setShowMessageBox(true);
            return;
        }

        setIsAnalyzingJob(true);
        setJobAnalysisResult(null);
        setMessage('Analyzing job description and identifying skill gaps, please wait...');
        setMessageType('info');
        setShowMessageBox(true);

        const userSkills = profile.skills.map(s => `${s.name} (Level: ${s.level})`).join(', ');

        const prompt = `Analyze the following job description and provide:
        1. A brief summary of the job.
        2. A list of key required skills for this job.
        3. Compare these required skills with the user's current skills: "${userSkills}".
        4. Identify any skill gaps and suggest specific areas for improvement or learning modules.

        Format the response as a JSON object with the following structure:
        {
          "jobSummary": "string",
          "requiredSkills": ["skill1", "skill2"],
          "skillGaps": ["skill_gap1", "skill_gap2"],
          "improvementSuggestions": "string"
        }

        Job Description:
        ${jobDescription}`;

        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "jobSummary": { "type": "STRING" },
                        "requiredSkills": { "type": "ARRAY", "items": { "type": "STRING" } },
                        "skillGaps": { "type": "ARRAY", "items": { "type": "STRING" } },
                        "improvementSuggestions": { "type": "STRING" }
                    },
                    "propertyOrdering": ["jobSummary", "requiredSkills", "skillGaps", "improvementSuggestions"]
                }
            }
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

        let retries = 0;
        const maxRetries = 5;
        const baseDelay = 1000;

        while (retries < maxRetries) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.status === 429) {
                    const delay = baseDelay * Math.pow(2, retries);
                    console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise(res => setTimeout(res, delay));
                    retries++;
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const jsonString = result.candidates[0].content.parts[0].text;
                    const parsedJson = JSON.parse(jsonString);
                    setJobAnalysisResult(parsedJson);
                    setMessage('Job description analyzed successfully!');
                    setMessageType('success');
                    setShowMessageBox(true);
                } else {
                    setMessage('Failed to analyze job description: No valid response from API.');
                    setMessageType('error');
                    setShowMessageBox(true);
                }
                break;
            } catch (error) {
                console.error("Error analyzing job description:", error);
                setMessage(`Failed to analyze job description: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
                break;
            } finally {
                setIsAnalyzingJob(false);
            }
        }
        if (retries === maxRetries) {
            setMessage('Failed to analyze job description after multiple retries due to rate limiting.');
            setMessageType('error');
            setShowMessageBox(true);
            setIsAnalyzingJob(false);
        }
    };


    // This return is intentional for early exit during loading.
    if (loading) {
        return <LoadingPage message="Loading dashboard..." />;
    }

    // This return is intentional for early exit if profile data is not yet available after loading.
    if (!profile) {
        return <LoadingPage message="Profile not found, redirecting..." />;
    }

    const navItems = [
        { name: 'Home', icon: Home, page: 'dashboard' },
        { name: 'Profile', icon: User, page: 'profileSetup' },
        { name: 'Assessment', icon: Target, page: 'assessment' },
        { name: 'Learning Platform', icon: Brain, page: 'learningPlatform' },
        { name: 'Leaderboard', icon: Award, page: 'leaderboard' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-6 bg-gray-900 shadow-lg">
                <h1 className="text-3xl font-extrabold text-blue-400">Maverick</h1>
                <div className="flex items-center gap-4">
                    <span className="text-lg font-medium">Welcome, {profile.email || 'User'}!</span>
                    <Button onClick={handleLogout} icon={LogOut} className="bg-red-600 hover:bg-red-700">
                        Logout
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-grow p-6 gap-6">
                {/* Sidebar Navigation */}
                <nav className="w-64 bg-gray-800 rounded-xl shadow-xl p-6 flex flex-col gap-4">
                    {navItems.map((item) => (
                        <Button
                            key={item.name}
                            onClick={() => setCurrentPage(item.page)}
                            icon={item.icon}
                            className="justify-start w-full bg-gray-700 hover:bg-gray-600 text-left"
                        >
                            {item.name}
                        </Button>
                    ))}
                </nav>

                {/* Dashboard Content Area */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Profile Summary Card */}
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 col-span-1 md:col-span-2 lg:col-span-3">
                        <h3 className="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2"><User size={24} /> Your Profile Summary</h3>
                        <p className="text-lg mb-2">
                            <span className="font-semibold">Email:</span> {profile.email}
                        </p>
                        <p className="text-lg mb-2">
                            <span className="font-semibold">Target Role:</span> {profile.targetRole || 'Not set'}
                        </p>
                        <p className="text-lg mb-2">
                            <span className="font-semibold">Points:</span> {profile.points || 0}
                        </p>
                        <div className="mt-4">
                            <h4 className="text-xl font-semibold mb-2 text-gray-300">Skillsets:</h4>
                            {profile.skills && profile.skills.length > 0 ? (
                                <ul className="list-disc list-inside ml-4">
                                    {profile.skills.map((skill, index) => (
                                        <li key={index} className="text-gray-300">
                                            {skill.name} (<span className="font-medium text-blue-400">Level: {skill.level}</span>)
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400">No skills added yet. Go to Profile to add some!</p>
                            )}
                        </div>
                        <Button onClick={() => setCurrentPage('profileSetup')} icon={Edit} className="mt-6 bg-purple-600 hover:bg-purple-700">
                            Edit Profile
                        </Button>
                    </div>

                    {/* Workflow Progress Card */}
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
                        <h3 className="text-2xl font-bold mb-4 text-green-300 flex items-center gap-2"><BarChart size={24} /> Workflow Progress</h3>
                        <ProgressBar progress={profile.workflowProgress || 0} />
                        <p className="text-center text-gray-300 mt-2">{profile.workflowProgress || 0}% Complete</p>
                        <Button onClick={() => setCurrentPage('learningPlatform')} className="mt-4 w-full bg-green-600 hover:bg-green-700">
                            Continue Learning
                        </Button>
                    </div>

                    {/* Completed Modules Card */}
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
                        <h3 className="text-2xl font-bold mb-4 text-yellow-300 flex items-center gap-2"><BookOpen size={24} /> Completed Modules</h3>
                        {profile.completedModules && profile.completedModules.length > 0 ? (
                            <ul className="list-disc list-inside ml-4">
                                {profile.completedModules.map((module, index) => (
                                    <li key={index} className="text-gray-300">{module}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No modules completed yet.</p>
                        )}
                        <Button onClick={() => setCurrentPage('learningPlatform')} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700">
                            Explore Modules
                        </Button>
                    </div>

                    {/* Quick Access Card */}
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
                        <h3 className="text-2xl font-bold mb-4 text-red-300 flex items-center gap-2"><MessageSquare size={24} /> Quick Access</h3>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => setCurrentPage('assessment')} icon={Target} className="bg-indigo-600 hover:bg-indigo-700">
                                Take Assessment
                            </Button>
                            <Button onClick={() => setCurrentPage('leaderboard')} icon={Award} className="bg-teal-600 hover:bg-teal-700">
                                View Leaderboard
                            </Button>
                        </div>
                    </div>

                    {/* Job Matching & Skill Analysis Card */}
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 col-span-1 md:col-span-2 lg:col-span-3">
                        <h3 className="text-2xl font-bold mb-4 text-orange-300 flex items-center gap-2"><ClipboardList size={24} /> Job Matching & Skill Analysis</h3>
                        <Textarea
                            id="jobDescription"
                            label="Paste Job Description Here:"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="e.g., Senior Software Engineer, Data Scientist, Marketing Manager..."
                            rows="6"
                            className="mb-4"
                        />
                        <Button
                            onClick={analyzeJobDescription}
                            disabled={isAnalyzingJob}
                            icon={TrendingUp}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                            {isAnalyzingJob ? 'Analyzing...' : 'Analyze Job Description'}
                        </Button>

                        {jobAnalysisResult && (
                            <div className="mt-6 bg-gray-700 p-6 rounded-lg shadow-inner">
                                <h4 className="text-xl font-semibold text-white mb-3">Analysis Results:</h4>
                                <div className="space-y-4 text-gray-300">
                                    <div>
                                        <p className="font-semibold">Job Summary:</p>
                                        <p>{jobAnalysisResult.jobSummary}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Required Skills:</p>
                                        <ul className="list-disc list-inside ml-4">
                                            {jobAnalysisResult.requiredSkills.map((skill, idx) => (
                                                <li key={idx}>{skill}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold">Skill Gaps:</p>
                                        {jobAnalysisResult.skillGaps && jobAnalysisResult.skillGaps.length > 0 ? (
                                            <ul className="list-disc list-inside ml-4 text-red-300">
                                                {jobAnalysisResult.skillGaps.map((gap, idx) => (
                                                    <li key={idx}>{gap}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-green-300">No significant skill gaps identified! Great match!</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">Improvement Suggestions:</p>
                                        <div className="prose prose-invert max-w-none text-gray-300">
                                            <div dangerouslySetInnerHTML={{ __html: jobAnalysisResult.improvementSuggestions.replace(/\n/g, '<br />') }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

// --- Admin Dashboard Page ---
// Displays employee data, allows role changes, and manages content.
const AdminDashboard = ({ setCurrentPage }) => {
    const { userId, db, isAuthReady, userRole, auth, appId } = useFirebase();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true); // Keep loading state here
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);
    // Removed RadarChart from here, so selectedEmployeeDetails will not display it.
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
    const [learningModules, setLearningModules] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [activeSection, setActiveSection] = useState('overview'); // Default active section


    // Wrapped in useCallback to stabilize the function for renderSectionContent
    const handleRoleChange = useCallback(async (employeeId, newRole) => {
        if (!db) return;
        setShowMessageBox(false);
        try {
            const userDocRef = doc(db, `artifacts/${appId}/users/${employeeId}/profile/data`);
            await updateDoc(userDocRef, { userType: newRole });
            setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, userType: newRole } : emp));
            setMessage(`Role for employee ${employeeId} updated to ${newRole}.`);
            setMessageType('success');
            setShowMessageBox(true);
        } catch (error) {
            console.error("Error changing role:", error);
            setMessage(`Failed to change role: ${error.message}`);
            setMessageType('error');
            setShowMessageBox(true);
        }
    }, [db, appId, setEmployees, setMessage, setMessageType, setShowMessageBox]);

    // Wrapped in useCallback
    const handleContentUpdate = useCallback(async (type, id, newData) => {
        if (!db) return;
        setShowMessageBox(false);
        try {
            const collectionPath = `artifacts/${appId}/public/data/${type}`;
            const docRef = doc(db, collectionPath, id);
            await updateDoc(docRef, newData);
            setMessage(`${type.slice(0, -1)} updated successfully!`);
            setMessageType('success');
            setShowMessageBox(true);
            // Refresh data
            if (type === 'learningModules') {
                const modulesSnap = await getDocs(collection(db, collectionPath));
                setLearningModules(modulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else if (type === 'assessments') {
                const assessmentsSnap = await getDocs(collection(db, collectionPath));
                setAssessments(assessmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else if (type === 'jobs') {
                const jobsSnap = await getDocs(collection(db, collectionPath));
                setJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        } catch (error) {
            console.error(`Error updating ${type.slice(0, -1)}:`, error);
            setMessage(`Failed to update ${type.slice(0, -1)}: ${error.message}`);
            setMessageType('error');
            setShowMessageBox(true);
        }
    }, [db, appId, setLearningModules, setAssessments, setJobs, setMessage, setMessageType, setShowMessageBox]);

    // Wrapped in useCallback
    const handleContentAdd = useCallback(async (type, newData) => {
        if (!db) return;
        setShowMessageBox(false);
        try {
            const collectionPath = `artifacts/${appId}/public/data/${type}`;
            await setDoc(doc(collection(db, collectionPath)), newData); // Add with auto-generated ID
            setMessage(`${type.slice(0, -1)} added successfully!`);
            setMessageType('success');
            setShowMessageBox(true);
            // Refresh data
            if (type === 'learningModules') {
                const modulesSnap = await getDocs(collection(db, collectionPath));
                setLearningModules(modulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else if (type === 'assessments') {
                const assessmentsSnap = await getDocs(collection(db, collectionPath));
                setAssessments(assessmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else if (type === 'jobs') {
                const jobsSnap = await getDocs(collection(db, collectionPath));
                setJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        } catch (error) {
            console.error(`Error adding ${type.slice(0, -1)}:`, error);
            setMessage(`Failed to add ${type.slice(0, -1)}: ${error.message}`);
            setMessageType('error');
            setShowMessageBox(true);
        }
    }, [db, appId, setLearningModules, setAssessments, setJobs, setMessage, setMessageType, setShowMessageBox]);

    // Wrapped in useCallback
    const handleContentDelete = useCallback(async (type, id) => {
        if (!db) return;
        setShowMessageBox(false);
        try {
            const collectionPath = `artifacts/${appId}/public/data/${type}`;
            await deleteDoc(doc(db, collectionPath, id));
            setMessage(`${type.slice(0, -1)} deleted successfully!`);
            setMessageType('success');
            setShowMessageBox(true);
            // Refresh data
            if (type === 'learningModules') {
                setLearningModules(prev => prev.filter(item => item.id !== id));
            } else if (type === 'assessments') {
                setAssessments(prev => prev.filter(item => item.id !== id));
            } else if (type === 'jobs') {
                setJobs(prev => prev.filter(item => item.id !== id));
            }
        } catch (error) {
                console.error(`Error deleting ${type.slice(0, -1)}:`, error);
                setMessage(`Failed to delete ${type.slice(0, -1)}: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
            }
        }, [db, appId, setLearningModules, setAssessments, setJobs, setMessage, setMessageType, setShowMessageBox]);


    // Moved renderSectionContent useCallback definition to the top level
    const renderSectionContent = useCallback(() => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 col-span-full">
                        <h3 className="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2"><Home size={24} /> Admin Overview</h3>
                        <p className="text-gray-300 mb-4">Welcome to the Admin Dashboard. Here you can manage employees, learning content, assessments, and job postings.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-white">Total Employees</h4>
                                <span className="text-3xl font-bold text-blue-400">{employees.length}</span>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-white">Learning Modules</h4>
                                <span className="text-3xl font-bold text-green-400">{learningModules.length}</span>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-white">Assessments</h4>
                                <span className="text-3xl font-bold text-yellow-400">{assessments.length}</span>
                            </div>
                            <div className="bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-white">Job Postings</h4>
                                <span className="text-3xl font-bold text-purple-400">{jobs.length}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'employees':
                return (
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 col-span-full">
                        <h3 className="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2"><Users size={24} /> Employee Management</h3>
                        <div className="mb-6">
                            <Input
                                id="employeeSearch"
                                placeholder="Search employees by email, role, or skill..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={Search}
                                className="w-full"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-gray-300 font-semibold">Email</th>
                                        <th className="py-3 px-4 text-left text-gray-300 font-semibold">Target Role</th>
                                        <th className="py-3 px-4 text-left text-gray-300 font-semibold">Points</th>
                                        <th className="py-3 px-4 text-left text-gray-300 font-semibold">Progress</th>
                                        <th className="py-3 px-4 text-left text-gray-300 font-semibold">Role</th>
                                        <th className="py-3 px-4 text-left text-gray-300 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((employee) => (
                                        <tr key={employee.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700">
                                            <td className="py-3 px-4 text-blue-400 cursor-pointer hover:underline"
                                                onClick={() => setSelectedEmployeeDetails(employee)}>
                                                {employee.email}
                                            </td>
                                            <td className="py-3 px-4">{employee.targetRole || 'N/A'}</td>
                                            <td className="py-3 px-4">{employee.points || 0}</td>
                                            <td className="py-3 px-4">{employee.workflowProgress || 0}%</td>
                                            <td className="py-3 px-4">
                                                <Select
                                                    value={employee.userType}
                                                    onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                                                    options={[
                                                        { value: 'employee', label: 'Employee' },
                                                        { value: 'admin', label: 'Admin' }
                                                    ]}
                                                    className="text-sm py-1"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {selectedEmployeeDetails && (
                            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                                <div className="bg-gray-800 rounded-xl p-8 shadow-2xl w-full max-w-2xl border border-gray-700 relative">
                                    <h3 className="text-2xl font-bold text-white mb-4">Employee Details: {selectedEmployeeDetails.email}</h3>
                                    <p className="text-lg text-gray-300 mb-2"><span className="font-semibold">Target Role:</span> {selectedEmployeeDetails.targetRole || 'Not set'}</p>
                                    <p className="text-lg text-gray-300 mb-2"><span className="font-semibold">Points:</span> {selectedEmployeeDetails.points || 0}</p>
                                    <p className="text-lg text-gray-300 mb-4"><span className="font-semibold">Workflow Progress:</span> {selectedEmployeeDetails.workflowProgress || 0}%</p>

                                    {/* RadarChart removed as per request */}
                                    {selectedEmployeeDetails.skills && selectedEmployeeDetails.skills.length > 0 && (
                                        <>
                                            <h4 className="text-xl font-semibold text-gray-300 mb-3">Skill Levels:</h4>
                                            <ul className="list-disc list-inside ml-4 text-gray-300 mb-6">
                                                {selectedEmployeeDetails.skills.map((skill, idx) => (
                                                    <li key={idx}>{skill.name}: Level {skill.level}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    {selectedEmployeeDetails.skills.length === 0 && (
                                        <p className="text-gray-400 mb-4">No skills recorded for this employee.</p>
                                    )}

                                    <h4 className="text-xl font-semibold text-gray-300 mb-3">Completed Modules:</h4>
                                    {selectedEmployeeDetails.completedModules && selectedEmployeeDetails.completedModules.length > 0 ? (
                                        <ul className="list-disc list-inside ml-4 text-gray-300 mb-6">
                                            {selectedEmployeeDetails.completedModules.map((module, idx) => (
                                                <li key={idx}>{module}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-400 mb-6">No modules completed by this employee.</p>
                                    )}

                                    <Button onClick={() => setSelectedEmployeeDetails(null)} className="bg-blue-600 hover:bg-blue-700 w-full">
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'learning':
                return (
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 col-span-full">
                        <h3 className="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2"><Brain size={24} /> Manage Learning Modules</h3>
                        <AddModuleForm onAdd={handleContentAdd} />
                        <div className="mt-6 space-y-4">
                            {learningModules.length > 0 ? (
                                learningModules.map(module => (
                                    <ModuleItem
                                        key={module.id}
                                        module={module}
                                        onUpdate={handleContentUpdate}
                                        onDelete={handleContentDelete}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-400">No learning modules available. Add one above!</p>
                            )}
                        </div>
                    </div>
                );
            case 'assessments':
                return (
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 col-span-full">
                        <h3 className="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2"><Target size={24} /> Manage Assessments</h3>
                        <AddAssessmentForm onAdd={handleContentAdd} />
                        <div className="mt-6 space-y-4">
                            {assessments.length > 0 ? (
                                assessments.map(assessment => (
                                    <AssessmentItem
                                        key={assessment.id}
                                        assessment={assessment}
                                        onUpdate={handleContentUpdate}
                                        onDelete={handleContentDelete}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-400">No assessments available. Add one above!</p>
                            )}
                        </div>
                    </div>
                );
            case 'jobs':
                return (
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 col-span-full">
                        <h3 className="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2"><BriefcaseBusiness size={24} /> Manage Job Postings</h3>
                        <AddJobForm onAdd={handleContentAdd} />
                        <div className="mt-6 space-y-4">
                            {jobs.length > 0 ? (
                                jobs.map(job => (
                                    <JobItem
                                        key={job.id}
                                        job={job}
                                        onUpdate={handleContentUpdate}
                                        onDelete={handleContentDelete}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-400">No job postings available. Add one above!</p>
                            )}
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 col-span-full">
                        <h3 className="text-2xl font-bold mb-4 text-blue-300 flex items-center gap-2"><Settings size={24} /> Settings</h3>
                        <p className="text-gray-400">Admin settings and configurations will go here.</p>
                        {/* Add actual settings components here */}
                    </div>
                );
            default:
                return null;
        }
    }, [activeSection, employees, learningModules, assessments, jobs, handleRoleChange, handleContentAdd, handleContentUpdate, handleContentDelete, searchTerm, filteredEmployees, selectedEmployeeDetails]);


    // Fetch all employees and content
    useEffect(() => {
        console.log("AdminDashboard Component useEffect: isAuthReady:", isAuthReady, "userId:", userId, "userRole:", userRole);
        if (isAuthReady && userId) {
            // Redirect if not an admin
            if (userRole && userRole !== 'admin') {
                console.log("AdminDashboard Component useEffect: Not admin, redirecting to:", userRole === 'employee' ? 'dashboard' : 'auth');
                setCurrentPage(userRole === 'employee' ? 'dashboard' : 'auth');
                return;
            }

            const fetchAdminData = async () => {
                setLoading(true); // Set loading to true at the start of data fetching
                try {
                    // Fetch all user profiles
                    const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
                    const querySnapshot = await getDocs(usersCollectionRef);
                    const employeeList = [];

                    for (const userDoc of querySnapshot.docs) {
                        const profileDocRef = doc(db, `artifacts/${appId}/users/${userDoc.id}/profile/data`);
                        const profileSnap = await getDoc(profileDocRef);
                        if (profileSnap.exists() && profileSnap.data().userType === 'employee') {
                            employeeList.push({ id: userDoc.id, ...profileSnap.data() });
                        }
                    }
                    setEmployees(employeeList);
                    setFilteredEmployees(employeeList); // Initialize filtered list
                    console.log("AdminDashboard Component useEffect: Employees loaded.");

                    // Fetch learning modules
                    const modulesRef = collection(db, `artifacts/${appId}/public/data/learningModules`);
                    const modulesSnap = await getDocs(modulesRef);
                    setLearningModules(modulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    console.log("AdminDashboard Component useEffect: Learning modules loaded.");

                    // Fetch assessments
                    const assessmentsRef = collection(db, `artifacts/${appId}/public/data/assessments`);
                    const assessmentsSnap = await getDocs(assessmentsRef);
                    setAssessments(assessmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    console.log("AdminDashboard Component useEffect: Assessments loaded.");

                    // Fetch jobs
                    const jobsRef = collection(db, `artifacts/${appId}/public/data/jobs`);
                    const jobsSnap = await getDocs(jobsRef);
                    setJobs(jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    console.log("AdminDashboard Component useEffect: Jobs loaded.");

                } catch (error) {
                    console.error("Error fetching admin data:", error);
                    setMessage(`Failed to load admin data: ${error.message}`);
                    setMessageType('error');
                    setShowMessageBox(true);
                } finally {
                    setLoading(false); // Set loading to false after data fetching (success or failure)
                }
            };

            fetchAdminData();
        } else if (isAuthReady && !userId) {
            console.log("AdminDashboard Component useEffect: Not authenticated, redirecting to auth.");
            setCurrentPage('auth'); // Redirect to auth if not logged in
        }
    }, [isAuthReady, userId, db, setCurrentPage, userRole, appId]);

    // Filter employees based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredEmployees(employees);
            return;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const results = employees.filter(employee =>
            employee.email.toLowerCase().includes(lowerCaseSearchTerm) ||
            (employee.targetRole && employee.targetRole.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (employee.skills && employee.skills.some(skill => skill.name.toLowerCase().includes(lowerCaseSearchTerm)))
        );
        setFilteredEmployees(results);
    }, [searchTerm, employees]);

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            console.log("AdminDashboard Component: User logged out.");
            setCurrentPage('auth'); // Explicitly navigate to auth page
        } catch (error) {
            console.error("Error logging out:", error);
            setMessage(`Logout failed: ${error.message}`);
            setMessageType('error');
            setShowMessageBox(true);
        }
    };


    const navItems = [
        { name: 'Dashboard', icon: Home, section: 'overview' },
        { name: 'Manage Employees', icon: Users, section: 'employees' },
        { name: 'Manage Learning', icon: Brain, section: 'learning' },
        { name: 'Manage Assessments', icon: Target, section: 'assessments' },
        { name: 'Manage Jobs', icon: BriefcaseBusiness, section: 'jobs' },
        { name: 'Settings', icon: Settings, section: 'settings' }, // Placeholder for settings
    ];


    // This return is intentional for early exit during loading.
    if (loading) {
        return <LoadingPage message="Loading admin dashboard..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-6 bg-gray-900 shadow-lg">
                <h1 className="text-3xl font-extrabold text-blue-400">Maverick Admin</h1>
                <div className="flex items-center gap-4">
                    <span className="text-lg font-medium">Admin Panel</span>
                    <Button onClick={handleLogout} icon={LogOut} className="bg-red-600 hover:bg-red-700">
                        Logout
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-grow p-6 gap-6">
                {/* Sidebar Navigation */}
                <nav className="w-64 bg-gray-800 rounded-xl shadow-xl p-6 flex flex-col gap-4">
                    {navItems.map((item) => (
                        <Button
                            key={item.name}
                            onClick={() => item.page ? setCurrentPage(item.page) : setActiveSection(item.section)}
                            icon={item.icon}
                            className={`justify-start w-full text-left ${activeSection === item.section ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {item.name}
                        </Button>
                    ))}
                </nav>

                {/* Admin Content Area */}
                <div className="flex-grow grid grid-cols-1 gap-6">
                    {renderSectionContent()}
                </div>
            </main>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

// Component for adding a new learning module
const AddModuleForm = ({ onAdd }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title && description && content) {
            onAdd('learningModules', { title, description, content, createdAt: new Date() });
            setTitle('');
            setDescription('');
            setContent('');
        } else {
            setMessage('Please fill all fields for the new module.');
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-lg shadow-inner space-y-4">
            <h5 className="text-lg font-semibold text-white">Add New Module</h5>
            <Input
                id="newModuleTitle"
                placeholder="Module Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <Textarea
                id="newModuleDescription"
                placeholder="Module Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
            />
            <Textarea
                id="newModuleContent"
                placeholder="Module Content (Markdown or HTML)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Add Module</Button>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </form>
    );
};

// Component for displaying and editing a single learning module
const ModuleItem = ({ module, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(module.title);
    const [editedDescription, setEditedDescription] = useState(module.description);
    const [editedContent, setEditedContent] = useState(module.content);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);

    const handleSave = () => {
        if (editedTitle && editedDescription && editedContent) {
            onUpdate('learningModules', module.id, {
                title: editedTitle,
                description: editedDescription,
                content: editedContent,
                updatedAt: new Date()
            });
            setIsEditing(false);
        } else {
            setMessage('Please fill all fields for the module.');
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    return (
        <div className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
            {isEditing ? (
                <div className="space-y-3">
                    <Input
                        id={`editModuleTitle-${module.id}`}
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                    />
                    <Textarea
                        id={`editModuleDescription-${module.id}`}
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                    />
                    <Textarea
                        id={`editModuleContent-${module.id}`}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 flex-grow">Save</Button>
                        <Button onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 flex-grow">Cancel</Button>
                    </div>
                </div>
            ) : (
                <div>
                    <h5 className="text-xl font-semibold text-white">{module.title}</h5>
                    <p className="text-gray-300 text-sm mb-2">{module.description}</p>
                    <p className="text-gray-400 text-xs">ID: {module.id}</p>
                    <div className="flex gap-2 mt-3">
                        <Button onClick={() => setIsEditing(true)} icon={Edit} className="bg-blue-600 hover:bg-blue-700">Edit</Button>
                        <Button onClick={() => onDelete('learningModules', module.id)} icon={XCircle} className="bg-red-600 hover:bg-red-700">Delete</Button>
                    </div>
                </div>
            )}
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

// Component for adding a new assessment
const AddAssessmentForm = ({ onAdd }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([{ questionText: '', options: ['', '', '', ''], correctAnswer: 0, skillImpact: '' }]); // Added skillImpact
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);

    const handleQuestionChange = (qIndex, field, value) => {
        const newQuestions = [...questions];
        if (field.startsWith('option')) {
            const optIndex = parseInt(field.split('-')[1]);
            newQuestions[qIndex].options[optIndex] = value;
        } else {
            newQuestions[qIndex][field] = value;
        }
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0, skillImpact: '' }]);
    };

    const removeQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title && description && questions.length > 0 && questions.every(q => q.skillImpact.trim() !== '')) {
            onAdd('assessments', { title, description, questions, createdAt: new Date() });
            setTitle('');
            setDescription('');
            setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: 0, skillImpact: '' }]);
        } else {
            // Using MessageBox instead of alert
            setMessage('Please fill all fields including skill impact for each question.');
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-lg shadow-inner space-y-4">
            <h5 className="text-lg font-semibold text-white">Add New Assessment</h5>
            <Input
                id="newAssessmentTitle"
                placeholder="Assessment Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <Textarea
                id="newAssessmentDescription"
                placeholder="Assessment Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
            />
            <h6 className="text-md font-semibold text-white mt-4">Questions:</h6>
            {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-gray-800 p-3 rounded-md space-y-3 border border-gray-700">
                    <Textarea
                        id={`questionText-${qIndex}`}
                        placeholder={`Question ${qIndex + 1} Text`}
                        value={q.questionText}
                        onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                        required
                    />
                    <div className="grid grid-cols-2 gap-2">
                        {q.options.map((option, optIndex) => (
                            <Input
                                key={optIndex}
                                id={`option-${qIndex}-${optIndex}`}
                                placeholder={`Option ${optIndex + 1}`}
                                value={option}
                                onChange={(e) => handleQuestionChange(qIndex, `option-${optIndex}`, e.target.value)}
                                required
                            />
                        ))}
                    </div>
                    <Select
                        id={`correctAnswer-${qIndex}`}
                        label="Correct Answer (Option Index)"
                        value={q.correctAnswer}
                        onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(e.target.value))}
                        options={[
                            { value: 0, label: 'Option 1' },
                            { value: 1, label: 'Option 2' },
                            { value: 2, label: 'Option 3' },
                            { value: 3, label: 'Option 4' }
                        ]}
                    />
                    <Input
                        id={`skillImpact-${qIndex}`}
                        label="Skill Impact (e.g., 'JavaScript' or 'Problem Solving')"
                        placeholder="Skill this question assesses"
                        value={q.skillImpact}
                        onChange={(e) => handleQuestionChange(qIndex, 'skillImpact', e.target.value)}
                        required
                    />
                    <Button type="button" onClick={() => removeQuestion(qIndex)} className="bg-red-600 hover:bg-red-700 w-full">Remove Question</Button>
                </div>
            ))}
            <Button type="button" onClick={addQuestion} className="bg-green-600 hover:bg-green-700 w-full">Add Question</Button>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-4">Add Assessment</Button>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </form>
    );
};

// Component for displaying and editing a single assessment
const AssessmentItem = ({ assessment, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(assessment.title);
    const [editedDescription, setEditedDescription] = useState(assessment.description);
    const [editedQuestions, setEditedQuestions] = useState(assessment.questions);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);

    const handleQuestionChange = (qIndex, field, value) => {
        const newQuestions = [...editedQuestions];
        if (field.startsWith('option')) {
            const optIndex = parseInt(field.split('-')[1]);
            newQuestions[qIndex].options[optIndex] = value;
        } else {
            newQuestions[qIndex][field] = value;
        }
        setEditedQuestions(newQuestions);
    };

    const addQuestion = () => {
        setEditedQuestions([...editedQuestions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0, skillImpact: '' }]);
    };

    const removeQuestion = (index) => {
        const newQuestions = editedQuestions.filter((_, i) => i !== index);
        setEditedQuestions(newQuestions);
    };

    const handleSave = () => {
        if (editedTitle && editedDescription && editedQuestions.every(q => q.skillImpact.trim() !== '')) {
            onUpdate('assessments', assessment.id, {
                title: editedTitle,
                description: editedDescription,
                questions: editedQuestions,
                updatedAt: new Date()
            });
            setIsEditing(false);
        } else {
            // Using MessageBox instead of alert
            setMessage('Please fill all fields including skill impact for each question.');
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    return (
        <div className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
            {isEditing ? (
                <div className="space-y-3">
                    <Input
                        id={`editAssessmentTitle-${assessment.id}`}
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                    />
                    <Textarea
                        id={`editAssessmentDescription-${assessment.id}`}
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                    />
                    <h6 className="text-md font-semibold text-white mt-4">Questions:</h6>
                    {editedQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-gray-800 p-3 rounded-md space-y-3 border border-gray-700">
                            <Textarea
                                id={`editQuestionText-${assessment.id}-${qIndex}`}
                                placeholder={`Question ${qIndex + 1} Text`}
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                {q.options.map((option, optIndex) => (
                                    <Input
                                        key={optIndex}
                                        id={`editOption-${assessment.id}-${qIndex}-${optIndex}`}
                                        placeholder={`Option ${optIndex + 1}`}
                                        value={option}
                                        onChange={(e) => handleQuestionChange(qIndex, `option-${optIndex}`, e.target.value)}
                                    />
                                ))}
                            </div>
                            <Select
                                id={`editCorrectAnswer-${assessment.id}-${qIndex}`}
                                label="Correct Answer (Option Index)"
                                value={q.correctAnswer}
                                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(e.target.value))}
                                options={[
                                    { value: 0, label: 'Option 1' },
                                    { value: 1, label: 'Option 2' },
                                    { value: 2, label: 'Option 3' },
                                    { value: 3, label: 'Option 4' }
                                ]}
                            />
                            <Input
                                id={`editSkillImpact-${assessment.id}-${qIndex}`}
                                label="Skill Impact (e.g., 'JavaScript' or 'Problem Solving')"
                                placeholder="Skill this question assesses"
                                value={q.skillImpact}
                                onChange={(e) => handleQuestionChange(qIndex, 'skillImpact', e.target.value)}
                                required
                            />
                            <Button type="button" onClick={() => removeQuestion(qIndex)} className="bg-red-600 hover:bg-red-700 w-full">Remove Question</Button>
                        </div>
                    ))}
                    <Button type="button" onClick={addQuestion} className="bg-green-600 hover:bg-green-700 w-full">Add Question</Button>
                    <div className="flex gap-2 mt-3">
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 flex-grow">Save</Button>
                        <Button onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 flex-grow">Cancel</Button>
                    </div>
                </div>
            ) : (
                <div>
                    <h5 className="text-xl font-semibold text-white">{assessment.title}</h5>
                    <p className="text-gray-300 text-sm mb-2">{assessment.description}</p>
                    <p className="text-gray-400 text-xs">ID: {assessment.id}</p>
                    <p className="text-gray-400 text-xs">Questions: {assessment.questions.length}</p>
                    <div className="flex gap-2 mt-3">
                        <Button onClick={() => setIsEditing(true)} icon={Edit} className="bg-blue-600 hover:bg-blue-700">Edit</Button>
                        <Button onClick={() => onDelete('assessments', assessment.id)} icon={XCircle} className="bg-red-600 hover:bg-red-700">Delete</Button>
                    </div>
                </div>
            )}
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

// Component for adding a new job posting
const AddJobForm = ({ onAdd }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState('');
    const [location, setLocation] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title && description && requirements && location) {
            onAdd('jobs', { title, description, requirements, location, createdAt: new Date() });
            setTitle('');
            setDescription('');
            setRequirements('');
            setLocation('');
        } else {
            setMessage('Please fill all fields for the new job posting.');
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-lg shadow-inner space-y-4">
            <h5 className="text-lg font-semibold text-white">Add New Job Posting</h5>
            <Input
                id="newJobTitle"
                placeholder="Job Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <Textarea
                id="newJobDescription"
                placeholder="Job Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
            />
            <Textarea
                id="newJobRequirements"
                placeholder="Requirements (comma-separated or bullet points)"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                required
            />
            <Input
                id="newJobLocation"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Add Job</Button>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </form>
    );
};

// Component for displaying and editing a single job posting
const JobItem = ({ job, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(job.title);
    const [editedDescription, setEditedDescription] = useState(job.description);
    const [editedRequirements, setEditedRequirements] = useState(job.requirements);
    const [editedLocation, setEditedLocation] = useState(job.location);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);

    const handleSave = () => {
        if (editedTitle && editedDescription && editedRequirements && editedLocation) {
            onUpdate('jobs', job.id, {
                title: editedTitle,
                description: editedDescription,
                requirements: editedRequirements,
                location: editedLocation,
                updatedAt: new Date()
            });
            setIsEditing(false);
        } else {
            setMessage('Please fill all fields for the job posting.');
            setMessageType('error');
            setShowMessageBox(true);
        }
    };

    return (
        <div className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
            {isEditing ? (
                <div className="space-y-3">
                    <Input
                        id={`editJobTitle-${job.id}`}
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                    />
                    <Textarea
                        id={`editJobDescription-${job.id}`}
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                    />
                    <Textarea
                        id={`editJobRequirements-${job.id}`}
                        value={editedRequirements}
                        onChange={(e) => setEditedRequirements(e.target.value)}
                    />
                    <Input
                        id={`editJobLocation-${job.id}`}
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 flex-grow">Save</Button>
                        <Button onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 flex-grow">Cancel</Button>
                    </div>
                </div>
            ) : (
                <div>
                    <h5 className="text-xl font-semibold text-white">{job.title}</h5>
                    <p className="text-gray-300 text-sm mb-2">{job.description}</p>
                    <p className="text-gray-400 text-xs">Location: {job.location}</p>
                    <p className="text-gray-400 text-xs">ID: {job.id}</p>
                    <div className="flex gap-2 mt-3">
                        <Button onClick={() => setIsEditing(true)} icon={Edit} className="bg-blue-600 hover:bg-blue-700">Edit</Button>
                        <Button onClick={() => onDelete('jobs', job.id)} icon={XCircle} className="bg-red-600 hover:bg-red-700">Delete</Button>
                    </div>
                </div>
            )}
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

// --- Learning Platform Page ---
// Displays learning modules and allows users to complete them.
const LearningPlatform = ({ setCurrentPage }) => {
    const { userId, db, isAuthReady, geminiApiKey, appId } = useFirebase();
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [generationPrompt, setGenerationPrompt] = useState('');


    useEffect(() => {
        if (isAuthReady && userId) {
            const modulesRef = collection(db, `artifacts/${appId}/public/data/learningModules`);
            const unsubscribe = onSnapshot(modulesRef, (snapshot) => {
                setModules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            }, (error) => {
                console.error("Error fetching modules:", error);
                setMessage('Failed to load learning modules.');
                setMessageType('error');
                setShowMessageBox(true);
                setLoading(false);
            });
            return () => unsubscribe();
        } else if (isAuthReady && !userId) {
            setCurrentPage('auth');
        }
    }, [isAuthReady, userId, db, setCurrentPage, appId]);

    const handleModuleComplete = async (moduleId) => {
        if (!userId || !db) return;
        setShowMessageBox(false);
        try {
            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const completedModules = userData.completedModules || [];
                if (!completedModules.includes(moduleId)) {
                    await updateDoc(userDocRef, {
                        completedModules: [...completedModules, moduleId],
                        points: (userData.points || 0) + 50, // Example: 50 points per module
                        workflowProgress: Math.min(100, (userData.workflowProgress || 0) + 10) // Example: 10% progress per module
                    });
                    setMessage('Module completed! You earned 50 points and made progress.');
                    setMessageType('success');
                    setShowMessageBox(true);
                    setSelectedModule(null); // Go back to module list
                } else {
                    setMessage('You have already completed this module.');
                    setMessageType('info');
                    setShowMessageBox(true);
                }
            }
        } catch (error) {
                console.error("Error completing module:", error);
                setMessage(`Failed to complete module: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
            }
        };

    const handleGenerateContent = async () => {
        if (!generationPrompt.trim()) {
            setMessage('Please enter a prompt to generate content.');
            setMessageType('error');
            setShowMessageBox(true);
            return;
        }

        setIsGeneratingContent(true);
        setGeneratedContent('');
        setMessage('Generating content, please wait...');
        setMessageType('info');
        setShowMessageBox(true);

        const chatHistory = [{ role: "user", parts: [{ text: generationPrompt }] }];
        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

        let retries = 0;
        const maxRetries = 5;
        const baseDelay = 1000; // 1 second

        while (retries < maxRetries) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.status === 429) { // Too Many Requests
                    const delay = baseDelay * Math.pow(2, retries);
                    console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise(res => setTimeout(res, delay));
                    retries++;
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    setGeneratedContent(text);
                    setMessage('Content generated successfully!');
                    setMessageType('success');
                    setShowMessageBox(true);
                } else {
                    setMessage('Failed to generate content: No valid response from API.');
                    setMessageType('error');
                    setShowMessageBox(true);
                }
                break; // Exit loop on success
            } catch (error) {
                console.error("Error generating content:", error);
                setMessage(`Failed to generate content: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
                break; // Exit loop on unrecoverable error
            } finally {
                setIsGeneratingContent(false);
            }
        }
        if (retries === maxRetries) {
            setMessage('Failed to generate content after multiple retries due to rate limiting.');
            setMessageType('error');
            setShowMessageBox(true);
            setIsGeneratingContent(false);
        }
    };

    // This return is intentional for early exit during loading.
    if (loading) {
        return <LoadingPage message="Loading learning platform..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6 flex flex-col items-center">
            <header className="w-full flex justify-between items-center p-4 bg-gray-900 rounded-xl shadow-lg mb-6">
                <h1 className="text-3xl font-extrabold text-blue-400">Learning Platform</h1>
                <Button onClick={() => setCurrentPage('dashboard')} icon={Home} className="bg-gray-700 hover:bg-gray-600">
                    Back to Dashboard
                </Button>
            </header>

            <div className="flex-grow w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                {!selectedModule ? (
                    <>
                        <h2 className="text-3xl font-bold text-white text-center mb-8">Available Learning Modules</h2>
                        {modules.length === 0 ? (
                            <p className="text-center text-gray-400 text-lg">No learning modules available yet. Admins can add them!</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {modules.map(module => (
                                    <div key={module.id} className="bg-gray-700 p-6 rounded-lg shadow-md border border-gray-600 flex flex-col">
                                        <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                                        <p className="text-gray-300 mb-4 flex-grow">{module.description}</p>
                                        <Button onClick={() => setSelectedModule(module)} className="w-full bg-blue-600 hover:bg-blue-700">
                                            View Module
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-10 pt-8 border-t border-gray-700">
                            <h2 className="text-3xl font-bold text-white text-center mb-6">Generate Custom Learning Content</h2>
                            <p className="text-gray-400 text-center mb-4">
                                Use AI to generate learning materials on any topic!
                            </p>
                            <div className="flex flex-col gap-4">
                                <Textarea
                                    id="generationPrompt"
                                    placeholder="e.g., Explain quantum computing for beginners, Summarize the history of AI, Provide a tutorial on React hooks"
                                    value={generationPrompt}
                                    onChange={(e) => setGenerationPrompt(e.target.value)}
                                    rows="3"
                                />
                                <Button
                                    onClick={handleGenerateContent}
                                    disabled={isGeneratingContent}
                                    icon={Brain}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                >
                                    {isGeneratingContent ? 'Generating...' : 'Generate Content'}
                                </Button>
                                {generatedContent && (
                                    <div className="bg-gray-700 p-6 rounded-lg shadow-inner mt-6">
                                        <h3 className="text-xl font-semibold text-white mb-3">Generated Content:</h3>
                                        <div className="prose prose-invert max-w-none text-gray-300">
                                            {/* Render Markdown content */}
                                            <div dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br />') }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-4">{selectedModule.title}</h2>
                        <p className="text-gray-300 text-lg mb-6">{selectedModule.description}</p>
                        <div className="prose prose-invert max-w-none text-gray-200 mb-8">
                            {/* Render Markdown content */}
                            <div dangerouslySetInnerHTML={{ __html: selectedModule.content.replace(/\n/g, '<br />') }} />
                        </div>
                        <div className="flex justify-between gap-4">
                            <Button onClick={() => setSelectedModule(null)} className="bg-gray-600 hover:bg-gray-700">
                                Back to Modules
                            </Button>
                            <Button onClick={() => handleModuleComplete(selectedModule.id)} className="bg-green-600 hover:bg-green-700">
                                Mark as Complete
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

// --- Assessment Page ---
// Allows users to take assessments.
const Assessment = ({ setCurrentPage }) => {
    const { userId, db, isAuthReady, geminiApiKey, appId } = useFirebase();
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // Changed to useState for proper React state management
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [improvementSuggestions, setImprovementSuggestions] = useState('');
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);


    useEffect(() => {
        if (isAuthReady && userId) {
            const assessmentsRef = collection(db, `artifacts/${appId}/public/data/assessments`);
            const unsubscribe = onSnapshot(assessmentsRef, (snapshot) => {
                setAssessments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            }, (error) => {
                console.error("Error fetching assessments:", error);
                setMessage('Failed to load assessments.');
                setMessageType('error');
                setShowMessageBox(true);
                setLoading(false);
            });
            return () => unsubscribe();
        } else if (isAuthReady && !userId) {
            setCurrentPage('auth');
        }
    }, [isAuthReady, userId, db, setCurrentPage, appId]);

    const startAssessment = (assessment) => {
        setSelectedAssessment(assessment);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setShowResults(false);
        setScore(0);
        setImprovementSuggestions('');
    };

    const handleAnswerSelect = (questionIndex, optionIndex) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < selectedAssessment.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            calculateResults();
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const calculateResults = async () => {
        let correctCount = 0;
        const skillUpdates = {}; // To track changes to skill levels

        selectedAssessment.questions.forEach((q, index) => {
            const isCorrect = userAnswers[index] === q.correctAnswer;
            if (isCorrect) {
                correctCount++;
                // If correct, increase skill level (max 5)
                skillUpdates[q.skillImpact] = Math.min(5, (skillUpdates[q.skillImpact] || 0) + 1);
            } else {
                // If incorrect, decrease skill level (min 0)
                skillUpdates[q.skillImpact] = Math.max(0, (skillUpdates[q.skillImpact] || 0) - 0.5); // Small penalty
            }
        });
        setScore(correctCount);
        setShowResults(true);

        // Fetch current user profile to apply skill updates
        if (userId && db) {
            try {
                const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    let currentSkills = userData.skills || [];
                    const currentPoints = userData.points || 0;
                    const pointsEarned = correctCount * 10; // Example: 10 points per correct answer

                    // Apply skill updates
                    for (const skillName in skillUpdates) {
                        const existingSkillIndex = currentSkills.findIndex(s => s.name.toLowerCase() === skillName.toLowerCase());
                        if (existingSkillIndex !== -1) {
                            // Update existing skill level
                            currentSkills[existingSkillIndex].level = Math.round(skillUpdates[skillName]);
                        } else {
                            // Add new skill if it doesn't exist
                            currentSkills.push({ name: skillName, level: Math.round(skillUpdates[skillName]) });
                        }
                    }

                    await updateDoc(userDocRef, {
                        points: currentPoints + pointsEarned,
                        skills: currentSkills,
                        workflowProgress: Math.min(100, (userData.workflowProgress || 0) + 15), // Example: 15% progress
                        [`completedAssessments.${selectedAssessment.id}`]: {
                            score: correctCount,
                            totalQuestions: selectedAssessment.questions.length,
                            dateCompleted: new Date()
                        }
                    });
                    setMessage(`Assessment completed! You earned ${pointsEarned} points. Your skills have been updated.`);
                    setMessageType('success');
                    setShowMessageBox(true);
                }
            } catch (error) {
                console.error("Error updating user data after assessment:", error);
                setMessage(`Failed to update user data: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
            }
        }
        getImprovementSuggestions(selectedAssessment, userAnswers);
    };

    const getImprovementSuggestions = async (assessment, answers) => {
        setIsGeneratingSuggestions(true);
        setImprovementSuggestions('');
        setMessage('Generating personalized suggestions...');
        setMessageType('info');
        setShowMessageBox(true);

        const incorrectQuestions = assessment.questions.filter((q, index) => answers[index] !== q.correctAnswer);
        if (incorrectQuestions.length === 0) {
            setImprovementSuggestions('Great job! You answered all questions correctly. Keep up the excellent work!');
            setIsGeneratingSuggestions(false);
            setMessage('No suggestions needed. Perfect score!');
            setMessageType('success');
            setShowMessageBox(true);
            return;
        }

        const prompt = `Based on the following incorrect answers from an assessment, provide personalized improvement suggestions. Focus on specific skills that need development and suggest learning paths or resources.
        Assessment Title: ${assessment.title}
        Incorrect Questions:
        ${incorrectQuestions.map((q) => `- Question: "${q.questionText}" (Skill: ${q.skillImpact})`).join('\n')}
        Provide concise, actionable advice.`;

        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

        let retries = 0;
        const maxRetries = 5;
        const baseDelay = 1000;

        while (retries < maxRetries) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.status === 429) {
                    const delay = baseDelay * Math.pow(2, retries);
                    console.warn(`Rate limit hit. Retrying suggestions in ${delay / 1000}s...`);
                    await new Promise(res => setTimeout(res, delay));
                    retries++;
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const text = result.candidates[0].content.parts[0].text;
                    setImprovementSuggestions(text);
                    setMessage('Suggestions generated!');
                    setMessageType('success');
                    setShowMessageBox(true);
                } else {
                    setMessage('Failed to generate suggestions: No valid response from API.');
                    setMessageType('error');
                    setShowMessageBox(true);
                }
                break;
            } catch (error) {
                console.error("Error generating suggestions:", error);
                setMessage(`Failed to generate suggestions: ${error.message}`);
                setMessageType('error');
                setShowMessageBox(true);
                break;
            } finally {
                setIsGeneratingSuggestions(false);
            }
        }
        if (retries === maxRetries) {
            setMessage('Failed to generate suggestions after multiple retries due to rate limiting.');
            setMessageType('error');
            setShowMessageBox(true);
            setIsGeneratingSuggestions(false);
        }
    };


    // This return is intentional for early exit during loading.
    if (loading) {
        return <LoadingPage message="Loading assessments..." />;
    }

    // This return is intentional for early exit if no assessment is selected.
    if (!selectedAssessment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6 flex flex-col items-center">
                <header className="w-full flex justify-between items-center p-4 bg-gray-900 rounded-xl shadow-lg mb-6">
                    <h1 className="text-3xl font-extrabold text-blue-400">Assessments</h1>
                    <Button onClick={() => setCurrentPage('dashboard')} icon={Home} className="bg-gray-700 hover:bg-gray-600">
                        Back to Dashboard
                    </Button>
                </header>
                <div className="flex-grow w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                    <h2 className="text-3xl font-bold text-white text-center mb-8">Select an Assessment</h2>
                    {assessments.length === 0 ? (
                        <p className="text-center text-gray-400 text-lg">No assessments available yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {assessments.map(assessment => (
                                <div key={assessment.id} className="bg-gray-700 p-6 rounded-lg shadow-md border border-gray-600 flex flex-col">
                                    <h3 className="text-xl font-semibold text-white mb-2">{assessment.title}</h3>
                                    <p className="text-gray-300 mb-4 flex-grow">{assessment.description}</p>
                                    <Button onClick={() => startAssessment(assessment)} className="w-full bg-blue-600 hover:bg-blue-700">
                                        Start Assessment ({assessment.questions.length} Questions)
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {showMessageBox && (
                    <MessageBox
                        message={message}
                        type={messageType}
                        onConfirm={() => setShowMessageBox(false)}
                    />
                )}
            </div>
        );
    }

    const currentQuestion = selectedAssessment.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6 flex flex-col items-center">
            <header className="w-full flex justify-between items-center p-4 bg-gray-900 rounded-xl shadow-lg mb-6">
                <h1 className="text-3xl font-extrabold text-blue-400">{selectedAssessment.title}</h1>
                <Button onClick={() => setSelectedAssessment(null)} icon={Target} className="bg-gray-700 hover:bg-gray-600">
                    Back to Assessments
                </Button>
            </header>

            <div className="flex-grow w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                {!showResults ? (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">
                            Question {currentQuestionIndex + 1} of {selectedAssessment.questions.length}
                        </h2>
                        <p className="text-xl mb-6">{currentQuestion.questionText}</p>
                        <div className="space-y-4">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                                    className={`w-full text-left p-4 rounded-lg border-2
                                                ${userAnswers[currentQuestionIndex] === index
                                            ? 'bg-blue-600 border-blue-700'
                                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                        }
                                                transition duration-200 ease-in-out`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-8">
                            <Button
                                onClick={goToPreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="bg-gray-600 hover:bg-gray-700"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={goToNextQuestion}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {currentQuestionIndex === selectedAssessment.questions.length - 1 ? 'Submit Assessment' : 'Next'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-green-400 mb-4">Assessment Complete!</h2>
                        <p className="text-2xl mb-6">You scored {score} out of {selectedAssessment.questions.length} questions correctly.</p>
                        <div className="space-y-4">
                            {selectedAssessment.questions.map((q, index) => (
                                <div key={index} className="bg-gray-700 p-4 rounded-lg text-left">
                                    <p className="font-semibold text-lg">{q.questionText}</p>
                                    <p className="text-gray-300">Your Answer: <span className={userAnswers[index] === q.correctAnswer ? 'text-green-400' : 'text-red-400'}>
                                        {q.options[userAnswers[index]] || 'No answer'}
                                    </span></p>
                                    <p className="text-gray-300">Correct Answer: <span className="text-green-400">{q.options[q.correctAnswer]}</span></p>
                                    <p className="text-gray-300 text-sm">Skill Assessed: <span className="font-medium text-blue-400">{q.skillImpact}</span></p>
                                </div>
                            ))}
                        </div>
                        {isGeneratingSuggestions ? (
                            <LoadingPage message="Generating personalized suggestions..." />
                        ) : improvementSuggestions && (
                            <div className="mt-8 bg-gray-700 p-6 rounded-lg shadow-inner text-left">
                                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2"><Lightbulb size={24} /> Personalized Improvement Suggestions:</h3>
                                <div className="prose prose-invert max-w-none text-gray-300">
                                    <div dangerouslySetInnerHTML={{ __html: improvementSuggestions.replace(/\n/g, '<br />') }} />
                                </div>
                            </div>
                        )}
                        <Button onClick={() => setSelectedAssessment(null)} className="mt-8 bg-blue-600 hover:bg-blue-700">
                            Back to Assessments
                        </Button>
                    </div>
                )}
            </div>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};


// --- Leaderboard Page ---
// Displays top users based on points.
const Leaderboard = ({ setCurrentPage }) => {
    const { db, isAuthReady, userId, appId } = useFirebase();
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showMessageBox, setShowMessageBox] = useState(false);

    useEffect(() => {
        console.log("Leaderboard Component useEffect: isAuthReady:", isAuthReady, "userId:", userId);
        if (isAuthReady && userId) {
            const fetchLeaderboard = async () => {
                setLoading(true);
                try {
                    const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
                    const querySnapshot = await getDocs(usersCollectionRef);
                    const users = [];

                    for (const userDoc of querySnapshot.docs) {
                        const profileDocRef = doc(db, `artifacts/${appId}/users/${userDoc.id}/profile/data`);
                        const profileSnap = await getDoc(profileDocRef);
                        if (profileSnap.exists()) {
                            const data = profileSnap.data();
                            // Only include employees in leaderboard
                            if (data.userType === 'employee') {
                                users.push({
                                    id: userDoc.id,
                                    email: data.email,
                                    points: data.points || 0,
                                    targetRole: data.targetRole || 'N/A'
                                });
                            }
                        }
                    }
                    // Sort by points in descending order
                    users.sort((a, b) => b.points - a.points);
                    setLeaderboardData(users);
                    console.log("Leaderboard Component useEffect: Leaderboard data loaded.");
                } catch (error) {
                    console.error("Error fetching leaderboard:", error);
                    setMessage('Failed to load leaderboard data.');
                    setMessageType('error');
                    setShowMessageBox(true);
                } finally {
                    setLoading(false);
                }
            };

            fetchLeaderboard();
        } else if (isAuthReady && !userId) {
            console.log("Leaderboard Component useEffect: Not authenticated, redirecting to auth.");
            setCurrentPage('auth');
        }
    }, [isAuthReady, userId, db, setCurrentPage, appId]);

    // This return is intentional for early exit during loading.
    if (loading) {
        return <LoadingPage message="Loading leaderboard..." />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6 flex flex-col items-center">
            <header className="w-full flex justify-between items-center p-4 bg-gray-900 rounded-xl shadow-lg mb-6">
                <h1 className="text-3xl font-extrabold text-blue-400">Leaderboard</h1>
                <Button onClick={() => setCurrentPage('dashboard')} icon={Home} className="bg-gray-700 hover:bg-gray-600">
                    Back to Dashboard
                </Button>
            </header>

            <div className="flex-grow w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                <h2 className="text-3xl font-bold text-white text-center mb-8">Top Performers</h2>
                {leaderboardData.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">No users on the leaderboard yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="py-3 px-4 text-left text-gray-300 font-semibold">Rank</th>
                                    <th className="py-3 px-4 text-left text-gray-300 font-semibold">Email</th>
                                    <th className="py-3 px-4 text-left text-gray-300 font-semibold">Target Role</th>
                                    <th className="py-3 px-4 text-left text-gray-300 font-semibold">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboardData.map((user, index) => (
                                    <tr key={user.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700">
                                        <td className="py-3 px-4 text-lg font-bold text-blue-400">{index + 1}</td>
                                        <td className="py-3 px-4">{user.email}</td>
                                        <td className="py-3 px-4">{user.targetRole}</td>
                                        <td className="py-3 px-4">{user.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {showMessageBox && (
                <MessageBox
                    message={message}
                    type={messageType}
                    onConfirm={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};


// --- Main App Component ---
const App = () => {
    // The 'loading' state was removed from this component in a previous update as 'currentPage' handles it.
    const { isAuthReady, userId, userRole, db, appId } = useFirebase();
    const [currentPage, setCurrentPage] = useState('loading');
    const [pageProps, setPageProps] = useState({}); // State to pass props to pages

    // Callback to handle successful authentication and message dismissal
    const handleAuthSuccessAndMessageDismissed = useCallback(() => {
        // This callback is triggered when Auth page successfully authenticates
        // and its message box is dismissed.
        // The useEffect in Auth component will handle navigation based on userRole.
        // No direct navigation here to avoid race conditions with role fetching.
    }, []);

    useEffect(() => {
        console.log("App Component useEffect: isAuthReady:", isAuthReady, "userId:", userId, "userRole:", userRole);
        if (isAuthReady) {
            if (userId) {
                const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
                const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log("App Component useEffect: User profile exists. Role:", data.userType);
                        if (data.userType === 'admin') {
                            setCurrentPage('adminDashboard');
                        } else if (data.userType === 'employee') {
                            setCurrentPage('dashboard');
                        } else {
                            setCurrentPage('profileSetup');
                        }
                    } else {
                        console.log("App Component useEffect: User profile does NOT exist, navigating to profileSetup.");
                        setCurrentPage('profileSetup');
                    }
                }, (error) => {
                    console.error("App Component useEffect: Error fetching user role on app load:", error);
                    setCurrentPage('profileSetup'); // Fallback
                });
                return () => unsubscribe();
            } else {
                console.log("App Component useEffect: No userId, navigating to auth.");
                setCurrentPage('auth');
            }
        }
    }, [isAuthReady, userId, db, userRole, appId]); // Added userRole and appId to dependencies

    // Function to navigate between pages
    const navigateTo = (page, props = {}) => {
        setPageProps(props);
        setCurrentPage(page);
    };

    // Render the current page based on the currentPage state
    const renderPage = () => {
        switch (currentPage) {
            case 'loading':
                return <LoadingPage message="Initializing application..." />;
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
