
import React from 'react';
import type { Activity } from '../types';
import { ACTIVITIES, ROTATIONAL } from '../constants';
import { TrashIcon } from './icons';

interface ActivityItemProps {
    activity: Activity;
    index: number;
    onUpdate: (id: string, updatedFields: Partial<Activity>) => void;
    onRemove: (id: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, index, onUpdate, onRemove }) => {
    
    const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newActivityName = e.target.value;
        const newConfig = ACTIVITIES[newActivityName];
        let newCredits = 0;
        let newValue: string | number = 0;

        if (newConfig) {
            // FIX: Use string.includes() to check for substrings instead of the 'in' operator, which is for object properties.
            if (newConfig.rate.includes("80 flat")) {
                newCredits = 80;
            } else if (newConfig.rate.includes("20-40")) {
                newValue = 30; // Default slider value
                newCredits = 30;
            } else if (newConfig.rate.includes("duration-based")) {
                newValue = 1; // Default months
                newCredits = ROTATIONAL[1];
            }
        }
        
        onUpdate(activity.id, { activity: newActivityName, credits: newCredits, value: newValue });
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const config = ACTIVITIES[activity.activity];
        if (!config) return;

        const rawValue = e.target.value;
        let numericValue = e.target.type === 'number' || e.target.tagName === 'SELECT' ? parseFloat(rawValue) : 0;
        let newCredits = 0;

        // FIX: Use string.includes() to check for substrings instead of the 'in' operator. The 'not in' syntax was also invalid and replaced with !string.includes().
        if (config.rate.includes("per hour") && !config.rate.includes("2 hours")) {
            newCredits = numericValue;
        } else if (config.rate.includes("per semester")) {
            newCredits = numericValue * 10;
        } else if (config.rate.includes("per CEU")) {
            newCredits = numericValue * 10;
        } else if (config.rate.includes("same as course")) {
            newCredits = numericValue;
        } else if (config.rate.includes("20-40")) {
            newCredits = numericValue;
        } else if (config.rate.includes("duration-based")) {
            newCredits = ROTATIONAL[numericValue];
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
        
        onUpdate(activity.id, { value: numericValue, credits: newCredits });
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onUpdate(activity.id, { files: Array.from(e.target.files) });
        }
    };

    const renderInputs = () => {
        const config = ACTIVITIES[activity.activity];
        if (!config) return null;

        const commonProps = {
            className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary",
            value: activity.value,
            onChange: handleValueChange
        };
        
        // FIX: Use string.includes() to check for substrings instead of the 'in' operator. The 'not in' syntax was also invalid and replaced with !string.includes().
        if (config.rate.includes("per hour") && !config.rate.includes("2 hours")) {
            return <input type="number" min="0" step="0.5" {...commonProps} />;
        }
        if (config.rate.includes("per semester")) {
            return <input type="number" min="0" step="0.5" {...commonProps} />;
        }
        if (config.rate.includes("per CEU")) {
            return <input type="number" min="0" step="0.1" {...commonProps} />;
        }
        if (config.rate.includes("same as course")) {
            return <input type="number" min="0" step="1" {...commonProps} />;
        }
        if (config.rate.includes("20-40")) {
            return <input type="range" min="20" max="40" {...commonProps} />;
        }
        if (config.rate.includes("duration-based")) {
            return (
                <select {...commonProps}>
                    {Object.keys(ROTATIONAL).map(m => <option key={m} value={m}>{m} month(s)</option>)}
                </select>
            );
        }
        if (config.rate.includes("2 per activity")) {
            return <input type="number" min="1" step="1" {...commonProps} />;
        }
        if (config.rate.includes("1 per 2 hours")) {
            return <input type="number" min="0" step="1.0" {...commonProps} />;
        }
        if (config.rate.includes("80 flat")) {
            return <p className="text-gray-600 font-medium p-2">Credits automatically set to 80.</p>
        }
        return <input type="number" {...commonProps} />;
    };

    const config = ACTIVITIES[activity.activity];
    
    return (
        <details className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden" open>
            <summary className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100">
                <h3 className="font-semibold text-gray-700">
                    {activity.activity ? `${index + 1}: ${activity.activity.substring(0,40)}...` : `Activity ${index + 1}`}
                </h3>
                <div className="flex items-center gap-4">
                     <span className={`font-bold text-lg ${activity.credits > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {activity.credits.toFixed(1)}
                    </span>
                    <button onClick={() => onRemove(activity.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                        <TrashIcon />
                    </button>
                </div>
            </summary>
            <div className="p-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Training Activity</label>
                        <select value={activity.activity} onChange={handleActivityChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                            <option value="">-- Select an activity --</option>
                            {Object.keys(ACTIVITIES).map(act => <option key={act} value={act}>{act}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Completed</label>
                        <input type="date" value={activity.date} onChange={e => onUpdate(activity.id, { date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" />
                    </div>
                </div>

                {config && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">
                                {config.rate.includes('per hour') ? 'Hours' : config.rate.includes('per semester') ? 'Semester Hours' : config.rate.includes('per CEU') ? 'CEUs' : config.rate.includes('same as course') ? 'Course Credits' : config.rate.includes('20-40') ? `Credits: ${activity.value}` : config.rate.includes('duration-based') ? 'Duration' : config.rate.includes('2 per activity') ? 'Number of Activities' : 'Value'}
                            </label>
                            {renderInputs()}
                            {config.max && <p className="text-xs text-gray-500 mt-1">Maximum {config.max} credits for this activity type.</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Certificate(s)</label>
                             <input type="file" multiple onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            {activity.files.length > 0 && <div className="text-xs text-gray-500 mt-1">{activity.files.length} file(s) selected.</div>}
                        </div>
                    </div>
                )}
            </div>
        </details>
    );
};