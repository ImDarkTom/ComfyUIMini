// --- Imports ---
// External dependencies
import {
    FinishGenerationMessage,
    PreviewMessage,
    ProgressMessage,
    TotalImagesMessage,
} from '@shared/types/WebSocket.js';
import { WorkflowWithMetadata } from '@shared/types/Workflow.js';
import { NodeInputValues } from '@shared/types/SavedInputs.js';
import { WorkflowInstance } from '@shared/classes/Workflow.js';

// Internal modules
import { getLocalWorkflow } from '../modules/getLocalWorkflow.js';
import { renderInputs } from '../modules/workflowInputRenderer.js';
import { SaveInputValues } from '../modules/savedInputValues.js';

// --- DOM Elements ---
const elements = {
    inputsContainer: document.querySelector('.inputs-container') as HTMLElement,
    outputImagesContainer: document.querySelector('.output-images-container') as HTMLElement,
    progressBar: {
        current: {
            innerElem: document.querySelector('.current-image-progress .progress-bar-inner') as HTMLElement,
            textElem: document.querySelector('.current-image-progress .progress-bar-text') as HTMLElement,
        },
        total: {
            innerElem: document.querySelector('.total-images-progress .progress-bar-inner') as HTMLElement,
            textElem: document.querySelector('.total-images-progress .progress-bar-text') as HTMLElement,
        },
    },
    runButton: document.querySelector('.run-workflow') as HTMLButtonElement,
    cancelRunButton: document.querySelector('.cancel-run-button') as HTMLButtonElement,
    get allFileInputs() {
        return document.querySelectorAll('.workflow-input-container .file-input') as NodeListOf<HTMLElement>;
    },
    get allSelectsWithImageUploads() {
        return document.querySelectorAll('select.workflow-input.has-image-upload') as NodeListOf<HTMLSelectElement>;
    },
    get allWorkflowInputContainers() {
        return document.querySelectorAll('.workflow-input-container') as NodeListOf<HTMLElement>;
    },
};

// --- Variables ---
let totalImageCount = 0;
let completedImageCount = 0;

// @ts-ignore
const workflowIdentifier = passedWorkflowIdentifier;
// @ts-ignore
const workflowType = passedWorkflowType;

// Workflow data from EJS via inline script tag
// @ts-ignore
const workflowObject: WorkflowWithMetadata = workflowDataFromEjs ? workflowDataFromEjs : fetchLocalWorkflow();

// --- Initialise WebSocket ---
// Use wss:// when the page is served over HTTPS
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
ws.onopen = () => console.log('Connected to WebSocket client');

function loadWorkflow() {
    renderInputs(workflowObject, workflowType, workflowIdentifier);

    startEventListeners();
}

/**
 * Fetches the current local workflow from localStorage.
 * If the workflow is not found, an error is thrown.
 *
 * @returns The workflow object
 */
function fetchLocalWorkflow(): WorkflowWithMetadata {
    const localWorkflow = getLocalWorkflow(workflowIdentifier);

    if (!localWorkflow) {
        const errorMessage = `Workflow '${workflowIdentifier}' not found.`;
        openPopupWindow(errorMessage);
        throw new Error(errorMessage);
    }

    return localWorkflow;
}

/**
 * Starts the event listeners for the various elements on the page.
 */
function startEventListeners() {
    elements.runButton.addEventListener('click', runWorkflow);
    elements.cancelRunButton.addEventListener('click', cancelRun);

    elements.inputsContainer.addEventListener('click', handleInputContainerClick);

    elements.allFileInputs.forEach((element) => fileUploadEventListener(element));
    elements.allSelectsWithImageUploads.forEach((selectElement) => imageSelectEventListener(selectElement));
}

/**
 * Handles updating the preview for a image select element.
 *
 * @param selectElement The select element to listen to.
 */
function imageSelectEventListener(selectElement: HTMLSelectElement) {
    selectElement.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLSelectElement;

        const selectedOption = target.options[target.selectedIndex];
        const selectedValue = selectedOption.value;

        if (!selectedValue) {
            return;
        }

        const innerInputWrapperElem = target.closest('.inner-input-wrapper');

        if (!innerInputWrapperElem) {
            return;
        }

        const imagePreviewElem = innerInputWrapperElem.querySelector('.input-image-preview') as HTMLImageElement;
        imagePreviewElem.src = `/comfyui/image?filename=${selectedValue}&subfolder=&type=input`;
    });
}

/**
 * Handles uploading an image file to the server for image select inputs.
 *
 * @param inputElement The file input element to listen to.
 */
function fileUploadEventListener(inputElement: HTMLElement) {
    inputElement.addEventListener('change', async (e) => {
        const target = e.target;

        if (!target || !(target instanceof HTMLInputElement)) {
            return;
        }

        if (!target.files) {
            return;
        }

        if (target.files.length > 0) {
            const file = target.files[0];

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('/comfyui/upload/image', {
                    method: 'POST',
                    body: formData,
                });

                const responseJson = await response.json();

                if (responseJson.error) {
                    console.error(responseJson.error);
                }

                const selectId = inputElement.getAttribute('data-select-id');

                if (!selectId) {
                    console.error('No linked select attribute found');
                    return;
                }

                const linkedSelect = document.getElementById(selectId);

                if (!linkedSelect) {
                    console.error('Linked select not found');
                    return;
                }

                addOptionToSelect(linkedSelect as HTMLSelectElement, responseJson.externalResponse.name);
            } catch (err) {
                console.error(err);
            }
        }
    });
}

/**
 * Adds a new select option to a select element.
 * Used to add new images to existing selects when a new image is uploaded for image inputs.
 *
 * @param selectElem The select to add the option to.
 * @param option The option to add.
 */
function addOptionToSelect(selectElem: HTMLSelectElement, option: string) {
    const optionElem = document.createElement('option');
    optionElem.value = option;
    optionElem.textContent = option;

    selectElem.appendChild(optionElem);
}

/**
 * Handles clicks on elements inside the input container.
 *
 * @param event The click mouse event.
 * @returns Nothing.
 */
function handleInputContainerClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (target.classList.contains('randomise-input-toggle')) {
        toggleRandomiseInput(target);
    } else if (target.classList.contains('randomise-now-button')) {
        const parentNode = target.parentNode;

        if (!parentNode) {
            console.error('No parent node found');
            return;
        }

        const linkedInputId = (parentNode as HTMLElement).getAttribute('data-linked-input-id');

        if (!linkedInputId) {
            console.error('No linked input id found');
            return;
        }

        randomiseInput(linkedInputId);
    }
}

/**
 * Toggles on/off the randomisation of an input on workflow run.
 *
 * @param toggleElement The toggle element that was clicked.
 */
function toggleRandomiseInput(toggleElement: HTMLElement) {
    const toggleElemContainer = toggleElement.parentNode as HTMLElement;

    const randomiseOff = toggleElemContainer.classList.contains('randomise-off');

    if (randomiseOff) {
        toggleElemContainer.classList.remove('randomise-off');
    } else {
        toggleElemContainer.classList.add('randomise-off');
    }
}

/**
 * Randomises an input field.
 *
 * @param inputId The input to randomise.
 * @returns Nothing.
 */
function randomiseInput(inputId: string) {
    const input = document.getElementById(inputId);

    if (!input) {
        console.error('Input not found');
        return;
    }

    const min = input.getAttribute('min');
    const max = input.getAttribute('max');
    const step = input.getAttribute('step') || '1';

    let randomNumber;
    if (min && max && max > min) {
        randomNumber = generateRandomNum(parseFloat(min), parseFloat(max), parseFloat(step));
    } else {
        randomNumber = generateSeed();
    }

    (input as HTMLInputElement).value = randomNumber.toString();
}

/**
 * Generates a random number between min and max with a step.
 *
 * @param min The minimum value.
 * @param max The maximum value.
 * @param step The step size i.e. the difference between each number.
 * @returns The random number generated.
 */
function generateRandomNum(min: number, max: number, step: number): number {
    const range = (max - min) / step;
    return Math.min(min + step * Math.floor(Math.random() * range), max);
}

/**
 * Generates a random number seed.
 *
 * @returns A random seed.
 */
function generateSeed() {
    return Math.floor(Math.random() * 1e16)
        .toString()
        .padStart(16, '0');
}

/**
 * Updates a progress bar with a new percentage.
 * Percentage should include the % symbol.
 *
 * @param type Which progress bar to change.
 * @param percentage What percentage to set the progress bar to.
 */
function setProgressBar(type: 'total' | 'current', percentage: string) {
    const textElem = type === 'total' ? elements.progressBar.total.textElem : elements.progressBar.current.textElem;
    const barElem = type === 'total' ? elements.progressBar.total.innerElem : elements.progressBar.current.innerElem;

    textElem.textContent = percentage;
    barElem.style.width = percentage;
}

function generateNodeInputValues(): NodeInputValues {
    let collectingInputValues: NodeInputValues = {};

    elements.allWorkflowInputContainers.forEach((inputContainer) => {
        const randomiseButtonsContainer = inputContainer.querySelector('.randomise-buttons-container');

        if (randomiseButtonsContainer) {
            handleInputRandomise(randomiseButtonsContainer);
        }

        const inputElem = inputContainer.querySelector('.workflow-input') as HTMLInputElement;

        const [_, nodeId, nodeInputName] = inputElem.id.split('-');
        const inputValue = inputElem.value;

        if (!collectingInputValues[nodeId]) {
            collectingInputValues[nodeId] = {};
        }

        collectingInputValues[nodeId][nodeInputName] = inputValue;
    });

    return collectingInputValues;
}

function handleInputRandomise(randomiseButtonContainer: Element) {
    if (randomiseButtonContainer.classList.contains('randomise-off')) {
        return;
    }

    const randomisedInputId = randomiseButtonContainer.getAttribute('data-linked-input-id');

    if (!randomisedInputId) {
        console.error('No linked input id found');
        return;
    }

    randomiseInput(randomisedInputId);
}

export async function runWorkflow() {
    setProgressBar('current', '0%');
    setProgressBar('total', '0%');

    totalImageCount = 0;
    completedImageCount = 0;

    const filledNodeInputValues = generateNodeInputValues();
    SaveInputValues.fromNodeInputValues(workflowType, workflowIdentifier, filledNodeInputValues);

    const filledWorkflow = new WorkflowInstance(workflowObject).fillWorkflowWithUserInputs(filledNodeInputValues);
    ws.send(JSON.stringify(filledWorkflow));

    elements.cancelRunButton.classList.remove('disabled');

    ws.onmessage = handleWebSocketMessage;
}

function handleWebSocketMessage(event: MessageEvent<any>) {
    const message = JSON.parse(event.data);

    switch (message.type) {
        case 'progress':
            updateProgressBars(message.data);
            break;

        case 'preview':
            updateImagePreview(message.data);
            break;

        case 'total_images':
            setupImagePlaceholders(message.data);
            break;

        case 'completed':
            finishGeneration(message.data);
            break;

        case 'error':
            console.error('Error:', message.message);
            openPopupWindow(message.message);
            break;

        default:
            console.warn('Unknown WebSocket message type:', message.type);
            console.log(message);
            break;
    }
}

function updateProgressBars(messageData: ProgressMessage) {
    const currentImageProgress = `${Math.round((messageData.value / messageData.max) * 100)}%`;
    setProgressBar('current', currentImageProgress);

    if (messageData.value === messageData.max) {
        completedImageCount += 1;

        const allImagesProgress = `${Math.round((completedImageCount / totalImageCount) * 100)}%`;
        setProgressBar('total', allImagesProgress);
    }
}

function updateImagePreview(messageData: PreviewMessage) {
    const currentSkeletonLoaderElem =
        elements.outputImagesContainer.querySelectorAll('.image-placeholder-skeleton')[
            totalImageCount - completedImageCount - 1
        ];

    if (!currentSkeletonLoaderElem) {
        return;
    }

    let previewImageElem: HTMLImageElement = currentSkeletonLoaderElem.querySelector('.preview') as HTMLImageElement;
    if (!previewImageElem) {
        previewImageElem = document.createElement('img');
        previewImageElem.classList.add('preview');
        previewImageElem.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        // Empty image to ensure no flicker between when element is loaded and src is set

        currentSkeletonLoaderElem.appendChild(previewImageElem);
    }

    previewImageElem.src = `data:${messageData.mimetype};base64,${messageData.image}`;
}

function setupImagePlaceholders(messageData: TotalImagesMessage) {
    totalImageCount = messageData;
    elements.outputImagesContainer.innerHTML = `<div class="image-placeholder-skeleton"></div>`.repeat(totalImageCount);
}

function finishGeneration(messageData: FinishGenerationMessage) {
    // --- If using cached image and progress isnt set throughout generation
    setProgressBar('current', '100%');
    setProgressBar('total', '100%');
    // ---
    elements.cancelRunButton.classList.add('disabled');

    const allImageUrls = Object.values(messageData).map((item) => item[0]);

    elements.outputImagesContainer.innerHTML = allImageUrls.map(urlToImageElem).join('');
}

function urlToImageElem(imageUrl: string) {
    return `<a href="${imageUrl}" target="_blank"><img src="${imageUrl}" class="output-image"></a>`;
}

export function cancelRun() {
    if (elements.cancelRunButton.classList.contains('disabled')) {
        return;
    }

    fetch('/comfyui/interrupt');
    elements.cancelRunButton.classList.add('disabled');
}

loadWorkflow();
