export interface UserRegister {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  phone?: string;
  role: number; // Changed to numeric for role enum
}

export interface User {
  email: string;
  nom: string;
  prenom: string;
  role: number; // Changed to numeric for role enum
}
