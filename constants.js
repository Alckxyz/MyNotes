export const NoteType = {
    TEXT: 'text',
    CHECKLIST: 'checklist',
    LINKS: 'links',
    TASKS: 'tasks'
};

export const DEFAULT_SETTINGS = {
    textSize: 16,
    imageSize: 140,
    autoLockMinutes: 2
};

// --- Security Helpers (WebCrypto AES-GCM) ---

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

/**
 * Encrypts a random master key using a user-provided PIN.
 */
export async function encryptMasterKey(pin) {
    const masterKeyRaw = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = 100000;
    
    const key = await deriveKey(pin, salt, iterations);
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        masterKeyRaw
    );

    return {
        encryptedMasterKey: arrayBufferToBase64(encrypted),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
        iterations,
        // We return the raw master key so the app can use it immediately after setup
        rawMasterKey: arrayBufferToBase64(masterKeyRaw)
    };
}

/**
 * Decrypts the master key using the PIN.
 */
export async function decryptMasterKey(payload, pin) {
    try {
        const { encryptedMasterKey, salt, iv, iterations } = payload;
        const saltArr = new Uint8Array(base64ToArrayBuffer(salt));
        const ivArr = new Uint8Array(base64ToArrayBuffer(iv));
        const cipherArr = base64ToArrayBuffer(encryptedMasterKey);
        
        const key = await deriveKey(pin, saltArr, iterations);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivArr },
            key,
            cipherArr
        );
        
        return arrayBufferToBase64(decrypted);
    } catch (e) {
        throw new Error("PIN Incorrecto");
    }
}

// --- WebAuthn / Passkeys ---

export async function isBiometricsAvailable() {
    return !!(window.PublicKeyCredential && 
           await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
}

export async function registerBiometrics() {
    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = crypto.getRandomValues(new Uint8Array(16));
        
        const createOptions = {
            publicKey: {
                challenge,
                rp: { name: "Notas Pro" },
                user: {
                    id: userId,
                    name: "user@notaspro",
                    displayName: "Usuario Notas Pro"
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                authenticatorSelection: { 
                    userVerification: "required",
                    residentKey: "preferred"
                },
                timeout: 60000
            }
        };
        const credential = await navigator.credentials.create(createOptions);
        if (credential) {
            return btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        }
    } catch (e) {
        console.error("Biometric registration failed:", e);
        throw e;
    }
}

export async function verifyBiometrics(storedIdB64) {
    try {
        const rawId = new Uint8Array(atob(storedIdB64).split("").map(c => c.charCodeAt(0)));
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const options = {
            publicKey: {
                challenge,
                allowCredentials: [{
                    id: rawId,
                    type: 'public-key'
                }],
                userVerification: "required",
                timeout: 60000
            }
        };
        const assertion = await navigator.credentials.get(options);
        return !!assertion;
    } catch (e) {
        console.error("Biometric verification failed:", e);
        return false;
    }
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

export const playSound = () => {};