import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

if (!admin.apps.length) {
  try {
    // Try to load from the JSON file provided in the backend directory
    const serviceAccountPath = join(process.cwd(), 'firebase-secrets.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully using firebase-secrets.json');
  } catch (error) {
    // Fallback to environment variables if the file is missing or invalid
    try {
      if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Firebase Admin initialized successfully using environment variables');
      } else {
        console.warn('Firebase Admin NOT initialized: No firebase-secrets.json or env variables found.');
      }
    } catch (envError) {
      console.error('Firebase Admin initialization error:', envError);
    }
  }
}

export default admin;
