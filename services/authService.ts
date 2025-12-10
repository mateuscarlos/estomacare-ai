
import { User } from '../types';

// Simulating a database in LocalStorage
const USERS_KEY = 'estomacare_users';
const CURRENT_USER_KEY = 'estomacare_current_user';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    // Simple check (in production, never store plain text passwords!)
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      const { password, ...userWithoutPassword } = user;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      return userWithoutPassword;
    }

    throw new Error('E-mail ou senha inválidos.');
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];

    if (users.find((u: any) => u.email === email)) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // Demo only
      specialty: 'Estomaterapeuta'
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { password: _, ...userReturn } = newUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userReturn));
    
    return userReturn;
  },

  loginWithGoogle: async (): Promise<User> => {
    // Simulate OAuth Popup delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock Google User Data
    const googleUser = {
        name: 'Usuário Google',
        email: 'usuario.google@gmail.com',
        id: 'google-uid-123456',
        specialty: 'Estomaterapeuta',
        password: '' // No password for OAuth users
    };

    // Check if user exists in our "DB", if not, create them
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    const existingUser = users.find((u: any) => u.email === googleUser.email);
    
    if (!existingUser) {
        users.push(googleUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // Set session
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(googleUser));
    return googleUser;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
};
