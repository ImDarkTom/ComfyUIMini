export interface ObjectInfoPartial {
    [nodeType: string]: {
        input: {
            required: {
                [inputName: string]: any;
            };
        };
    };
}

export interface NormalisedInputInfo {
    type: string;
    userAccessible: boolean;
    data: object;
    default?: string;
    tooltip?: string;
    imageUpload?: boolean;
    min?: number;
    max?: number;
    step?: number;
    multiline?: boolean;
    dynamicPrompts?: boolean;
}

export interface ProcessedObjectInfo {
    [nodeName: string]: {
        [inputName: string]: NormalisedInputInfo;
    };
}
