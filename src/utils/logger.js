let logPreprends = {
    "info": "INFO",
    "success": "SUCCESS",
    "warn": "WARN",
    "optional": "OPTIONAL",
};

if (global.config.use_log_emojis) {
    logPreprends = {
        "info": "ℹ",
        "success": "✅",
        "warn": "⚠",
        "optional": "OPTIONAL ℹ",
    };
}

function logInfo(message) {
    console.log(`[${logPreprends.info}] ${message}`);
}

function logSuccess(message) {
    console.log(`[${logPreprends.success}] ${message}`);
}

function logWarning(message) {
    console.log(`[${logPreprends.warn}] ${message}`);
}

function optionalLog(option, message) {
    if (option === true) {
        console.log(`[${logPreprends.optional}] ${message}`);
    }
}

module.exports = {
    logInfo,
    logSuccess,
    logWarning,
    optionalLog
}