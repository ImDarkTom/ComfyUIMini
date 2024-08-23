const path = require("path");
const fs = require("fs");

function getRelativeTimeText(timestamp) {
    const now = Date.now();
    const secondsPast = Math.floor((now - timestamp) / 1000);

    if (secondsPast < 60) {
        return `${secondsPast} second(s) ago`;
    }
    if (secondsPast < 3600) {
        const minutesAgo = Math.floor(secondsPast / 60);
        return `${minutesAgo} minute(s) ago`;
    }
    if (secondsPast < 86400) {
        const hoursAgo = Math.floor(secondsPast / 3600);
        return `${hoursAgo} hours(s) ago`;
    }
    if (secondsPast < 604800) {
        const daysAgo = Math.floor(secondsPast / 86400);
        return `${daysAgo} days(s) ago`;
    }
    if (secondsPast < 604800) {
        const daysAgo = Math.floor(secondsPast / 86400);
        return `${daysAgo} days(s) ago`;
    }
    if (secondsPast < 2628000) {
        const weeksAgo = Math.floor(secondsPast / 604800);
        return `${weeksAgo} week(s) ago`;
    }
    if (secondsPast < 31536000) {
        const monthsAgo = Math.floor(secondsPast / 2628000);
        return `${monthsAgo} month(s) ago`;
    }
    const yearsAgo = Math.floor(secondsPast / 31536000);
    return `${yearsAgo} year(s) ago`;
}

function getGalleryPageData(req) {
    const page = Number(req.query.page) || 0;
    const subfolder = req.params.subfolder || "";
    const itemsPerPage = Number(req.query.itemsPerPage) || 20;

    const imageOutputPath = global.config.output_dir;

    const targetPath = path.join(imageOutputPath, subfolder);

    if (!fs.existsSync(targetPath)) {
        return { error: "Invalid subfolder path." };
    }

    const files = fs.readdirSync(targetPath);

    const filteredFiles = files
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            const isFileImage = ['.jpg', '.jpeg', '.png', '.ppm', '.bmp', '.pgm', '.tif', '.tiff', '.webp'].includes(ext);

            return isFileImage;
        })
        .map(file => {
            const mtime = fs.statSync(path.join(targetPath, file)).mtime.getTime();

            return {
                path: `/comfyui/image?filename=${file}&subfolder=${subfolder}&type=output`,
                time: mtime,
                timeText: getRelativeTimeText(mtime)
            }
        })
        .sort((a, b) => b.time - a.time);

    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    const subfolders = fs.readdirSync(imageOutputPath).filter(item =>
        fs.statSync(path.join(imageOutputPath, item)).isDirectory()
    );

    const totalPages = Math.floor(filteredFiles.length / itemsPerPage);
    const prevPage = page - 1 >= 0 ? page - 1 : 0;
    const nextPage = page + 1 <= totalPages ? page + 1 : totalPages;

    return { scanned: { subfolders: subfolders, images: paginatedFiles }, pageInfo: { prevPage: prevPage, currentPage: page, nextPage: nextPage, totalPages: totalPages } };
}

module.exports = {
    getGalleryPageData,
};
