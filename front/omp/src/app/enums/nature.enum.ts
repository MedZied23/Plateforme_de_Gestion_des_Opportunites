export enum Nature {
  AMI = 0,
  Propale = 1,
  Pitch = 2
}

// Helper function to convert enum value to display string
export function getNatureDisplayName(nature: Nature): string {
  switch (nature) {
    case Nature.AMI:
      return 'AMI';
    case Nature.Propale:
      return 'Propale';
    case Nature.Pitch:
      return 'Pitch';
    default:
      return '';
  }
}

// Helper function to convert display string to enum value
export function getNatureFromDisplayName(displayName: string): Nature | null {
  switch (displayName) {
    case 'AMI':
      return Nature.AMI;
    case 'Propale':
      return Nature.Propale;
    case 'Pitch':
      return Nature.Pitch;
    default:
      return null;
  }
}

// Get all nature options for dropdowns
export function getAllNatureOptions(): { value: Nature; label: string }[] {
  return [
    { value: Nature.AMI, label: 'AMI' },
    { value: Nature.Propale, label: 'Propale' },
    { value: Nature.Pitch, label: 'Pitch' }
  ];
}

// Get nature display names only for simple string-based dropdowns
export function getNatureDisplayNames(): string[] {
  return ['AMI', 'Propale', 'Pitch'];
}
