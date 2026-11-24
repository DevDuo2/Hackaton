import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  selectedSubject?: string;
  avatar: string;
  createdAt: string;
}

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

export function getAllUsers(): UserRecord[] {
  try {
    if (!fs.existsSync(usersFilePath)) {
      return [];
    }
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data) as UserRecord[];
  } catch (error) {
    console.error('Error reading users.json:', error);
    return [];
  }
}

export function saveUser(newUser: UserRecord): boolean {
  try {
    const users = getAllUsers();
    users.push(newUser);
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving to users.json:', error);
    return false;
  }
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
}
