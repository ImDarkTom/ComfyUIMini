const elements = {
    resolutionSelector: document.querySelector('#resolution-selector') as HTMLElement,
    resolutionSelectorOverlay: document.querySelector('#resolution-selector-overlay') as HTMLElement,
    get allResolutionButtons() {
        return document.querySelectorAll('.resolution-button') as NodeListOf<HTMLElement>;
    },
    get allResolutionScaleButtons() {
        return document.querySelectorAll('input[name="scale"]') as NodeListOf<HTMLInputElement>;
    },
};

elements.allResolutionScaleButtons.forEach((scaleButton) => {
    scaleButton.addEventListener('change', updateResolutionTexts);
});

function updateResolutionTexts() {
    elements.allResolutionButtons.forEach((button) => {
        const resolutionText = button.querySelector('.resolution-dimensions') as HTMLElement;

        const selectedScaleElem = document.querySelector('input[name="scale"]:checked') as HTMLInputElement;

        const width =
            parseInt(resolutionText.getAttribute('data-width') as string) * parseFloat(selectedScaleElem.value);
        const height =
            parseInt(resolutionText.getAttribute('data-height') as string) * parseFloat(selectedScaleElem.value);

        resolutionText.textContent = `${Math.floor(width)}x${Math.floor(height)}`;

        button.addEventListener('click', () => {
            const nodeId = elements.resolutionSelector.getAttribute('data-node-id') as string;

            const resolutionDimensionsElem = button.querySelector('.resolution-dimensions') as HTMLElement;

            const widthFromButton = parseInt(resolutionDimensionsElem.getAttribute('data-width') as string);
            const heightFromButton = parseInt(resolutionDimensionsElem.getAttribute('data-height') as string);

            const widthInput = document.querySelector(`#input-${nodeId}-width`) as HTMLInputElement;
            const heightInput = document.querySelector(`#input-${nodeId}-height`) as HTMLInputElement;

            widthInput.value = widthFromButton.toString();
            heightInput.value = heightFromButton.toString();

            hideResolutionSelector();
        });
    });
}

/**
 *
 * @param nodeId The id of the node to change the width and height of through the input.
 */
function showResolutionSelector(nodeId: string) {
    document.body.classList.add('locked');
    elements.resolutionSelector.classList.remove('hidden');
    elements.resolutionSelector.dataset.nodeId = nodeId;
    elements.resolutionSelectorOverlay.classList.remove('hidden');
}

function hideResolutionSelector() {
    document.body.classList.remove('locked');
    elements.resolutionSelector.classList.add('hidden');
    elements.resolutionSelectorOverlay.classList.add('hidden');
}

elements.resolutionSelectorOverlay.addEventListener('click', () => hideResolutionSelector());

updateResolutionTexts();

export { showResolutionSelector };
