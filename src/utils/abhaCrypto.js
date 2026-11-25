// AES helper that is byte-for-byte compatible with the ItdoseAbha WebForms portal's
// Common.Encrypt / Common.Decrypt (App_Code/BLL/Common.cs). The portal landing page
// (Design/Default.aspx) reads the POSTed form fields and Common.Decrypt's each, so any
// value we POST from the browser must be produced by abhaEncrypt() below.
//
// Scheme (must match the portal exactly): AES-256-CBC / PKCS7, key + IV derived via
// PBKDF2 (SHA-1, 1000 iterations) from the portal key (fin_global_resources ABHAEncryptionKey) and the fixed
// "Ivan Medvedev" salt, UTF-16LE plaintext (with "+" stripped first), Base64 output.
// Verified against the .NET vectors (e.g. "12345" -> "PcbjKEuaHIA4cBOXflXc2w==").
//
// NOTE: this passes data directly to the portal from the frontend, so the key lives in
// client code. That is an accepted trade-off for this integration (the portal is an
// internal vendor app); do not reuse this key for anything sensitive.

import CryptoJS from "crypto-js";

// The encryption key is NOT kept in code: it comes from fin_global_resources
// "ABHAEncryptionKey" (AbhaLinkButton passes it in) and must equal the portal's Common.cs key.
const ABHA_SALT = new Uint8Array([
  0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76,
]);

// Encoding.Unicode in .NET == UTF-16 little-endian.
function toUtf16le(str) {
  const buf = new Uint8Array(str.length * 2);
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    buf[i * 2] = c & 0xff;
    buf[i * 2 + 1] = c >> 8;
  }
  return buf;
}

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

/**
 * Encrypts a string the same way the ABHA portal's Common.Encrypt does.
 * @param {string} plain
 * @param {string} key encryption key (fin_global_resources ABHAEncryptionKey)
 * @returns {Promise<string>} Base64 ciphertext (empty string in -> empty string out)
 */
export async function abhaEncrypt(plain, key) {
  const abhaKey = String(key ?? "").trim();
  if (abhaKey === "") {
    throw new Error("ABHA encryption key is not configured (fin_global_resources: ABHAEncryptionKey).");
  }
  const text = (plain ?? "").toString();
  if (text === "") return "";

  // window.crypto.subtle only exists on a secure page (https or localhost). The live app
  // runs on plain http (e.g. http://192.168.2.90:2001), where it is undefined and the
  // ABHA button failed with "Could not open the ABHA portal" - so fall back to crypto-js,
  // which gives the exact same ciphertext ("12345" -> "PcbjKEuaHIA4cBOXflXc2w==").
  const subtle = window.crypto?.subtle;
  if (!subtle) return abhaEncryptFallback(text, abhaKey);

  const pwKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(abhaKey),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  // Rfc2898DeriveBytes.GetBytes(32) then GetBytes(16) == one continuous 48-byte stream.
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", salt: ABHA_SALT, iterations: 1000, hash: "SHA-1" },
    pwKey,
    48 * 8,
  );
  const dk = new Uint8Array(bits);
  const aesKey = await subtle.importKey(
    "raw",
    dk.slice(0, 32),
    { name: "AES-CBC" },
    false,
    ["encrypt"],
  );
  const iv = dk.slice(32, 48);
  const data = toUtf16le(text.replace(/\+/g, ""));
  const ct = await subtle.encrypt({ name: "AES-CBC", iv }, aesKey, data);
  return toBase64(new Uint8Array(ct));
}

// Same scheme in pure JavaScript (for http pages, where window.crypto.subtle is missing).
function abhaEncryptFallback(text, abhaKey) {
  const salt = CryptoJS.enc.Hex.parse("4976616e204d65647665646576"); // "Ivan Medvedev" (= ABHA_SALT)
  // 48 bytes = 12 words: first 32 bytes are the AES key, next 16 the IV.
  const dk = CryptoJS.PBKDF2(abhaKey, salt, {
    keySize: 12,
    iterations: 1000,
    hasher: CryptoJS.algo.SHA1,
  }).toString(CryptoJS.enc.Hex);
  const key = CryptoJS.enc.Hex.parse(dk.slice(0, 64));
  const iv = CryptoJS.enc.Hex.parse(dk.slice(64, 96));
  const ct = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf16LE.parse(text.replace(/\+/g, "")),
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
  );
  return ct.ciphertext.toString(CryptoJS.enc.Base64);
}
