const admin = require('firebase-admin');

let app;
let configurationErrorLogged = false;

function credentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

function getApp() {
  if (app) return app;
  const serviceAccount = credentials();
  if (!serviceAccount) return null;
  try {
    app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (error) {
    // Push is optional. A bad/misquoted Render secret must not make unrelated
    // customer API routes (including /notifications/config) return 500.
    if (!configurationErrorLogged) {
      configurationErrorLogged = true;
      console.error('Firebase Admin configuration is invalid; push notifications are disabled:', error.message);
    }
    return null;
  }
  return app;
}

async function sendToTokens(tokens, notification, data = {}) {
  const firebaseApp = getApp();
  if (!firebaseApp || !tokens.length) return { configured: Boolean(firebaseApp), successCount: 0, failureCount: 0 };
  const response = await admin.messaging(firebaseApp).sendEachForMulticast({
    tokens,
    notification,
    data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
    webpush: { fcmOptions: { link: process.env.APP_URL || '/' } },
  });
  return { configured: true, successCount: response.successCount, failureCount: response.failureCount };
}

module.exports = { sendToTokens, isConfigured: () => Boolean(getApp()) };
