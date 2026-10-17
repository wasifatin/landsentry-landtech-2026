/**
 * LandSentry — Admin Login Credentials
 * ─────────────────────────────────────
 * Edit usernames and passwords directly here.
 * Each role has a username and password field.
 */

export const ADMIN_CREDENTIALS = {
  'Sub-Registrar': {
    username: 'sub_registrar',
    password: '123456789',
    displayName: 'Sub-Registrar',
    displayNameBn: 'সাব-রেজিস্ট্রার',
    office: 'Dhaka Sadar Sub-Registry Office',
  },
  'AC Land Officer': {
    username: 'ac_land_officer',
    password: '123456789',
    displayName: 'AC Land Officer',
    displayNameBn: 'এসি ল্যান্ড অফিসার',
    office: 'Tejgaon Circle Upazila Land Office',
  },
  'Land Auditor': {
    username: 'land_auditor',
    password: '123456789',
    displayName: 'Land Auditor',
    displayNameBn: 'ভূমি নিরীক্ষক',
    office: 'Directorate of Land Records & Surveys (DLRS)',
  },
};

/**
 * Authenticate login attempt
 * @param {string} role - Selected role
 * @param {string} username - Entered username
 * @param {string} password - Entered password
 * @returns {{ success: boolean, message?: string, user?: object }}
 */
export function authenticate(role, username, password) {
  if (!role || !ADMIN_CREDENTIALS[role]) {
    return { success: false, message: 'Please select a valid role.' };
  }
  const creds = ADMIN_CREDENTIALS[role];
  if (!username || username.trim().toLowerCase() !== creds.username.toLowerCase()) {
    return { success: false, message: 'Invalid username for this role.' };
  }
  if (!password || password !== creds.password) {
    return { success: false, message: 'Incorrect password. Please verify and try again.' };
  }
  return {
    success: true,
    user: {
      role: role,
      username: creds.username,
      displayName: creds.displayName,
      displayNameBn: creds.displayNameBn,
      office: creds.office,
    },
  };
}
