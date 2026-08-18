const admin = require('firebase-admin');

let app;
function getApp() {
  if (app) return app;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;
  app = admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
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
