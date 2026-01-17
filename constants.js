export const NoteType = {
    TEXT: 'text',
    CHECKLIST: 'checklist',
    LINKS: 'links',
    WORKOUT: 'workout',
    TASKS: 'tasks'
};

export const DEFAULT_SETTINGS = {
    textSize: 16,
    imageSize: 140,
    autoLockMinutes: 2
};

export const AUTH_SESSION_DURATION = 2 * 60 * 1000;

// --- Security Helpers (WebCrypto AES-GCM) ---

async function deriveKey(pin, salt, iterations = 100000) {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(pin),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: "SHA-256",
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export async function encryptNote(content, pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(content));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = 100000;
    const key = await deriveKey(pin, salt, iterations);
    
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    return {
        encrypted: true,
        ciphertext: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv),
        salt: arrayBufferToBase64(salt),
        iterations: iterations
    };
}

export async function decryptNote(payload, pin) {
    try {
        if (!payload) return null;
        const { ciphertext, iv, salt, iterations } = payload;
        const saltArr = new Uint8Array(base64ToArrayBuffer(salt));
        const ivArr = new Uint8Array(base64ToArrayBuffer(iv));
        const cipherArr = base64ToArrayBuffer(ciphertext);
        
        const key = await deriveKey(pin, saltArr, iterations);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivArr },
            key,
            cipherArr
        );
        
        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
        throw new Error("PIN Incorrecto");
    }
}

export async function isBiometricsAvailable() {
    return window.PublicKeyCredential && 
           await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

export async function authenticateBiometrics() {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    // Use a simpler credential request for verification
    const options = {
        publicKey: {
            challenge,
            rpId: window.location.hostname,
            userVerification: "required",
            timeout: 60000
        }
    };
    try {
        // Try getting credentials first (cheaper/faster for existing users)
        // If it fails, we fall back to PIN or standard creation for this demo
        if (navigator.credentials && navigator.credentials.get) {
            await navigator.credentials.get({ publicKey: options.publicKey });
            return true;
        }
        return false;
    } catch (e) {
        // Fallback to create if get fails or is unsupported
        try {
            const createOptions = {
                publicKey: {
                    ...options.publicKey,
                    rp: { name: "Notas Pro" },
                    user: {
                        id: crypto.getRandomValues(new Uint8Array(16)),
                        name: "user",
                        displayName: "User"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }]
                }
            };
            await navigator.credentials.create(createOptions);
            return true;
        } catch (err) {
            console.error("Biometric fail:", err);
            return false;
        }
    }
}

let inMemoryMasterPin = null;

/**
 * Validates a PIN against a master PIN for the current session.
 * Does not persist data in the browser.
 */
export function verifyMasterPin(pin) {
    if (!inMemoryMasterPin) {
        // If no master set for this session, the first PIN provided becomes the master
        inMemoryMasterPin = pin;
        return true;
    }
    return inMemoryMasterPin === pin;
}

export const NOTE_COLORS = [
    { name: 'Default', value: '#1e1e1e' },
    { name: 'Blue', value: '#1e3a8a' },
    { name: 'Green', value: '#064e3b' },
    { name: 'Purple', value: '#4c1d95' },
    { name: 'Orange', value: '#7c2d12' },
    { name: 'Red', value: '#7f1d1d' },
    { name: 'Teal', value: '#134e4a' }
];

export const AUDIO_CLICK = null;
export const AUDIO_DELETE = null;
export const AUDIO_MOVE = null;

export const playSound = () => {};