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

// --- Security Helpers (WebCrypto AES-GCM) ---

async function deriveKey(pin, salt) {
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
            iterations: 100000,
            hash: "SHA-256",
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptNote(content, pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(content));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pin, salt);
    
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return btoa(String.fromCharCode.apply(null, result));
}

export async function decryptNote(encryptedStr, pin) {
    try {
        const binary = atob(encryptedStr);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        const salt = bytes.slice(0, 16);
        const iv = bytes.slice(16, 28);
        const data = bytes.slice(28);
        
        const key = await deriveKey(pin, salt);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
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
    const options = {
        publicKey: {
            challenge,
            rp: { name: "Notas Pro" },
            user: {
                id: crypto.getRandomValues(new Uint8Array(16)),
                name: "user",
                displayName: "User"
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: { userVerification: "required" },
            timeout: 60000
        }
    };
    try {
        await navigator.credentials.create(options);
        return true;
    } catch (e) {
        console.error("Biometric fail:", e);
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

export const AUDIO_CLICK = new Audio('click.mp3');
export const AUDIO_DELETE = new Audio('delete.mp3');
export const AUDIO_MOVE = new Audio('click.mp3'); // Reusing click for move for now

export const playSound = (audio) => {
    if (!audio) return;
    try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {}
};