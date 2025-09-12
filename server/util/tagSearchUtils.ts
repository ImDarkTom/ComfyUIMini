import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { CsvValidator, type CsvValidationResult } from './csvValidator';
import { getCsvWhitelist, isValidationEnabled, getCsvPath } from './configLoader';

export interface TagSuggestion {
    tag: string;
    isAlias: boolean;
    postCount: number;
    matchedAlias?: string;
}

class TagSearcher {
    private tagsFilePath: string;
    private isFileChecked = false;
    private fileExists = false;
    private isValidationChecked = false;
    private validationResult: CsvValidationResult | null = null;

    constructor() {
        this.tagsFilePath = getCsvPath('tags.csv');
    }

    /**
     * Checks if the tags file exists and is whitelisted
     */
    private checkFileExists(): boolean {
        if (!this.isFileChecked) {
            this.fileExists = fs.existsSync(this.tagsFilePath);
            this.isFileChecked = true;
            
            if (this.fileExists) {
                // Check if file is whitelisted
                const fileName = path.basename(this.tagsFilePath);
                const whitelist = getCsvWhitelist();
                
                if (!whitelist.includes(fileName)) {
                    console.warn(`CSV file "${fileName}" is not in the whitelist. Allowed files:`, whitelist);
                    this.fileExists = false;
                }
            }
        }
        return this.fileExists;
    }

    /**
     * Validates the CSV file if validation is enabled
     */
    private validateFile(): CsvValidationResult | null {
        if (!this.isValidationChecked) {
            const validationEnabled = isValidationEnabled();
            
            if (validationEnabled && this.checkFileExists()) {
                this.validationResult = CsvValidator.validateFile(this.tagsFilePath);
                
                if (!this.validationResult.isValid) {
                    console.error('CSV validation failed:', this.validationResult.errors);
                } else if (this.validationResult.warnings.length > 0) {
                    console.warn('CSV validation warnings:', this.validationResult.warnings);
                }
            }
            
            this.isValidationChecked = true;
        }
        
        return this.validationResult;
    }

    /**
     * Searches for tags matching the query string
     */
    public async searchTags(query: string, maxResults: number = 10): Promise<TagSuggestion[]> {
        if (!this.checkFileExists()) {
            console.warn('Tags file not found or not whitelisted at:', this.tagsFilePath);
            return [];
        }

        // Validate file if validation is enabled
        const validationResult = this.validateFile();
        if (validationResult && !validationResult.isValid) {
            console.error('Cannot search tags: CSV validation failed');
            return [];
        }

        if (!query || query.length < 2) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        // Also search for underscore version if spaces are provided, and vice versa
        const alternateSearchTerm = searchTerm.includes('_') 
            ? searchTerm.replace(/_/g, ' ')
            : searchTerm.replace(/ /g, '_');
        
        const results: TagSuggestion[] = [];
        const seenTags = new Set<string>();

        return new Promise((resolve, reject) => {
            const fileStream = createReadStream(this.tagsFilePath);
            const rl = createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            rl.on('line', (line) => {
                if (results.length >= maxResults) {
                    rl.close();
                    return;
                }

                const match = this.parseCsvLine(line, results.length + 1);
                if (!match) return;

                const { mainTag, postCount, aliases } = match;

                // Check main tag against both search terms
                const mainTagLower = mainTag.toLowerCase();
                if ((mainTagLower.startsWith(searchTerm) || mainTagLower.startsWith(alternateSearchTerm)) && !seenTags.has(mainTag)) {
                    results.push({
                        tag: mainTag,
                        isAlias: false,
                        postCount
                    });
                    seenTags.add(mainTag);
                }

                // Check aliases against both search terms
                if (results.length < maxResults) {
                    for (const alias of aliases) {
                        const aliasLower = alias.toLowerCase();
                        let matchedAlias: string | undefined = undefined;
                        
                        if (aliasLower.startsWith(searchTerm)) {
                            matchedAlias = alias;
                        } else if (aliasLower.startsWith(alternateSearchTerm)) {
                            matchedAlias = alias;
                        }
                        
                        if (matchedAlias && !seenTags.has(mainTag)) {
                            results.push({
                                tag: mainTag, // Return main tag, not alias
                                isAlias: true,
                                postCount,
                                matchedAlias
                            });
                            seenTags.add(mainTag);
                            break; // Only add once per main tag
                        }
                    }
                }
            });

            rl.on('close', () => {
                // Sort by post count (descending) for better relevance
                results.sort((a, b) => b.postCount - a.postCount);
                resolve(results);
            });

            rl.on('error', (error) => {
                console.error('Error reading tags file:', error);
                reject(error);
            });

            // Set a timeout to prevent hanging
            setTimeout(() => {
                rl.close();
                resolve(results);
            }, 5000); // 5 second timeout
        });
    }

    /**
     * Parses a single CSV line and extracts tag information with validation
     */
    private parseCsvLine(line: string, lineNumber: number): { mainTag: string; postCount: number; aliases: string[] } | null {
        if (!line.trim()) return null;

        try {
            // Use the validated CSV parser
            const parsedData = CsvValidator.parseCsvLine(line, lineNumber);
            if (!parsedData) return null;

            return {
                mainTag: parsedData.mainTag,
                postCount: parsedData.postCount,
                aliases: parsedData.aliases
            };
        } catch {
            return null;
        }
    }
}

// Export singleton instance
export const tagSearcher = new TagSearcher();
