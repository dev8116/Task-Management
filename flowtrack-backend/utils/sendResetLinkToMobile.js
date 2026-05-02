/**
 * sendResetLinkToMobile(mobile, resetUrl)
 * Provider is modular. For now: logs reset URL for demo/testing.
 *
 * Env vars supported:
 *  SMS_PROVIDER
 *  SMS_API_KEY
 *  SMS_SENDER_ID
 *  FRONTEND_URL
 */
async function sendResetLinkToMobile(mobile, resetUrl) {
  const provider = process.env.SMS_PROVIDER || 'console';

  // In real usage, switch(provider) and implement Twilio / Fast2SMS / MSG91 / WhatsApp etc.
  if (provider === 'console') {
    console.log('--- Password Reset Link (DEMO) ---');
    console.log('To Mobile:', mobile);
    console.log('Reset URL:', resetUrl);
    console.log('---------------------------------');
    return;
  }

  // Placeholder for future providers
  console.log(`[sendResetLinkToMobile] Provider '${provider}' not configured. Falling back to console log.`);
  console.log('To Mobile:', mobile);
  console.log('Reset URL:', resetUrl);
}

module.exports = { sendResetLinkToMobile };