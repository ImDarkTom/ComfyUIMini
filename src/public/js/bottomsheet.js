const bottomSheetContainer = document.querySelector('.bottom-sheet-container');
const bottomSheetBackgroundOverlay = document.querySelector('.bottom-sheet-bg-overlay');
const bottomSheetEntriesList = document.querySelector('.bottom-sheet-entries-list');

function closeBottomSheet() {
    bottomSheetContainer.classList.add('slide-down');
    bottomSheetBackgroundOverlay.classList.add('fade-out');

    setTimeout(() => {
        bottomSheetContainer.classList.add('disabled');
        bottomSheetBackgroundOverlay.classList.add('disabled');

        bottomSheetContainer.classList.remove('slide-down');
        bottomSheetBackgroundOverlay.classList.remove('fade-out');
    }, 300);
}

/**
 * 
 * @param {Array<icon: string, text: string, function: string, functionParams>} entriesList 
 */
function loadBottomSheet(entriesList, event) {
    event.preventDefault();

    bottomSheetEntriesList.innerHTML = "";
    for (const entry of entriesList) {
        const html = `
        <div class="bottom-sheet-entry" onclick="${entry.function}(\`${entry.functionParams}\`)">
            <span class="bottom-sheet-entry-icon">${entry.icon}</span>
            <span class="bottom-sheet-entry-text">${entry.text}</span>
        </div>
        `;

        bottomSheetEntriesList.innerHTML += html;
    }

    bottomSheetContainer.classList.add('slide-in');
    bottomSheetBackgroundOverlay.classList.add('fade-in');

    bottomSheetContainer.classList.remove('disabled');
    bottomSheetBackgroundOverlay.classList.remove('disabled');

    setTimeout(() => {
        bottomSheetContainer.classList.remove('slide-in');
        bottomSheetBackgroundOverlay.classList.remove('fade-in');
    }, 300);
}