<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useTagAutocomplete } from '../composables/useTagAutocomplete';

interface Props {
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'input', event: Event): void;
}

withDefaults(defineProps<Props>(), {
    placeholder: '',
    disabled: false
});

const emit = defineEmits<Emits>();

const { autocompleteItems, loading, searchTags, clearSuggestions } = useTagAutocomplete();

const textareaRef = ref<HTMLTextAreaElement>();
const dropdownRef = ref<HTMLDivElement>();
const isVisible = ref(false);
const selectedIndex = ref(-1);
const currentWord = ref('');
const currentWordStart = ref(0);
const currentWordEnd = ref(0);

const shouldShowDropdown = computed(() => isVisible.value && autocompleteItems.value.length > 0);

function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const cursorPos = target.selectionStart || 0;
    const text = target.value;
    
    // Find the current word being typed (tag between commas)
    const beforeCursor = text.substring(0, cursorPos);
    const afterCursor = text.substring(cursorPos);
    
    // Look for tag boundaries (comma-separated, allowing spaces within tags)
    const wordStartMatch = beforeCursor.match(/(?:^|,)\s*([^,]*)$/);
    const wordEndMatch = afterCursor.match(/^([^,]*)/);
    
    if (!wordStartMatch) {
        hideDropdown();
        return;
    }
    
    currentWord.value = (wordStartMatch[1] + (wordEndMatch ? wordEndMatch[1] : '')).trim();
    currentWordStart.value = cursorPos - wordStartMatch[1].length;
    currentWordEnd.value = cursorPos + (wordEndMatch ? wordEndMatch[1].length : 0);
    
    if (currentWord.value.length < 2) {
        hideDropdown();
        return;
    }
    
    // Trigger suggestion request
    searchTags(currentWord.value);
    isVisible.value = true;
    selectedIndex.value = -1;
}

function handleKeydown(event: KeyboardEvent) {
    if (!shouldShowDropdown.value) return;
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedIndex.value = Math.min(selectedIndex.value + 1, autocompleteItems.value.length - 1);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
            break;
            
        case 'Tab':
        case 'Enter':
            event.preventDefault();
            if (selectedIndex.value >= 0) {
                selectItem(selectedIndex.value);
            }
            break;
            
        case 'Escape':
            event.preventDefault();
            hideDropdown();
            break;
    }
}

function handleBlur() {
    // Delay hiding to allow for clicks on dropdown items
    setTimeout(() => hideDropdown(), 150);
}

function selectItem(index: number) {
    if (index < 0 || index >= autocompleteItems.value.length) return;
    
    const selectedSuggestion = autocompleteItems.value[index];
    const textarea = textareaRef.value;
    if (!textarea) return;
    
    const text = textarea.value;
    const cursorPos = textarea.selectionStart || 0;
    
    // Find the current tag boundaries (comma-separated)
    const beforeCursor = text.substring(0, cursorPos);
    const afterCursor = text.substring(cursorPos);
    
    const wordStartMatch = beforeCursor.match(/(?:^|,)(\s*)([^,]*)$/);
    const wordEndMatch = afterCursor.match(/^([^,]*)/);
    
    if (!wordStartMatch) return;
    
    const partialTag = wordStartMatch[2]; // The partial tag being typed
    
    const wordStart = cursorPos - partialTag.length;
    const wordEnd = cursorPos + (wordEndMatch ? wordEndMatch[1].length : 0);
    
    // Get the remaining text as-is
    const remainingText = text.substring(wordEnd);
    
    const newText = text.substring(0, wordStart) + 
                   selectedSuggestion.text + ',' +
                   remainingText;
    
    textarea.value = newText;
    
    // Position cursor after the inserted tag and comma
    const newCursorPos = wordStart + selectedSuggestion.text.length + 1;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Clear the suggestions and hide dropdown
    clearSuggestions();
    hideDropdown();
    
    // Emit the change
    emit('update:modelValue', newText);
    emit('input', new Event('input', { bubbles: false }));
}

function hideDropdown() {
    isVisible.value = false;
    selectedIndex.value = -1;
}

function handleItemClick(index: number) {
    selectItem(index);
}

onMounted(() => {
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.addEventListener('input', handleInput);
            textareaRef.value.addEventListener('keydown', handleKeydown);
            textareaRef.value.addEventListener('blur', handleBlur);
        }
    });
});

onUnmounted(() => {
    if (textareaRef.value) {
        textareaRef.value.removeEventListener('input', handleInput);
        textareaRef.value.removeEventListener('keydown', handleKeydown);
        textareaRef.value.removeEventListener('blur', handleBlur);
    }
});
</script>

<template>
    <div class="relative w-full">
        <textarea
            ref="textareaRef"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            class="w-full bg-surface p-2 rounded-lg outline-none resize-none"
            rows="4"
        />
        
        <!-- Autocomplete Dropdown -->
        <div
            v-if="shouldShowDropdown"
            ref="dropdownRef"
            class="absolute top-full left-0 right-0 z-50 max-h-48 overflow-y-auto bg-surface border border-surface-light rounded-b-lg shadow-lg"
        >
            <div
                v-for="(item, index) in autocompleteItems"
                :key="index"
                :class="[
                    'px-3 py-2 cursor-pointer text-sm transition-colors',
                    index === selectedIndex ? 'bg-surface-light' : 'hover:bg-surface-light',
                    item.isSecondary ? 'text-text-secondary italic' : 'text-text',
                    item.isAlias ? 'bg-orange-100' : ''
                ]"
                @mousedown.prevent="handleItemClick(index)"
                @click.prevent="handleItemClick(index)"
            >
                <span v-if="item.isAlias && item.originalSearch" class="font-semibold">
                    {{ item.text }}
                    <span class="text-text-secondary italic text-xs">
                        (from "{{ item.originalSearch }}")
                    </span>
                </span>
                <span v-else>{{ item.text }}</span>
            </div>
            
            <div v-if="loading" class="px-3 py-2 text-text-secondary text-sm">
                Loading...
            </div>
        </div>
    </div>
</template>
