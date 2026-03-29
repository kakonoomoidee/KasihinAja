const crypto = require("crypto");

/**
 * Secret key for signing tokens. In a real environment, this should be in .env.
 */
const APP_SECRET = process.env.APP_SECRET || "kasihin-aja-default-secret-xyz123";

/**
 * Creates a stateless signed token from a payload.
 * @param {object} payload The data to encode in the token.
 * @returns {string} The base64 encoded payload and signature.
 */
const signToken = (payload) => {
  const data = JSON.stringify({
    ...payload,
    iat: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  });
  const encodedPayload = Buffer.from(data).toString("base64");
  const signature = crypto
    .createHmac("sha256", APP_SECRET)
    .update(encodedPayload)
    .digest("base64");
  
  return `${encodedPayload}.${signature}`;
};

/**
 * Verifies a stateless signed token and returns the payload.
 * @param {string} token The token string (payload.signature).
 * @returns {object|null} The decoded payload or null if invalid.
 */
const verifyToken = (token) => {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", APP_SECRET)
      .update(encodedPayload)
      .digest("base64");

    if (signature !== expectedSignature) return null;

    const data = JSON.parse(Buffer.from(encodedPayload, "base64").toString());
    return data;
  } catch (error) {
    return null;
  }
};

module.exports = {
  signToken,
  verifyToken,
};
