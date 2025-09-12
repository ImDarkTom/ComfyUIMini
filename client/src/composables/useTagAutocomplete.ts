import { ref, computed } from 'vue';
import { useConfigStore } from '../stores/config';

export interface TagSuggestion {
    tag: string;
    isAlias: boolean;
    matchedAlias?: string;
}

export interface AutocompleteItem {
    text: string;
    isSecondary?: boolean;
    isAlias?: boolean;
    originalSearch?: string;
}

class TagAutocompleteService {
    private isServiceAvailable = ref(true);

    constructor() {
        this.checkServiceHealth();
    }

    /**
     * Checks if the tag search service is available
     */
    private async checkServiceHealth(): Promise<void> {
        try {
            const response = await fetch('/api/tags/health');
            const data = await response.json();
            this.isServiceAvailable.value = data.status === 'ok';
        } catch (error) {
            console.warn('Tag search service not available:', error);
            this.isServiceAvailable.value = false;
        }
    }

    /**
     * Gets tag suggestions based on partial input using server-side search
     */
    public async getSuggestions(input: string, maxResults: number = 10): Promise<TagSuggestion[]> {
        if (!this.isServiceAvailable.value || !input.trim() || input.length < 2) {
            return [];
        }
        
        try {
            // Get underscore setting from config store
            const configStore = useConfigStore();
            const useUnderscores = configStore.tagAutocomplete.useUnderscores;
            
            const response = await fetch(`/api/tags/search?q=${encodeURIComponent(input)}&limit=${maxResults}&underscores=${useUnderscores}`);
            
            if (!response.ok) {
                console.error('Tag search failed:', response.statusText);
                return [];
            }
            
            const data = await response.json();
            return data.results.map((result: {tag: string, isAlias: boolean, matchedAlias?: string}) => ({
                tag: result.tag,
                isAlias: result.isAlias,
                matchedAlias: result.matchedAlias
            }));
            
        } catch (error) {
            console.error('Error fetching tag suggestions:', error);
            return [];
        }
    }

    /**
     * Checks if the service is ready
     */
    public isReady(): boolean {
        return this.isServiceAvailable.value;
    }
}

// Global instance
const tagAutocompleteService = new TagAutocompleteService();

export function useTagAutocomplete() {
    const suggestions = ref<TagSuggestion[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const autocompleteItems = computed<AutocompleteItem[]>(() => 
        suggestions.value.map((suggestion: TagSuggestion) => ({
            text: suggestion.tag,
            isSecondary: suggestion.isAlias,
            isAlias: suggestion.isAlias,
            originalSearch: suggestion.matchedAlias || (suggestion.isAlias ? '' : undefined)
        }))
    );

    async function searchTags(query: string, maxResults: number = 8): Promise<void> {
        if (!tagAutocompleteService.isReady()) {
            suggestions.value = [];
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            suggestions.value = await tagAutocompleteService.getSuggestions(query, maxResults);
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Unknown error';
            suggestions.value = [];
        } finally {
            loading.value = false;
        }
    }

    function clearSuggestions(): void {
        suggestions.value = [];
        error.value = null;
    }

    return {
        suggestions: computed(() => suggestions.value),
        autocompleteItems,
        loading: computed(() => loading.value),
        error: computed(() => error.value),
        isReady: computed(() => tagAutocompleteService.isReady()),
        searchTags,
        clearSuggestions
    };
}
