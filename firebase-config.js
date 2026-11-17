/**
 * Shimla Crunch - Firebase Configuration
 * Currently running in local mode (enabled: false) so it serves from local products.json & server.js.
 * Set enabled: true once the client's dedicated Firebase project (shimla-crunch) is provisioned.
 */
window.SHIMLA_FIREBASE_CONFIG = {
  enabled: false,
  adminEmail: 'shimlacrunch@gmail.com',
  authorizedAdminEmails: [
    'shimlacrunch@gmail.com'
  ],
  apiKey: '',
  authDomain: '',
  projectId: 'shimla-crunch',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};
