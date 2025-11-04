
import type { Activities, Goals, RotationalCredits } from './types';

export const ACTIVITIES: Activities = {
    "Formal or Informal Training (Learning Nucleus, LEARN, classroom or online courses)": {"rate": "1 per hour", "max": null},
    "Accredited Higher Education Courses (such as university courses)": {"rate": "10 per semester hour", "max": null},
    "Continuing Education Unit (CEU)": {"rate": "10 per CEU", "max": null},
    "Equivalency Exam": {"rate": "same as course", "max": null},
    "Conference, training, or seminar presentation": {"rate": "1 per hour incl prep", "max": 20},
    // FIX: Changed 'None' to 'null' to match the type definition (number | null).
    "Professional License or Certification": {"rate": "20-40", "max": null},
    "On-the-job Experiential Learning (OJT)": {"rate": "1 per hour", "max": 20},
    "Mentoring": {"rate": "1 per hour", "max": 20},
    "Rotational or Developmental Assignment": {"rate": "duration-based", "max": null},
    "Publication": {"rate": "1 per hour prep", "max": 20},
    "Association Leadership Role (such as ANSI, AMSE)": {"rate": "1 per hour", "max": 20},
    "Facility Representative Delta Qualification": {"rate": "80 flat", "max": null},
    "Positional Training (such as for STSM, Facility Representative, Quality Assurance Assessor, Project Management, Contracting Officer Representative)": {"rate": "1 per hour", "max": null},
    "Self-Study (changes/revisions to technical standards, published articles/literature)": {"rate": "2 per activity", "max": 20},
    "“Lunch and Learn” or similar facilitated discussion": {"rate": "1 per hour", "max": 20},
    "Assessments/Investigations": {"rate": "1 per 2 hours", "max": 40},
};

export const ROTATIONAL: RotationalCredits = {1:20, 2:30, 3:35, 6:45, 9:65, 12:80};

export const GOALS: Goals = {
    "Facility Representative": 80, 
    "STSM": 60, 
    "Quality Assurance Assessor": 70,
    "Project Management": 65, 
    "Contracting Officer Representative": 60
};