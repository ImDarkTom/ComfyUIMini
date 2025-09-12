<script setup lang="ts">
import { ref, computed } from 'vue';
import randomNumInRange from '../../../utils/randomNumInRange';
import { FaPlus } from 'vue-icons-plus/fa';
import { nanoid } from 'nanoid';
import IncrementToggles from './IncrementToggles.vue';
import TagInput from './TagInput.vue';
import AutocompleteDropdown from '../../../components/AutocompleteDropdown.vue';

const props = defineProps<{
    comfyInputInfo: any;
    defaultValue: any;
    appInputInfo: AppWorkflowInputInfo;
}>();

const numberInfo = props.comfyInputInfo[1];

const inputValue = ref<any>(props.appInputInfo.lastValue ?? props.defaultValue ?? props.comfyInputInfo[1].default ?? undefined);

function getValue() {
    if (props.appInputInfo.features?.increment_toggles) {
        switch (props.appInputInfo.features.increment_toggles.mode) {
            case 'random':
                inputValue.value = randomNumInRange(numberInfo.min ?? 0, numberInfo.max ?? 100, numberInfo.step ?? 1);
                break;
            case 'increment':
                inputValue.value++;
                break;
        }
    }

    return inputValue.value;
}

defineExpose({
    getValue
});

const incrementTogglesId = nanoid();
const randomToggleId = `random-toggle${incrementTogglesId}`;
const incrementToggleId = `increment-toggle${incrementTogglesId}`;
const fixedToggleId = `fixed-toggle${incrementTogglesId}`;

const showExtraMenu = ref(false);

// Check if this is a prompt input that should have autocomplete
const isPromptInput = computed(() => {
    const title = props.appInputInfo.title.toLowerCase();
    const promptKeywords = ['prompt', 'negative prompt', 'positive prompt', 'text'];
    return promptKeywords.some(keyword => title.includes(keyword));
});
</script>

<template>
    <div class="w-full *:bg-surface *:p-2 *:rounded-lg *:w-full">
        <div v-if="comfyInputInfo[0] === 'INT' || comfyInputInfo[0] === 'FLOAT'" class="flex flex-row gap-2">
            <input class="w-full outline-none" type="number" v-model="inputValue" :min="numberInfo.min ?? undefined"
                :max="numberInfo.max ?? undefined" :step="numberInfo.step ?? undefined"
                :title="numberInfo.tooltip ?? undefined" />
            <button v-if="appInputInfo.features" @click="showExtraMenu = !showExtraMenu"
                class="rounded-sm pointer-coarse:scale-150" :class="{ 'bg-surface-light': showExtraMenu }">
                <FaPlus class="box-border p-1 pointer-coarse:p-1.5" />
            </button>
        </div>

        <template v-else-if="comfyInputInfo[0] === 'STRING'">
            <input type="text" v-if="!comfyInputInfo[1].multiline" v-model="inputValue"
                :title="comfyInputInfo[1].tooltip ?? undefined" />

            <AutocompleteDropdown 
                v-else-if="!appInputInfo.features?.tag_input && isPromptInput" 
                v-model="inputValue"
                :placeholder="comfyInputInfo[1].tooltip ?? undefined"
            />

            <textarea v-else-if="!appInputInfo.features?.tag_input" :title="comfyInputInfo[1].tooltip ?? undefined"
                v-model="inputValue">{{ defaultValue ?? comfyInputInfo[1].default ?? '' }}</textarea>

            <TagInput v-else v-model="inputValue" :default="defaultValue ?? comfyInputInfo[1].default ?? ''"></TagInput>
        </template>

        <select v-else :title="comfyInputInfo[1].tooltip ?? undefined" v-model="inputValue">
            <option v-for="item in comfyInputInfo[0]" :key="item" :value="item">{{ item }}</option>
        </select>
        <div v-if="appInputInfo.features?.increment_toggles && showExtraMenu"
            class="mt-2 flex flex-row gap-2 items-center">
            <IncrementToggles :for="randomToggleId" text="Random" icon="🎲">
                <input type="radio" :id="randomToggleId" value="random" class="sr-only"
                    v-model="appInputInfo.features.increment_toggles.mode">
            </IncrementToggles>

            <IncrementToggles :for="incrementToggleId" text="Increment" icon="🔢">
                <input type="radio" :id="incrementToggleId" value="increment" class="sr-only"
                    v-model="appInputInfo.features.increment_toggles.mode">
            </IncrementToggles>

            <IncrementToggles :for="fixedToggleId" text="Fixed" icon="🔒">
                <input type="radio" :id="fixedToggleId" value="fixed" class="sr-only"
                    v-model="appInputInfo.features.increment_toggles.mode">
            </IncrementToggles>
        </div>
    </div>
</template>