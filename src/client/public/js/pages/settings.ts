async function changeTheme(selectElement: HTMLSelectElement) {
    const selectedTheme = selectElement.value;

    const response = await fetch(`/setsetting/theme?theme=${selectedTheme}`);

    const responseText = await response.text();

    if (response.status === 200) {
        location.reload();
    } else {
        openPopupWindow(responseText);
    }
}

async function setGalleryItemsPerPage(inputElement: HTMLInputElement) {
    const galleryItemsPerPage = inputElement.value;

    const response = await fetch(`/setsetting/galleryitemsperpage?count=${galleryItemsPerPage}`);
    const responseJson = await response.json();

    openPopupWindow(responseJson.message);
}

function clearSavedInputValues() {
    localStorage.setItem('savedInputs', JSON.stringify({}));

    openPopupWindow('Saved input values cleared.');
}
