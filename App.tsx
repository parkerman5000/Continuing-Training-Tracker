import React, { useState, useMemo, useEffect } from 'react';
import { GOALS, ACTIVITIES, ROTATIONAL } from './constants';
import type { Activity } from './types';
import { ActivityItem } from './components/ActivityItem';
import { ProgressBar } from './components/ProgressBar';
import { InstructionsModal } from './components/InstructionsModal';
import { InfoIcon } from './components/icons';

/*
    INSTRUCTIONS: How to Enable Google Sheets Integration
    -----------------------------------------------------
    This app is configured to send submission data to a Google Sheet. To make this work,
    you need to create a simple web service using Google Apps Script.

    1. Open your Google Sheet:
       https://docs.google.com/spreadsheets/d/1gVdoHKjecSUSINKFOS-w1x8ANbbSOemz4jZhxmqXBOY/

    2. Create the Apps Script:
       - In the sheet, go to "Extensions" > "Apps Script".
       - Erase any existing code in the editor.
       - Copy and paste the entire script from the box below into the editor.

       function doPost(e) {
         try {
           var sheet = SpreadsheetApp.openById("1gVdoHKjecSUSINKFOS-w1x8ANbbSOemz4jZhxmqXBOY").getSheetByName("Submissions");
           if (!sheet) {
             throw new Error("Sheet 'Submissions' not found.");
           }
           
           var data = JSON.parse(e.postData.contents);
           
           // If the sheet is empty, add headers first
           if (sheet.getLastRow() === 0) {
             sheet.appendRow(["Timestamp", "Name", "5-Year Period", "Qualification Standard", "Credit Goal", "Activity", "Date Completed", "Credits Earned", "Attached Files"]);
           }
           
           data.activities.forEach(function(activity) {
             sheet.appendRow([
               new Date(),
               data.name,
               data.period,
               data.qualification,
               data.goal,
               activity.activity,
               activity.date,
               activity.credits,
               activity.files.map(function(f) { return f.name; }).join('; ')
             ]);
           });

           return ContentService
             .createTextOutput(JSON.stringify({ "status": "success" }))
             .setMimeType(ContentService.MimeType.JSON);
         
         } catch (error) {
           return ContentService
             .createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
             .setMimeType(ContentService.MimeType.JSON);
         }
       }


    3. Deploy the Script as a Web App:
       - Save the script (click the floppy disk icon).
       - Click the "Deploy" button > "New deployment".
       - In the dialog box:
         - Select Type (gear icon) > "Web app".
         - Description: "Training Tracker API"
         - Execute as: "Me"
         - Who has access: "Anyone"  <-- This is very important.
       - Click "Deploy".
       - Authorize the script when prompted by Google.

    4. Configure the App:
       - After deployment, copy the "Web app URL" it gives you.
       - Paste this URL into the `GOOGLE_SCRIPT_URL` constant below, replacing the placeholder.
*/
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
const STORAGE_KEY = 'continuing-training-tracker-state';


const App: React.FC = () => {
    const [name, setName] = useState('');
    const [period, setPeriod] = useState('Oct 2020 – Oct 2025');
    const [qualification, setQualification] = useState('Facility Representative');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

    const goal = useMemo(() => GOALS[qualification] || 80, [qualification]);
    const totalCredits = useMemo(() => activities.reduce((sum, act) => sum + act.credits, 0), [activities]);
    
    // Load state from localStorage on initial render
    useEffect(() => {
        try {
            const savedStateJSON = localStorage.getItem(STORAGE_KEY);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                if (savedState) {
                    setName(savedState.name || '');
                    setPeriod(savedState.period || 'Oct 2020 – Oct 2025');
                    setQualification(savedState.qualification || 'Facility Representative');
                    setActivities(savedState.activities || []);
                }
            }
        } catch (err) {
            console.error("Failed to load state from localStorage", err);
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            const stateToSave = { name, period, qualification, activities };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (err) {
            console.error("Failed to save state to localStorage", err);
        }
    }, [name, period, qualification, activities]);


    useEffect(() => {
        if (submissionStatus === 'success') {
            const timer = setTimeout(() => {
                setSubmissionStatus('idle');
                setSubmissionUrl('');
            }, 5000);
            return () => clearTimeout(timer); // Cleanup on unmount or if status changes
        }
    }, [submissionStatus]);
    
    const calculateCredits = (activityName: string, value: number | string): number => {
        const config = ACTIVITIES[activityName];
        if (!config) return 0;
    
        let numericValue = Number(value);
        let newCredits = 0;
    
        if (config.rate.includes("per hour") && !config.rate.includes("2 hours")) {
            newCredits = numericValue;
        } else if (config.rate.includes("per semester")) {
            newCredits = numericValue * 10;
        } else if (config.rate.includes("per CEU")) {
            newCredits = numericValue * 10;
        } else if (config.rate.includes("same as course")) {
            newCredits = numericValue;
        } else if (config.rate.includes("20-40")) {
            newCredits = Math.max(20, Math.min(40, numericValue));
        } else if (config.rate.includes("duration-based")) {
            const key = numericValue as keyof typeof ROTATIONAL;
            if (key in ROTATIONAL) {
                newCredits = ROTATIONAL[key];
            } else {
                newCredits = 0;
            }
        } else if (config.rate.includes("80 flat")) {
            newCredits = 80;
        } else if (config.rate.includes("2 per activity")) {
            newCredits = numericValue * 2;
        } else if (config.rate.includes("1 per 2 hours")) {
            newCredits = numericValue / 2;
        } else {
             newCredits = numericValue;
        }
        
        if (config.max && newCredits > config.max) {
            newCredits = config.max;
        }
        
        return newCredits;
    };


    const addActivity = () => {
        const newActivity: Activity = {
            id: new Date().toISOString() + Math.random(),
            activity: '',
            date: '',
            value: 0,
            credits: 0,
            files: [],
        };
        setActivities(prev => [...prev, newActivity]);
    };

    const updateActivity = (id: string, updatedFields: Partial<Activity>) => {
        setActivities(prev => prev.map(act => {
            if (act.id === id) {
                const newActivity = { ...act, ...updatedFields };
                
                if (updatedFields.activity !== undefined || updatedFields.value !== undefined) {
                     const newCredits = calculateCredits(newActivity.activity, newActivity.value);
                     newActivity.credits = newCredits;
                }
                
                return newActivity;
            }
            return act;
        }));
    };

    const removeActivity = (id: string) => {
        setActivities(prev => prev.filter(act => act.id !== id));
    };
    
    const clearForm = () => {
        setName('');
        setPeriod('Oct 2020 – Oct 2025');
        setQualification('Facility Representative');
        setActivities([]);
        setSubmissionStatus('idle');
        setError(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    const convertToCSV = (data: Record<string, any>[]): string => {
        if (data.length === 0) return "";
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        for (const row of data) {
            const values = headers.map(header => `"${('' + row[header]).replace(/"/g, '""')}"`);
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    }

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };
    
    const submitToGitHub = async () => {
        const GITHUB_OWNER = 'parkerman5000';
        const GITHUB_REPO = 'Continuing-Training-Tracker';
        // CRITICAL SECURITY FIX: Never hardcode secrets. Replace this with your actual PAT.
        // It is strongly recommended to use environment variables for production.
        // IMPORTANT: If you saw a real token here, you MUST revoke it on GitHub immediately.
        const GITHUB_PAT = 'YOUR_GITHUB_PAT_HERE';
        const GITHUB_API_BASE = 'https://api.github.com';
        const headers = {
            'Authorization': `token ${GITHUB_PAT}`,
            'Accept': 'application/vnd.github.v3+json',
        };

        if (GITHUB_PAT === 'YOUR_GITHUB_PAT_HERE') {
            throw new Error("GitHub PAT is not configured. Please add your token in App.tsx.");
        }

        const githubFetch = async (endpoint: string, options: RequestInit = {}) => {
            const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
                ...options,
                headers: { ...headers, ...options.headers },
            });
            if (!response.ok) {
                let errorMessage = `GitHub API Error (${response.status} on ${endpoint}): `;
                 try {
                    const errorData = await response.json();
                    errorMessage += errorData.message || response.statusText;
                 } catch (e) {
                    errorMessage += response.statusText;
                 }
                 if (response.status === 401 || response.status === 403) {
                     errorMessage += " Please check if the GitHub PAT is valid and has 'contents: write' permissions.";
                 }
                throw new Error(errorMessage);
            }
            return response.json();
        };

        const repoData = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`);
        const defaultBranch = repoData.default_branch;
        const refData = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${defaultBranch}`);
        const latestCommitSha = refData.object.sha;
        const commitData = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${latestCommitSha}`);
        const baseTreeSha = commitData.tree.sha;

        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'user';
        const submissionTimestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const submissionPath = `submissions/${safeName}_${submissionTimestamp}`;

        const csvContent = convertToCSV(activities.filter(a => a.activity).map(a => ({
            'Name': name, '5-Year Period': period, 'Qualification Standard': qualification, 'Credit Goal': goal,
            'Activity': a.activity, 'Date Completed': a.date, 'Credits Earned': a.credits, 'Attached Files': a.files.map(f => f.name).join('; ')
        })));
        
        const filesToUpload = [{ path: `${submissionPath}/submission.csv`, content: btoa(unescape(encodeURIComponent(csvContent))) }];
        for (const activity of activities) {
            for (const file of activity.files) {
                filesToUpload.push({ path: `${submissionPath}/certificates/${file.name}`, content: await fileToBase64(file) });
            }
        }

        const createdBlobs = await Promise.all(filesToUpload.map(file => 
            githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/blobs`, {
                method: 'POST', body: JSON.stringify({ content: file.content, encoding: 'base64' })
            })
        ));

        const newTreeData = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`, {
            method: 'POST', body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: filesToUpload.map((file, index) => ({ path: file.path, mode: '100644', type: 'blob', sha: createdBlobs[index].sha }))
            })
        });

        const newCommitData = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`, {
            method: 'POST', body: JSON.stringify({
                message: `feat: Add training submission for ${name}`, tree: newTreeData.sha, parents: [latestCommitSha]
            })
        });

        await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${defaultBranch}`, {
            method: 'PATCH', body: JSON.stringify({ sha: newCommitData.sha })
        });
        
        return newCommitData;
    };

    const submitToGoogleSheet = async () => {
        const payload = {
            name, period, qualification, goal,
            activities: activities.filter(a => a.activity).map(a => ({
                activity: a.activity, date: a.date, credits: a.credits, files: a.files.map(f => ({ name: f.name }))
            }))
        };
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            redirect: 'follow',
        });
        
        if (!response.ok) {
            throw new Error(`Failed to submit to Google Sheets. Status: ${response.statusText}`);
        }
    };


    const handleSubmit = async () => {
        setError(null);
        setSubmissionStatus('idle');

        if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            setError("Application is not configured for Google Sheets submission. Please update the GOOGLE_SCRIPT_URL in App.tsx.");
            return;
        }

        if (!name || !period) {
            setError("Name & 5-Year Period are required.");
            return;
        }
        if (activities.filter(a => a.activity).length === 0) {
            setError("Please add at least one training activity.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionUrl('');

        try {
            const githubPromise = submitToGitHub();
            const googleSheetPromise = submitToGoogleSheet();

            const [githubResult] = await Promise.all([githubPromise, googleSheetPromise]);

            setSubmissionUrl(githubResult.html_url);
            
            // Reset form and clear storage
            clearForm();

            // Trigger success state
            setSubmissionStatus('success');

        } catch (err) {
            console.error("Error during submission:", err);
            setError((err as Error).message || "Could not save submission. One of the destinations may have failed.");
            setSubmissionStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
                <header className="relative text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Continuing Training Submission</h1>
                    <p className="text-gray-600 mt-2">So easy, it takes less than a minute.</p>
                     <button
                        onClick={() => setIsInstructionsOpen(true)}
                        className="absolute top-0 right-0 flex items-center gap-1.5 px-3 py-2 text-sm text-brand-primary bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        aria-label="View training guidelines"
                    >
                        <InfoIcon />
                        <span>Guidelines</span>
                    </button>
                </header>
                
                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                    {/* User Info & Goal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">5-Year Period</label>
                                <input id="period" type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">Qualification Standard</label>
                                <select id="qualification" value={qualification} onChange={e => setQualification(e.target.value)} className="w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                                    {Object.keys(GOALS).map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="bg-brand-light flex flex-col items-center justify-center p-4 rounded-lg text-center">
                            <span className="text-sm font-medium text-gray-500">CREDIT GOAL</span>
                            <span className="text-5xl font-bold text-brand-primary">{goal}</span>
                        </div>
                    </div>

                    <ProgressBar current={totalCredits} goal={goal} />

                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Training Activities</h2>
                        
                        <div className="space-y-4">
                            {activities.map((activity, index) => (
                                <ActivityItem 
                                    key={activity.id}
                                    activity={activity}
                                    index={index}
                                    onUpdate={updateActivity}
                                    onRemove={removeActivity}
                                />
                            ))}
                        </div>
                        <button onClick={addActivity} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-success hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Add Training Activity
                        </button>
                    </div>

                    {/* Submission Section */}
                    <div className="pt-6 border-t border-gray-200">
                        {error && <p className="text-red-600 text-center mb-4 p-3 bg-red-100 rounded-md">{error}</p>}
                        
                        {submissionStatus === 'success' && (
                             <div className="text-center p-4 rounded-md bg-green-100 text-green-800">
                                <p className="font-semibold">Successfully Submitted!</p>
                                <a href={submissionUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-green-900 hover:text-green-700">View Submission Record on GitHub</a>
                                <p className="text-sm mt-1">Data also saved to the shared Google Sheet.</p>
                            </div>
                        )}

                        {submissionStatus !== 'success' && (
                             <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button onClick={clearForm} disabled={isSubmitting} className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50">
                                    Clear Form
                                </button>
                                <button onClick={handleSubmit} disabled={isSubmitting} className="w-full px-6 py-3 border border-transparent text-lg font-bold rounded-md text-white bg-brand-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-102 disabled:bg-gray-400 disabled:scale-100">
                                    {isSubmitting ? 'Submitting...' : 'SUBMIT TRAINING RECORD'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <InstructionsModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} />
        </div>
    );
};

export default App;