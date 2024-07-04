function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

function logSuccess(message) {
    console.log(`[SUCCESS] ${message}`);
}

function logWarning(message) {
    console.log(`[WARN] ${message}`);
}

module.exports = {
    logInfo,
    logSuccess,
    logWarning
}