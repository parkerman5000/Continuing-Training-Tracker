
import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
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

    const handleSubmit = async () => {
        setError(null);
        if (!name || !period) {
            setError("Name & 5-Year Period are required.");
            return;
        }
        if (activities.filter(a => a.activity).length === 0) {
            setError("Please add at least one training activity.");
            return;
        }

        setIsSubmitting(true);
        try {
            const zip = new JSZip();

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
            zip.file("submission_details.csv", csvContent);

            const certificatesFolder = zip.folder("certificates");
            if(certificatesFolder){
                activities.forEach((activity, activityIndex) => {
                    activity.files.forEach((file) => {
                        certificatesFolder.file(`${activityIndex + 1}_${file.name}`, file);
                    });
                });
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(zipBlob);
            const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `training_submission_${safeName || 'user'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            setSubmissionStatus('success');
            setTimeout(() => {
                setName('');
                setPeriod('Oct 2020 – Oct 2025');
                setQualification('Facility Representative');
                setActivities([]);
                setSubmissionStatus('idle');
            }, 3000);

        } catch (err) {
            console.error("Error creating submission package:", err);
            setError("Could not create the submission package. Please try again.");
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
                                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div>
                                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">5-Year Period</label>
                                <input id="period" type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">Qualification Standard</label>
                                <select id="qualification" value={qualification} onChange={e => setQualification(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                                    {Object.keys(GOALS).map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="bg-brand-light flex flex-col items-center justify-center p-4 rounded-lg text-center">
                            <span className="text-sm font-medium text-gray-500">CREDIT GOAL</span>
                            <span className="text-5xl font-bold text-brand-primary">{goal}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <ProgressBar current={totalCredits} goal={goal} />

                    {/* Activities Section */}
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

                    {/* Submission */}
                    <div className="pt-6 border-t border-gray-200">
                        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
                        {submissionStatus === 'success' && (
                             <div className="text-center p-4 rounded-md bg-green-100 text-green-800">
                                <p className="font-semibold">Submission Package Downloaded!</p>
                                <p className="text-sm">Your form will now be cleared.</p>
                            </div>
                        )}
                        {submissionStatus !== 'success' && (
                           <button onClick={handleSubmit} disabled={isSubmitting} className="w-full px-6 py-4 border border-transparent text-lg font-bold rounded-md text-white bg-brand-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-102 disabled:bg-gray-400 disabled:scale-100">
                                {isSubmitting ? 'Packaging...' : 'DOWNLOAD SUBMISSION PACKAGE'}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;