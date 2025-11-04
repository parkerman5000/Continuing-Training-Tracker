import React from 'react';
import { CloseIcon } from './icons';

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const trainingData = [
    { activity: 'Formal or Informal Training (Learning Nucleus, LEARN, classroom or online courses)', credits: '1 CREDIT HOUR per hour of instruction\n(Mandatory Federal Training Excluded)' },
    { activity: 'Accredited Higher Education Courses (such as university courses)', credits: 'Generally, 10 CREDIT HOURs per semester or quarter hour' },
    { activity: 'Continuing Education Unit (CEU)', credits: '10 CREDIT HOURS per CEU' },
    { activity: 'Equivalency Exam', credits: 'Same points as awarded for the course' },
    { activity: 'Conference, training, or seminar presentation', credits: '1 CREDIT HOUR per hour, including preparation; maximum of 20 CREDIT HOURS per year' },
    { activity: 'Professional License or Certification', credits: '20 to 40 CREDIT HOURS' },
    { activity: 'On-the-job Experiential Learning (OJT)', credits: '1 CREDIT HOUR per hour of activity; maximum 20 CREDIT HOURs per year' },
    { activity: 'Mentoring', credits: '1 CREDIT HOUR per hour of activity; maximum 20 CREDIT HOURs per year' },
    { 
        activity: 'Rotational or Developmental Assignment', 
        credits: (
            <ul className="list-none space-y-1">
                <li><span className="font-semibold">12 months:</span> 80 CREDIT HOURS</li>
                <li><span className="font-semibold">9 months:</span> 65 CREDIT HOURS</li>
                <li><span className="font-semibold">6 months:</span> 45 CREDIT HOURS</li>
                <li><span className="font-semibold">3 months:</span> 35 CREDIT HOURS</li>
                <li><span className="font-semibold">2 months:</span> 30 CREDIT HOURS</li>
                <li><span className="font-semibold">1 month:</span> 20 CREDIT HOURS</li>
            </ul>
        )
    },
    { activity: 'Publication', credits: '1 CREDIT HOUR per hour of material preparation; maximum of 20 CREDIT HOURS per year' },
    { activity: 'Association Leadership Role (such as ANSI, AMSE)', credits: '1 CREDIT HOUR per hour; maximum of 20 CREDIT HOURs per year' },
    { activity: 'Facility Representative Delta Qualification', credits: '80 CREDIT HOURS' },
    { activity: 'Positional Training (such as for STSM, Facility Representative, Quality Assurance Assessor, Project Management, Contracting Officer Representative)', credits: '1 CREDIT HOUR per hour of instruction' },
    { activity: 'Self-Study (changes/revisions to technical standards, published articles/literature relating to technical competencies, etc)', credits: '2 CREDIT HOURs per activity; maximum 20 CREDIT HOURs per year' },
    { activity: '“Lunch and Learn” or similar facilitated discussion applicable to technical competencies', credits: '1 CREDIT HOUR per hour of activity; maximum 20 CREDIT HOURs per year' },
    { activity: 'Assessments/Investigations', credits: '1 CREDIT HOUR per 2 hours of activity; maximum 40 CREDIT HOURS per year' }
];

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl m-4 flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Continuing Training Activities Chart</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <CloseIcon />
                    </button>
                </header>
                
                <div className="overflow-y-auto p-4 md:p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[600px]">
                            <thead className="sticky top-0 bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200 w-2/5">Activity</th>
                                    <th className="p-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200 w-3/5">Credit Hours Earned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {trainingData.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="p-3 text-sm text-gray-800 align-top">{item.activity}</td>
                                        <td className="p-3 text-sm text-gray-600 align-top whitespace-pre-line">{item.credits}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <footer className="p-4 border-t border-gray-200 flex justify-end">
                     <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};
