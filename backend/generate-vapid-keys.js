/**
 * Run once to generate VAPID keys for push notifications:
 *   node generate-vapid-keys.js
 *
 * Then add the output values to:
 *   - Railway env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
 *   - Vercel env var:   VITE_VAPID_PUBLIC_KEY  (same as the public key above)
 */
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('\n=== VAPID Keys (save these — you can only generate them once) ===\n');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('VAPID_EMAIL=admin@greenguild.ai');
console.log('\nVITE_VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('\nAdd the first three to Railway and the last one to Vercel.\n');
