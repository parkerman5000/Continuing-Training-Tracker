
export interface Activity {
    id: string;
    activity: string;
    date: string;
    value: number | string;
    credits: number;
    files: File[];
}

export interface ActivityConfig {
    rate: string;
    max: number | null;
}

export interface Activities {
    [key: string]: ActivityConfig;
}

export interface RotationalCredits {
    [key: number]: number;
}

export interface Goals {
    [key: string]: number;
}
