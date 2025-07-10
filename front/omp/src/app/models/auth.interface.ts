export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  grade: number; // Changed to numeric for role enum
}

export interface AuthResponse {
  token: string;
  email: string;
  nom: string;
  prenom: string;
  role: number; // Changed to numeric for role enum
}

export interface LoginRequest {
  email: string;
  password: string;
}