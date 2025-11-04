
import React from 'react';

interface ProgressBarProps {
    current: number;
    goal: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, goal }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    const isComplete = current >= goal;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <span className="text-lg font-semibold text-gray-800">Total Credits</span>
                <span className={`text-2xl font-bold ${isComplete ? 'text-green-600' : 'text-gray-700'}`}>
                    {current.toFixed(1)} / {goal}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                    className={`h-4 rounded-full transition-all duration-500 ease-out ${isComplete ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};
