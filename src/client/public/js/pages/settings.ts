import { getConfig, setConfig } from '../common/configLoader.js';
import { openPopupWindow, PopupWindowType } from '../common/popupWindow.js';
import { clearAllSavedInputValues } from '../modules/savedInputValues.js';

const themeSelectElem = document.getElementById('select-theme') as HTMLSelectElement;
const saveGalleryItemsPerPageButton = document.getElementById('set-gallery-items-per-page') as HTMLButtonElement;
const clearSavedInputValuesButton = document.getElementById('clear-saved-input-values') as HTMLButtonElement;
const compensatePreviewSaturationCheckbox = document.getElementById(
    'compensate-preview-saturation'
) as HTMLInputElement;

const allTooltipElems = document.querySelectorAll('[data-tooltip]');

allTooltipElems.forEach((elem) => {
    elem.addEventListener('click', () => {
        openPopupWindow(PopupWindowType.INFO, (elem as HTMLElement).dataset.tooltip ?? '');
    });
});

themeSelectElem.addEventListener('change', async (e) => {
    if (!e.target) {
        console.error('No target found for theme select element.');
        return;
    }

    const selectedTheme = (e.target as HTMLSelectElement).value;

    const response = await fetch(`/setsetting/theme?theme=${selectedTheme}`);

    const responseText = await response.text();

    if (response.status === 200) {
        location.reload();
    } else {
        openPopupWindow(PopupWindowType.ERROR, responseText);
    }
});

saveGalleryItemsPerPageButton.addEventListener('click', async (e) => {
    if (!e.target) {
        console.error('No target found for save gallery items per page button.');
        return;
    }

    const inputElement = document.getElementById('gallery-items-per-page') as HTMLInputElement;
    const galleryItemsPerPage = inputElement.value;

    const response = await fetch(`/setsetting/galleryitemsperpage?count=${galleryItemsPerPage}`);
    const responseJson = await response.json();

    if (response.status === 200) {
        openPopupWindow(PopupWindowType.INFO, responseJson.message);
    } else {
        openPopupWindow(PopupWindowType.ERROR, responseJson.error);
    }
});

clearSavedInputValuesButton.addEventListener('click', () => {
    try {
        clearAllSavedInputValues();
        openPopupWindow(PopupWindowType.INFO, 'Cleared all saved input values.');
    } catch (error) {
        openPopupWindow(PopupWindowType.ERROR, 'An error occured while clearing saved input values', error);
    }
});

compensatePreviewSaturationCheckbox.addEventListener('change', () => {
    const checked = compensatePreviewSaturationCheckbox.checked;

    setConfig('workflow.compensatePreviewSaturation', checked);
});

function loadConfigsIntoPage() {
    const saturationCompensationConfig = getConfig('workflow.compensatePreviewSaturation') as boolean;

    if (saturationCompensationConfig === true || saturationCompensationConfig === undefined) {
        compensatePreviewSaturationCheckbox.checked = true;
    }
}

loadConfigsIntoPage();
