const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'session_store.json');

function loadStore() {
    try {
        if (fs.existsSync(STORE_PATH)) {
            return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
        }
    } catch {}
    return {};
}

function saveStore(store) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function getSession(sessionId) {
    const store = loadStore();
    return store[sessionId] || null;
}

function saveSession(sessionId, data) {
    const store = loadStore();
    store[sessionId] = {
        ...(store[sessionId] || {}),
        ...data,
        id: sessionId,
        updatedAt: Date.now()
    };
    if (!store[sessionId].createdAt) {
        store[sessionId].createdAt = Date.now();
    }
    saveStore(store);
}

function deleteSessionMeta(sessionId) {
    const store = loadStore();
    delete store[sessionId];
    saveStore(store);
}

function getAllSessions() {
    return loadStore();
}

function setSessionConnected(sessionId, connected) {
    const store = loadStore();
    if (store[sessionId]) {
        store[sessionId].lastConnected = connected ? Date.now() : (store[sessionId].lastConnected || null);
        store[sessionId].autoRestart = connected;
        store[sessionId].updatedAt = Date.now();
        saveStore(store);
    }
}

module.exports = { loadStore, saveStore, getSession, saveSession, deleteSessionMeta, getAllSessions, setSessionConnected };
