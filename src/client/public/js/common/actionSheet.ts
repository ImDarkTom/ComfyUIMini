const bottomSheetContainer = document.querySelector('.bottom-sheet-container') as HTMLElement;
const bottomSheetBackgroundOverlay = document.querySelector('.bottom-sheet-bg-overlay') as HTMLElement;
const bottomSheetEntriesList = document.querySelector('.bottom-sheet-entries-list') as HTMLElement;
const closeBottomSheetButton = document.querySelector('.close-button') as HTMLElement;

closeBottomSheetButton.addEventListener('click', closeBottomSheet);
bottomSheetBackgroundOverlay.addEventListener('click', closeBottomSheet);

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

interface BottomSheetEntry {
    icon: string;
    text: string;
    function: string;
    functionParams: string[];
}

function loadBottomSheet(entriesList: BottomSheetEntry[], event: Event) {
    event.preventDefault();

    bottomSheetEntriesList.innerHTML = '';
    for (const entry of entriesList) {
        const functionParamsString = entry.functionParams.map((param) => JSON.stringify(param)).join(',');

        const html = `
        <div class="bottom-sheet-entry" onclick="${entry.function}(${functionParamsString.replace(/"/g, '`')})">
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

export { loadBottomSheet, BottomSheetEntry };
