const themeMiddleware = (req, res, next) => {
    req.theme = req.cookies['theme'] || "dark";
    next();
}

module.exports = themeMiddleware;