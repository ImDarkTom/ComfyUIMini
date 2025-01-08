import getHistory from "../getHistory";

async function getOutputImages(promptId: string) {
    async function generateProxiedImageUrl(filename: string, subfolder: string, folderType: string) {
        const params = new URLSearchParams({ filename, subfolder, type: folderType });

        return `/comfyui/image?${params.toString()}`;
    }

    const outputImages: Record<string, string[]> = {};

    const history = await getHistory(promptId);

    const historyOutputs = history[promptId].outputs;

    for (const nodeId in historyOutputs) {
        const nodeOutput = historyOutputs[nodeId];
        if (nodeOutput.images) {
            const imageUrls = await Promise.all(
                nodeOutput.images.map(async (image) => {
                    return await generateProxiedImageUrl(image.filename, image.subfolder, image.type);
                })
            );
            outputImages[nodeId] = imageUrls;
        }
    }

    return outputImages;
}

export default getOutputImages;