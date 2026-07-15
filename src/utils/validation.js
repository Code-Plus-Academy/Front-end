/**
 * Shared validation rules and schema helpers for Education & Certifications
 */

export const isValidUrl = (url) => {
  if (!url) return true; // optional fields are handled separately
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.length > 0;
  } catch (_) {
    return false;
  }
};

export const isValidYear = (year) => {
  if (!year) return false;
  const num = Number(year);
  const currentYear = new Date().getFullYear();
  return !isNaN(num) && num >= 1950 && num <= currentYear + 10;
};

export const isValidMonth = (month) => {
  if (!month) return false;
  const num = Number(month);
  return !isNaN(num) && num >= 1 && num <= 12;
};

export const isChronologicallyValid = (startMonth, startYear, endMonth, endYear) => {
  if (!startYear || !endYear) return true;
  if (endYear === 'Present') return true;

  const startY = Number(startYear);
  const endY = Number(endYear);

  if (startY < endY) return true;
  if (startY > endY) return false;

  // Years are equal, compare months
  const startM = Number(startMonth || 1);
  const endM = Number(endMonth || 12);
  return startM <= endM;
};

export const isValidGrade = (grade) => {
  if (!grade) return true;
  const num = Number(grade);
  const allowedHonors = ['distinction', 'first class', 'first class with distinction', 'second class', 'pass', 'honors', 'first-class', 'second-class'];
  
  if (isNaN(num)) {
    return allowedHonors.includes(grade.trim().toLowerCase());
  } else {
    return num >= 0 && num <= 100; // supports GPA (0-10) and Percentage (0-100)
  }
};

export const validateCertification = (data) => {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = 'Certificate Name is required';
  }

  if (!data.issuer?.trim()) {
    errors.issuer = 'Issuer / Provider is required';
  }

  if (data.issue_month && !isValidMonth(data.issue_month)) {
    errors.issue_month = 'Invalid issue month';
  }

  if (data.issue_year && !isValidYear(data.issue_year)) {
    const maxYear = new Date().getFullYear() + 10;
    errors.issue_year = `Year must be between 1950 and ${maxYear}`;
  }

  if (!data.no_expiry) {
    if (data.expiry_month && !isValidMonth(data.expiry_month)) {
      errors.expiry_month = 'Invalid expiry month';
    }
    if (data.expiry_year && !isValidYear(data.expiry_year)) {
      const maxYear = new Date().getFullYear() + 10;
      errors.expiry_year = `Year must be between 1950 and ${maxYear}`;
    }

    if (data.issue_year && data.expiry_year) {
      if (!isChronologicallyValid(data.issue_month, data.issue_year, data.expiry_month, data.expiry_year)) {
        errors.expiry_year = 'Expiry date must be after or equal to issue date';
      }
    }
  }

  if (data.credential_url && !isValidUrl(data.credential_url)) {
    errors.credential_url = 'Please enter a valid URL (starting with http:// or https://)';
  }

  return errors;
};

export const validateEducation = (data) => {
  const errors = {};

  if (!data.school?.trim()) {
    errors.school = 'School / College name is required';
  }

  if (!data.degree?.trim()) {
    errors.degree = 'Degree is required';
  }

  if (!data.field_of_study?.trim()) {
    errors.field_of_study = 'Field of Study is required';
  }

  if (data.start_month && !isValidMonth(data.start_month)) {
    errors.start_month = 'Invalid start month';
  }

  if (data.start_year && !isValidYear(data.start_year)) {
    const maxYear = new Date().getFullYear() + 10;
    errors.start_year = `Year must be between 1950 and ${maxYear}`;
  }

  if (!data.currently_attending) {
    if (data.end_month && !isValidMonth(data.end_month)) {
      errors.end_month = 'Invalid end month';
    }
    if (data.end_year && !isValidYear(data.end_year)) {
      const maxYear = new Date().getFullYear() + 10;
      errors.end_year = `Year must be between 1950 and ${maxYear}`;
    }

    if (data.start_year && data.end_year) {
      if (!isChronologicallyValid(data.start_month, data.start_year, data.end_month, data.end_year)) {
        errors.end_year = 'End date must be after or equal to start date';
      }
    }
  }

  if (data.grade && !isValidGrade(data.grade)) {
    errors.grade = 'Grade must be a number (e.g. 8.5 or 85) or standard honors classification';
  }

  if (data.school_url && !isValidUrl(data.school_url)) {
    errors.school_url = 'Please enter a valid URL (starting with http:// or https://)';
  }

  return errors;
};
