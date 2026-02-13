const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordPolicy(password: string) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLower || !hasUpper || !hasNumber) {
    return "Password must include uppercase, lowercase and a number";
  }

  return null;
}