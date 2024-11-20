import { clearAllSavedInputValues } from '../modules/savedInputValues.js';

const themeSelectElem = document.getElementById('select-theme') as HTMLSelectElement;
const saveGalleryItemsPerPageButton = document.getElementById('set-gallery-items-per-page') as HTMLButtonElement;
const clearSavedInputValuesButton = document.getElementById('clear-saved-input-values') as HTMLButtonElement;

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
        openPopupWindow(responseText);
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
        openPopupWindow(responseJson.message);
    } else {
        openPopupWindow(responseJson.error);
    }
});

clearSavedInputValuesButton.addEventListener('click', () => {
    try {
        clearAllSavedInputValues();
        openPopupWindow('Cleared all saved input values.');
    } catch (error) {
        openPopupWindow('An error occured while clearing saved input values.');
    }
});
