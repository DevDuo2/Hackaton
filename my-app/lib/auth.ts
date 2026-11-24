export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  selectedSubject?: string;
  avatar: string;
  token: string;
}

// In-memory demo users database for Hackathon
export const DEMO_USERS = [
  {
    id: 'u_student_1',
    name: 'Zumradxon Xudoyberganova',
    email: 'student@voxy.edu',
    password: 'password123',
    role: 'student' as const,
    selectedSubject: 'matematika',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'u_admin_1',
    name: 'Admin Nazoratchi',
    email: 'admin@voxy.edu',
    password: 'admin123',
    role: 'admin' as const,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  },
];
