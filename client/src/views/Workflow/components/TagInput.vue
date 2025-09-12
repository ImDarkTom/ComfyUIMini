<script setup lang="ts">
import { computed, ref, nextTick } from 'vue';
import { VueDraggableNext } from 'vue-draggable-next';
import { AiOutlineClose } from 'vue-icons-plus/ai';
import { FaPlus, FaTrash } from 'vue-icons-plus/fa';
import { TbArrowBigDownFilled, TbArrowBigUpFilled } from 'vue-icons-plus/tb';
import { useTagAutocomplete } from '../../../composables/useTagAutocomplete';

const props = defineProps<{
    modelValue: string;
}>();

const splitTags = computed({
    get: () => {
        let value = props.modelValue.trim();
        // Remove trailing comma or comma + space
        value = value.replace(/(, ?)+$/, '');
        const list = value.split(',').map(item => item.trim());

        return list.length === 1 && list[0] === "" ? [] : list;
    },
    set: (newTags) => {
        emit('update:modelValue', newTags.join(', ') + (newTags.length ? ', ' : ''));
    }
});

const emit = defineEmits(['update:modelValue'])

const updateSplitTags = (newTags: string[]) => emit('update:modelValue', newTags.join(', ') + (newTags.length ? ', ' : ''));

const tagInputElem = ref<HTMLInputElement | null>(null);

const editingIndex = ref(-1);

// Autocomplete functionality
const { autocompleteItems, loading, searchTags, clearSuggestions } = useTagAutocomplete();
const showAutocomplete = ref(false);
const selectedAutocompleteIndex = ref(-1);

function handleSubmit() {
    const newValue = tagInputElem.value?.value.trim() || '';

    if (!newValue.trim()) {
        return;
    }

    if (editingIndex.value !== -1) {
        const tags = splitTags.value.slice();
        tags[editingIndex.value] = newValue;
        editingIndex.value = -1;

        updateSplitTags(tags);
    } else {
        emit('update:modelValue', `${props.modelValue}${newValue}, `);
    }

    tagInputElem.value!.value = "";
    hideAutocomplete();
}

function handleInput() {
    const inputValue = tagInputElem.value?.value.trim() || '';
    
    if (inputValue.length >= 2) {
        searchTags(inputValue);
        showAutocomplete.value = true;
        selectedAutocompleteIndex.value = -1;
    } else {
        hideAutocomplete();
    }
}

function handleKeydown(event: KeyboardEvent) {
    if (!showAutocomplete.value || autocompleteItems.value.length === 0) return;
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedAutocompleteIndex.value = Math.min(selectedAutocompleteIndex.value + 1, autocompleteItems.value.length - 1);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            selectedAutocompleteIndex.value = Math.max(selectedAutocompleteIndex.value - 1, -1);
            break;
            
        case 'Tab':
        case 'Enter':
            event.preventDefault();
            if (selectedAutocompleteIndex.value >= 0) {
                selectAutocompleteItem(selectedAutocompleteIndex.value);
            } else {
                handleSubmit();
            }
            break;
            
        case 'Escape':
            event.preventDefault();
            hideAutocomplete();
            break;
    }
}

function selectAutocompleteItem(index: number) {
    if (index < 0 || index >= autocompleteItems.value.length) return;
    
    const selectedItem = autocompleteItems.value[index];
    if (tagInputElem.value) {
        tagInputElem.value.value = selectedItem.text;
        nextTick(() => {
            handleSubmit();
        });
    }
}

function hideAutocomplete() {
    showAutocomplete.value = false;
    selectedAutocompleteIndex.value = -1;
    clearSuggestions();
}

function handleBlur() {
    if (editingIndex.value !== -1) {
        editingIndex.value = -1;
        tagInputElem.value!.value = "";
    }
    // Delay hiding autocomplete to allow for clicks
    setTimeout(() => hideAutocomplete(), 150);
}


function editTag(tag: string, index: number) {
    tagInputElem.value!.value = tag;
    editingIndex.value = index;

    tagInputElem.value?.focus();
    tagInputElem.value?.select();
}

function removeItem(index: number) {
    const tags = splitTags.value.slice();
    tags.splice(index, 1);

    updateSplitTags(tags);

    if (editingIndex.value === index) {
        editingIndex.value = -1;
    }
}

function increaseWeight(index: number) {
    const tags = splitTags.value.slice();
    let tag = tags[index];

    const match = tag.match(/^\((.*):([0-9.]+)\)$/);
    if (match) {
        const baseTag = match[1];
        let weight = parseFloat(match[2]);
        weight = Math.round((weight + 0.1) * 100) / 100;

        if (weight === 1) {
            tags[index] = baseTag;
        } else {
            tags[index] = `(${baseTag}:${weight})`;
        }
    } else {
        tags[index] = `(${tag}:1.1)`;
    }

    updateSplitTags(tags);
}

function decreaseWeight(index: number) {
    const tags = splitTags.value.slice();
    let tag = tags[index];

    // Check if tag is already in the format (<tag>:<weight>)
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);
    if (match) {
        const baseTag = match[1];
        let weight = parseFloat(match[2]);
        weight = Math.round((weight - 0.1) * 100) / 100;

        if (weight === 1) {
            tags[index] = baseTag;
        } else {
            tags[index] = `(${baseTag}:${weight})`;
        }
    } else {
        tags[index] = `(${tag}:0.9)`;
    }

    updateSplitTags(tags);
}

function getTagWeightClass(tag: string) {
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);

    if (match) {
        let weight = parseFloat(match[2]);
        weight = (Math.round((weight / 2) * 100) / 100) + 0.1;

        if (weight < 0.61) {
            return '0px 0px 0.5rem 0px rgba(37, 194, 247, 1) inset';
        }

        return `0px 0px 0.5rem 0px rgba(247, 194, 37, ${weight}) inset`
    } else {
        return '0px 0px 0.5rem 0px rgba(37, 194, 247, 0) inset';
    }
}

function getTagOpacity(tag: string) {
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);

    if (match) {
        let weight = parseFloat(match[2]);
        weight = Math.round((weight) * 100);

        if (weight < 51) {
            return '50%';
        }

        return `${weight}%`;
    } else {
        return '100%';
    }
}

function getRawTag(tag: string) {
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);

    if (match) {
        return match[1];
    } else {
        return tag;
    }
}

function getTagWeight(tag: string) {
    const match = tag.match(/^\((.*):([0-9.]+)\)$/);

    if (match) {
        return parseFloat(match[2]);
    } else {
        return null;
    }
}

function clearTags() {
    if (confirm('Are you sure you want to clear tags for this field?')) {
        splitTags.value = []
    }
}

</script>

<template>
    <div class="flex flex-col">
        <VueDraggableNext v-if="splitTags.length > 0" v-model="splitTags" tag="ul" delay="300"
            class="flex flex-row flex-wrap gap-1">
            <transition-group name="tag-list" class="contents">
                <li v-for="(tag, index) in splitTags" :key="index">
                    <div class="bg-surface-light p-1 box-border select-none rounded-lg flex flex-row items-center justify-center transition-all duration-150 input-draggable-content group"
                        :class="{
                            'brightness-150': index === editingIndex
                        }" :style="{
                            'box-shadow': getTagWeightClass(tag),
                            opacity: getTagOpacity(tag),
                        }">
                        <div class="flex flex-row gap-1 md:hidden md:group-hover:flex ml-1">
                            <div @click.capture="removeItem(index)" class="cursor-pointer text-red-400 aspect-square p-1">
                                <AiOutlineClose />
                            </div>
                            <button @click="increaseWeight(index)"
                                class="cursor-pointer bg-surface p-1 rounded-md hover:brightness-110 active:brightness-125 active:scale-95 active:text-amber-300 transition-all duration-150">
                                <TbArrowBigUpFilled class="p-0.5" />
                            </button>
                            <button @click="decreaseWeight(index)"
                                class="cursor-pointer bg-surface p-1 rounded-md hover:brightness-110 active:brightness-125 active:scale-95 active:text-blue-300 transition-all duration-150">
                                <TbArrowBigDownFilled class="p-0.5" />
                            </button>
                        </div>
                        <span class="flex flex-row items-center justify-center gap-1">
                            <span @dblclick="editTag(tag, index)" class="p-1">
                                {{ getRawTag(tag) }}
                            </span>
                            <span v-if="getTagWeight(tag)" class="bg-surface rounded-md p-1">
                                {{ getTagWeight(tag) }}
                            </span>
                        </span>
                    </div>
                </li>
            </transition-group>
        </VueDraggableNext>

        <div v-else>
            Enter a keyword and press <kbd class="bg-surface-light px-1 rounded-sm">+</kbd> get started.
        </div>
        <div class="h-0.5 w-full bg-surface-light my-2"></div>
        <form @submit.prevent="handleSubmit" class="flex flex-row gap-2 relative">
            <button type="button" @click="clearTags"
                class="bg-surface-light text-red-300 p-2 rounded-lg cursor-pointer hover:brightness-110 active:brightness-125 active:scale-95 transition-all duration-150">
                <FaTrash class="p-0.5" />
            </button>
            <div class="relative w-full">
                <input 
                    type="text" 
                    ref="tagInputElem" 
                    class="bg-surface-light p-2 rounded-lg w-full"
                    placeholder="Keyword..." 
                    @blur="handleBlur"
                    @input="handleInput"
                    @keydown="handleKeydown"
                />
                
                <!-- Autocomplete Dropdown -->
                <div
                    v-if="showAutocomplete && autocompleteItems.length > 0"
                    class="absolute top-full left-0 right-0 z-50 max-h-48 overflow-y-auto bg-surface border border-surface-light rounded-b-lg shadow-lg"
                >
                    <div
                        v-for="(item, index) in autocompleteItems"
                        :key="index"
                        :class="[
                            'px-3 py-2 cursor-pointer text-sm transition-colors',
                            index === selectedAutocompleteIndex ? 'bg-surface-light' : 'hover:bg-surface-light',
                            item.isSecondary ? 'text-text-secondary italic' : 'text-text',
                            item.isAlias ? 'bg-orange-100' : ''
                        ]"
                        @mousedown.prevent="selectAutocompleteItem(index)"
                        @click.prevent="selectAutocompleteItem(index)"
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
            <button type="submit"
                class="bg-surface-light p-2 rounded-lg cursor-pointer hover:brightness-110 active:brightness-125 active:scale-95 transition-all duration-150">
                <FaPlus />
            </button>
        </form>
    </div>
</template>