
export type Page = 'dashboard' | 'schedule' | 'classes' | 'students' | 'teachers' | 'finances';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string; // Date of Birth - ISO string
  notes?: string;
  active: boolean;
  planId?: string;
  joinDate: string; // ISO string
  leaveDate?: string; // ISO string
  customPrice?: number;
  customClassesPerWeek?: number;
}

export interface Teacher {
  id:string;
  name: string;
  contact: string;
}

export interface Discipline {
  id: string;
  name: string;
}

export interface ClassSession {
  id: string;
  disciplineId: string;
  teacherId?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  capacity: number;
  studentIds: string[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  classesPerWeek: number;
}

export interface Payment {
  id: string;
  studentId: string;
  date: string; // ISO string
  amount: number;
  method: 'cash' | 'transfer' | 'pos';
}

export interface Cost {
  id: string;
  date: string; // ISO string
  category: 'teacher' | 'rent' | 'supplies' | 'marketing' | 'other';
  amount: number;
  description: string;
  classSessionId?: string;
  teacherId?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'error';
}