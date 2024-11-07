export interface ObjectInfoPartial {
    [nodeType: string]: {
        input: {
            required?: {
                [inputName: string]: any;
            };
            optional?: {
                [inputName: string]: any;
            }
        };
    };
}

export interface NormalisedInputInfo {
    type: "ARRAY" | "STRING" | "INT" | "FLOAT";
    userAccessible: boolean;
    data: string[];
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
