export interface HistoryResponse {
    [promptId: string]: {
        outputs: {
            [nodeId: string]: {
                images: ImageInfo[];
            }
        }
    }
}

export interface ImageInfo {
    filename: string;
    subfolder: string;
    type: "output" | "input" | "temp";
}