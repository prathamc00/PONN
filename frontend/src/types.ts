export interface User {
  id: string;
  name: string;
  email: string;
  collegeName: string;
  branch: string;
  semester: string;
  phone: string;
  role: 'student' | 'admin';
  photo?: string;
  address?: string;
  dob?: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  image: string;
  modules: Module[];
}

export interface Module {
  id: string;
  title: string;
  videoUrl?: string;
  pdfUrl?: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded';
  description: string;
}

export interface Test {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

export interface AttendanceRecord {
  date: string;
  subject: string;
  status: 'Present' | 'Absent';
}
