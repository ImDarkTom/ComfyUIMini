export interface EditInputBase {
    nodeId: string;
    inputName: string;
    title: string;
    default: string;
}

export interface EditInputArray extends EditInputBase {
    type: 'ARRAY';
    list: string[];
}

export interface EditInputNonArray extends EditInputBase {
    type: 'STRING' | 'INT' | 'FLOAT';
    list?: never;
}

export type EditInput = EditInputArray | EditInputNonArray;

export interface EditPageData {
    title: string;
    description: string;
    inputs: EditInput[];
    theme: string;
}