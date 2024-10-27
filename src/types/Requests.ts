import { Request } from "express";

export interface RequestWithTheme extends Request {
    theme?: string;
}