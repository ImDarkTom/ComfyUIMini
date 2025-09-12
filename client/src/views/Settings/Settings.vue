<script setup lang="ts">
import TextSetting from './components/TextSetting.vue';
import CheckboxSetting from './components/CheckboxSetting.vue';
import { useConfigStore } from '../../stores/config';
import SelectionSetting from './components/SelectionSetting.vue';

const config = useConfigStore();
</script>

<template>
    <div class="size-full flex flex-col">
        <h1 class="text-3xl font-bold mb-2">Settings</h1>

        <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-semibold">ComfyUI URL</h2>
            <span>URL preview: <span class="text-text">{{ config.comfyUiUrl }}</span></span>
            <span>WS URL preview: <span class="text-text">{{ config.comfyUiWs }}</span></span>
            <TextSetting label="Base ComfyUI URL" v-model="config.comfyUi.urlConfig.base"
                placeholder="localhost:8188" />
            <CheckboxSetting label="Secure connection" v-model="config.comfyUi.urlConfig.secure" />
            <CheckboxSetting label="Custom URLs" v-model="config.comfyUi.urlConfig.custom" />
            <div class="flex flex-col gap-2" v-if="config.comfyUi.urlConfig.custom">
                <TextSetting label="ComfyUI URL" v-model="config.comfyUi.urlConfig.customUrl" />
                <TextSetting label="ComfyUI Websocket URL" v-model="config.comfyUi.urlConfig.customWs" />
            </div>
            <h2 class="text-2xl font-semibold">UI</h2>
            <CheckboxSetting label="UI Animations" v-model="config.ui.animations" />
            <SelectionSetting 
                label="Transition Speed" 
                :options="[[0, 'None (0ms)'], [75, 'Fast'], [125, 'Normal'], [175, 'Slow']]" 
                v-model="config.ui.transitionSpeedMs"
                @update:model-value="config.loadTransitionSpeed()"
             />
            <h2 class="text-2xl font-semibold">Tag Autocomplete</h2>
            <CheckboxSetting label="Enable tag autocomplete" v-model="config.tagAutocomplete.enabled" />
            <CheckboxSetting label="Use underscores in tags" v-model="config.tagAutocomplete.useUnderscores" />
            <TextSetting 
                label="CSV Whitelist (comma-separated)" 
                :model-value="config.tagAutocomplete.csvWhitelist.join(', ')"
                @update:model-value="config.tagAutocomplete.csvWhitelist = $event.split(',').map(s => s.trim()).filter(s => s)"
                placeholder="tags.csv"
            />
            <CheckboxSetting label="Enable CSV validation" v-model="config.tagAutocomplete.validation.enabled" />
        </div>
    </div>
</template>