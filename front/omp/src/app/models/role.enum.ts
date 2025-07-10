// Role enum matching the backend Domain.Entities.Role enum
export enum Role {
  Admin = 0,
  Associe = 1,
  Directeur = 2,
  SeniorManager = 3,
  Manager = 4,
  AssistantManager = 5,
  Senior = 6,
  Junior = 7,
  User = 8
}

// Helper function to convert role number to string for display purposes
export function getRoleDisplayName(role: number): string {
  switch (role) {
    case Role.Admin:
      return 'Admin';
    case Role.Associe:
      return 'Associé';
    case Role.Directeur:
      return 'Directeur';
    case Role.SeniorManager:
      return 'Senior Manager';
    case Role.Manager:
      return 'Manager';
    case Role.AssistantManager:
      return 'Assistant Manager';
    case Role.Senior:
      return 'Senior';
    case Role.Junior:
      return 'Junior';
    case Role.User:
      return 'User';
    default:
      return 'Unknown';
  }
}

// Helper function to get role number from string (for backward compatibility)
export function getRoleFromString(roleString: string): number {
  const normalizedRole = roleString.toLowerCase().replace(/[^a-z]/g, '');
  
  switch (normalizedRole) {
    case 'admin':
      return Role.Admin;
    case 'associe':
    case 'associé':
      return Role.Associe;
    case 'directeur':
      return Role.Directeur;
    case 'seniormanager':
    case 'senior manager':
      return Role.SeniorManager;
    case 'manager':
      return Role.Manager;
    case 'assistantmanager':
    case 'assistant manager':
      return Role.AssistantManager;
    case 'senior':
      return Role.Senior;
    case 'junior':
      return Role.Junior;
    case 'user':
      return Role.User;
    default:
      return Role.User; // Default fallback
  }
}

// Array of available roles for dropdowns (excluding Admin which should only be created by system)
export const AVAILABLE_ROLES = [
  { value: Role.Junior, label: 'Junior' },
  { value: Role.Senior, label: 'Senior' },
  { value: Role.AssistantManager, label: 'Assistant Manager' },
  { value: Role.Manager, label: 'Manager' },
  { value: Role.SeniorManager, label: 'Senior Manager' },
  { value: Role.Directeur, label: 'Directeur' },
  { value: Role.Associe, label: 'Associé' }
];
