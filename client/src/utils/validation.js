export function validatePremise(premise) {
  const length = premise.trim().length;
  if (length < 20 || length > 500) return 'Your premise needs between 20 and 500 characters.';
  return '';
}
