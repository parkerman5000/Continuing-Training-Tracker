import React, { useState, useMemo } from 'react';
import { GOALS } from './constants';
import type { Activity } from './types';
import { ActivityItem } from './components/ActivityItem';
import { ProgressBar } from './components/ProgressBar';

const App: React.FC = () => {
    const [name, setName] = useState('');
    const [period, setPeriod] = useState('Oct 2020 – Oct 2025');
    const [qualification, setQualification] = useState('Facility Representative');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // GitHub state
    const [githubOwner, setGithubOwner] = useState('');
    const [githubRepo, setGithubRepo] = useState('');
    const [githubPat, setGithubPat] = useState('');
    const [submissionUrl, setSubmissionUrl] = useState('');

    const goal = useMemo(() => GOALS[qualification] || 80, [qualification]);
    const totalCredits = useMemo(() => activities.reduce((sum, act) => sum + act.credits, 0), [activities]);

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
        setActivities(prev => prev.map(act => act.id === id ? { ...act, ...updatedFields } : act));
    };

    const removeActivity = (id: string) => {
        setActivities(prev => prev.filter(act => act.id !== id));
    };

    const convertToCSV = (data: Record<string, any>[]): string => {
        if (data.length === 0) return "";
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '""');
                return `"${escaped}"`;
            });
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

    const handleSubmit = async () => {
        setError(null);
        setSubmissionStatus('idle');

        if (!name || !period) {
            setError("Name & 5-Year Period are required.");
            return;
        }
        if (activities.filter(a => a.activity).length === 0) {
            setError("Please add at least one training activity.");
            return;
        }
        if (!githubOwner || !githubRepo || !githubPat) {
            setError("GitHub Username, Repository, and Personal Access Token are required to save.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionUrl('');

        try {
            const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'user';
            const submissionTimestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
            const submissionPath = `submissions/${safeName}_${submissionTimestamp}`;
            const commitMessage = `feat: Add training submission for ${name}`;
            const githubApiUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/`;
            const headers = {
                'Authorization': `token ${githubPat}`,
                'Accept': 'application/vnd.github.v3+json',
            };

            // 1. Upload CSV
            const flattenedActivities = activities
                .filter(a => a.activity)
                .map(a => ({
                    'Name': name,
                    '5-Year Period': period,
                    'Qualification Standard': qualification,
                    'Credit Goal': goal,
                    'Activity': a.activity,
                    'Date Completed': a.date,
                    'Credits Earned': a.credits,
                    'Attached Files': a.files.map(f => f.name).join('; ')
                }));

            const csvContent = convertToCSV(flattenedActivities);
            const csvBase64 = btoa(csvContent);

            const csvUploadResponse = await fetch(`${githubApiUrl}${submissionPath}/submission.csv`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    message: commitMessage,
                    content: csvBase64,
                }),
            });

            if (!csvUploadResponse.ok) {
                const errorData = await csvUploadResponse.json();
                throw new Error(`GitHub API Error (CSV): ${errorData.message || csvUploadResponse.statusText}`);
            }
            const csvData = await csvUploadResponse.json();
            const folderUrl = csvData.content.html_url.substring(0, csvData.content.html_url.lastIndexOf('/'));
            setSubmissionUrl(folderUrl);

            // 2. Upload Certificate Files
            const fileUploadPromises = [];
            for (const activity of activities) {
                for (const file of activity.files) {
                    const promise = fileToBase64(file).then(base64Content => {
                        const filePath = `${submissionPath}/certificates/${file.name}`;
                        return fetch(`${githubApiUrl}${filePath}`, {
                            method: 'PUT',
                            headers,
                            body: JSON.stringify({
                                message: commitMessage,
                                content: base64Content,
                            }),
                        });
                    }).then(async response => {
                        if (!response.ok) {
                             const errorData = await response.json();
                            throw new Error(`GitHub API Error (File ${file.name}): ${errorData.message || response.statusText}`);
                        }
                        return response.json();
                    });
                    fileUploadPromises.push(promise);
                }
            }

            await Promise.all(fileUploadPromises);
            
            setSubmissionStatus('success');
            setTimeout(() => {
                setName('');
                setPeriod('Oct 2020 – Oct 2025');
                setQualification('Facility Representative');
                setActivities([]);
                setGithubPat(''); // Clear PAT for security
                setSubmissionStatus('idle');
            }, 5000);

        } catch (err) {
            console.error("Error saving to GitHub:", err);
            setError((err as Error).message || "Could not save to GitHub. Check console for details.");
            setSubmissionStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Continuing Training Submission</h1>
                    <p className="text-gray-600 mt-2">So easy, it takes less than a minute.</p>
                </header>
                
                <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
                    {/* User Info & Goal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">5-Year Period</label>
                                <input id="period" type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">Qualification Standard</label>
                                <select id="qualification" value={qualification} onChange={e => setQualification(e.target.value)} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
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
                            Add Training
                        </button>
                    </div>

                    {/* GitHub Submission Section */}
                    <div className="pt-6 border-t border-gray-200 space-y-4">
                         <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                            <h3 className="font-bold text-orange-800">Save to GitHub</h3>
                             <p className="text-sm text-orange-700 mt-1">
                                To save, provide a <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target="_blank" rel="noopener noreferrer" className="underline">Personal Access Token (classic)</a> with <code className="bg-orange-200 text-orange-900 px-1 rounded text-xs">repo</code> scope.
                                 <br/><strong>Security Warning:</strong> Your token will be sent over the network. This tool does not store it after submission. Use with caution.
                            </p>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="githubOwner" className="block text-sm font-medium text-gray-700 mb-1">GitHub Username</label>
                                <input id="githubOwner" type="text" value={githubOwner} onChange={e => setGithubOwner(e.target.value)} placeholder="e.g., octocat" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="githubRepo" className="block text-sm font-medium text-gray-700 mb-1">Repository Name</label>
                                <input id="githubRepo" type="text" value={githubRepo} onChange={e => setGithubRepo(e.target.value)} placeholder="e.g., training-records" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="githubPat" className="block text-sm font-medium text-gray-700 mb-1">Personal Access Token (PAT)</label>
                                <input id="githubPat" type="password" value={githubPat} onChange={e => setGithubPat(e.target.value)} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                        </div>

                        {error && <p className="text-red-600 text-center">{error}</p>}
                        {submissionStatus === 'success' && (
                             <div className="text-center p-4 rounded-md bg-green-100 text-green-800">
                                <p className="font-semibold">Successfully Saved to GitHub!</p>
                                <a href={submissionUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-green-900 hover:text-green-700">View Submission Folder</a>
                            </div>
                        )}
                        {submissionStatus !== 'success' && (
                           <button onClick={handleSubmit} disabled={isSubmitting} className="w-full px-6 py-4 border border-transparent text-lg font-bold rounded-md text-white bg-brand-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-102 disabled:bg-gray-400 disabled:scale-100">
                                {isSubmitting ? 'Saving to GitHub...' : 'SAVE TO GITHUB'}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;