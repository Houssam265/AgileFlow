/** Aligné sur le backend : !@#$%^&* comme caractères spéciaux autorisés */
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

export const PASSWORD_REQUIREMENTS_TEXT =
  'Au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial parmi !@#$%^&*';

export function passwordMeetsPolicy(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
}

export function passwordStrengthLabel(password: string): '' | 'Faible' | 'Moyen' | 'Bon' | 'Fort' {
  if (!password) return '';
  const c = getPasswordChecks(password);
  const met = [c.length, c.upper, c.lower, c.digit, c.special].filter(Boolean).length;
  if (met <= 2) return 'Faible';
  if (met === 3) return 'Moyen';
  if (met === 4) return 'Bon';
  return passwordMeetsPolicy(password) ? 'Fort' : 'Bon';
}
