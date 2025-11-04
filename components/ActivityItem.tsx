import React, { useRef } from 'react';
import type { Activity } from '../types';
import { ACTIVITIES, ROTATIONAL } from '../constants';
import { TrashIcon, CalendarIcon } from './icons';

interface ActivityItemProps {
    activity: Activity;
    index: number;
    onUpdate: (id: string, updatedFields: Partial<Activity>) => void;
    onRemove: (id: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, index, onUpdate, onRemove }) => {
    const dateInputRef = useRef<HTMLInputElement>(null);
    
    const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newActivityName = e.target.value;
        const newConfig = ACTIVITIES[newActivityName];
        let newValue: string | number = 0;

        if (newConfig) {
            // Set intelligent defaults for the 'value' field when activity type changes
            if (newConfig.rate.includes("80 flat")) {
                newValue = 0; // No value input needed
            } else if (newConfig.rate.includes("20-40")) {
                newValue = 30; // Default slider value
            } else if (newConfig.rate.includes("duration-based")) {
                newValue = 1; // Default to 1 month
            }
        }
        
        onUpdate(activity.id, { activity: newActivityName, value: newValue });
    };

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const rawValue = e.target.value;
        let numericValue = e.target.type === 'range' || e.target.type === 'number' || e.target.tagName === 'SELECT' 
            ? parseFloat(rawValue) 
            : 0;
        
        onUpdate(activity.id, { value: numericValue });
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
            className: "w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary",
            value: activity.value,
            onChange: handleValueChange
        };
        
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
                <select {...commonProps} value={String(activity.value)}>
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
                <h3 className="font-semibold text-gray-700 truncate pr-2">
                    {activity.activity ? `${index + 1}: ${activity.activity}` : `New Activity ${index + 1}`}
                </h3>
                <div className="flex items-center gap-4 flex-shrink-0">
                     <span className={`font-bold text-lg ${activity.credits > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {activity.credits.toFixed(1)}
                    </span>
                    <button onClick={() => onRemove(activity.id)} aria-label={`Remove activity ${index + 1}`} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                        <TrashIcon />
                    </button>
                </div>
            </summary>
            <div className="p-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Training Activity</label>
                        <select value={activity.activity} onChange={handleActivityChange} className="w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary">
                            <option value="">-- Select an activity --</option>
                            {Object.keys(ACTIVITIES).map(act => <option key={act} value={act}>{act}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={`date-${activity.id}`} className="block text-sm font-medium text-gray-700 mb-1">Date Completed</label>
                        <div className="relative">
                            <input 
                                type="date"
                                ref={dateInputRef}
                                id={`date-${activity.id}`}
                                value={activity.date} 
                                onChange={e => onUpdate(activity.id, { date: e.target.value })} 
                                className="w-full pl-3 pr-10 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" 
                            />
                            <div 
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 cursor-pointer"
                                onClick={() => dateInputRef.current?.showPicker()}
                            >
                                <CalendarIcon />
                            </div>
                        </div>
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
                             <input type="file" multiple onChange={handleFileChange} className="block w-full text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded-md cursor-pointer focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200" />
                            {activity.files.length > 0 && <div className="text-xs text-gray-500 mt-1">{activity.files.length} file(s) selected.</div>}
                        </div>
                    </div>
                )}
            </div>
        </details>
    );
};