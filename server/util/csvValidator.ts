import fs from 'fs';
import { getConfig } from './configLoader';

export interface CsvValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    lineCount: number;
    maxLineLength: number;
}

export interface CsvLineData {
    mainTag: string;
    postCount: number;
    aliases: string[];
    lineNumber: number;
}

/**
 * Simple CSV validator for basic structure and security checks
 */
export class CsvValidator {
    // Default values (used as fallback if config is not available)
    private static readonly DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static readonly DEFAULT_MAX_LINES = 1000000; // 1M lines
    private static readonly DEFAULT_MAX_LINE_LENGTH = 10000; // 10KB per line
    
    // Basic malicious content patterns
    private static readonly MALICIOUS_PATTERNS = [
        /<script[^>]*>/i,
        /javascript:/i,
        /vbscript:/i,
        /onload\s*=/i,
        /onerror\s*=/i,
        /onclick\s*=/i,
        /eval\s*\(/i,
        /function\s*\(/i,
        /\.\.\//, // Path traversal
        /\.\.\\/, // Windows path traversal
    ];
    
    /**
     * Quick validation of CSV file for basic structure and security
     */
    public static validateFile(filePath: string): CsvValidationResult {
        const result: CsvValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            lineCount: 0,
            maxLineLength: 0
        };

        try {
            // Get configuration values
            const maxFileSizeConfig = getConfig('tagAutocomplete.validation.maxFileSize');
            const maxLinesConfig = getConfig('tagAutocomplete.validation.maxLines');
            const maxLineLengthConfig = getConfig('tagAutocomplete.validation.maxLineLength');
            
            const maxFileSize = (typeof maxFileSizeConfig === 'number' ? maxFileSizeConfig : this.DEFAULT_MAX_FILE_SIZE);
            const maxLines = (typeof maxLinesConfig === 'number' ? maxLinesConfig : this.DEFAULT_MAX_LINES);
            const maxLineLength = (typeof maxLineLengthConfig === 'number' ? maxLineLengthConfig : this.DEFAULT_MAX_LINE_LENGTH);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                result.errors.push('File does not exist');
                result.isValid = false;
                return result;
            }
            
            // Check file size
            const stats = fs.statSync(filePath);
            if (stats.size > maxFileSize) {
                result.errors.push(`File too large: ${stats.size} bytes (max: ${maxFileSize})`);
                result.isValid = false;
                return result;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split(/\r?\n/);
            result.lineCount = lines.length;

            if (lines.length > maxLines) {
                result.errors.push(`Too many lines: ${lines.length} (max: ${maxLines})`);
                result.isValid = false;
                return result;
            }

            // Quick malicious content check - just scan the entire file content
            for (const pattern of this.MALICIOUS_PATTERNS) {
                if (pattern.test(content)) {
                    result.errors.push('Potentially malicious content detected in file');
                    result.isValid = false;
                    break;
                }
            }

            // Basic structure check - just verify it looks like CSV
            let validLines = 0;
            for (let i = 0; i < Math.min(100, lines.length); i++) { // Only check first 100 lines
                const line = lines[i].trim();
                if (!line) continue;

                result.maxLineLength = Math.max(result.maxLineLength, line.length);

                // Check line length
                if (line.length > maxLineLength) {
                    result.errors.push(`Line ${i + 1}: Too long (${line.length} chars, max: ${maxLineLength})`);
                    result.isValid = false;
                    continue;
                }

                // Basic CSV structure check: should have at least 3 commas
                const commaCount = (line.match(/,/g) || []).length;
                if (commaCount >= 3) {
                    validLines++;
                }
            }

            // If we have some valid lines, consider it good enough
            if (validLines === 0 && lines.length > 0) {
                result.warnings.push('File may not be in expected CSV format');
            }

        } catch (error) {
            result.errors.push(`File read error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.isValid = false;
        }

        return result;
    }
    
    /**
     * Safely parses a CSV line with validation - handles multiple formats
     */
    public static parseCsvLine(line: string, lineNumber: number): CsvLineData | null {
        if (!line.trim()) return null;
        
        try {
            // Format 1: Quoted aliases - mainTag,aliasCount,postCount,"alias1,alias2,alias3"
            let match = line.match(/^([^,]+),(\d+),(\d+),"([^"]*)"$/);
            if (match) {
                const [, mainTag, , postCountStr, aliasesStr] = match;
                const aliases = aliasesStr ? aliasesStr.split(',').map(a => a.trim()).filter(a => a) : [];
                const postCount = parseInt(postCountStr);
                
                if (isNaN(postCount) || postCount < 0) return null;
                
                return {
                    mainTag: mainTag.trim(),
                    postCount,
                    aliases,
                    lineNumber
                };
            }
            
            // Format 2: Unquoted single alias - mainTag,aliasCount,postCount,alias1
            match = line.match(/^([^,]+),(\d+),(\d+),([^,]+)$/);
            if (match) {
                const [, mainTag, , postCountStr, alias] = match;
                const postCount = parseInt(postCountStr);
                
                if (isNaN(postCount) || postCount < 0) return null;
                
                return {
                    mainTag: mainTag.trim(),
                    postCount,
                    aliases: [alias.trim()],
                    lineNumber
                };
            }
            
            // Format 3: Empty aliases - mainTag,aliasCount,postCount,
            match = line.match(/^([^,]+),(\d+),(\d+),$/);
            if (match) {
                const [, mainTag, , postCountStr] = match;
                const postCount = parseInt(postCountStr);
                
                if (isNaN(postCount) || postCount < 0) return null;
                
                return {
                    mainTag: mainTag.trim(),
                    postCount,
                    aliases: [],
                    lineNumber
                };
            }
            
            return null;
        } catch {
            return null;
        }
    }
}
