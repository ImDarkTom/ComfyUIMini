export interface ProgressMessage {
    value: number;
    max: number;
}

export interface PreviewMessage {
    mimetype: string;
    image: string;
}

export type TotalImagesMessage = number;

export type FinishGenerationMessage = string[];