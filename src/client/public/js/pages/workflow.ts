import { getLocalWorkflow } from '../modules/getLocalWorkflow.js';
import { handleError } from '../common/errorHandler.js';
import { renderInputs } from '../modules/workflowInputRenderer.js';
import {
    FinishGenerationMessage,
    PreviewMessage,
    ProgressMessage,
    TotalImagesMessage,
} from '@shared/types/WebSocket.js';
import { saveInputValues } from '../modules/savedInputValues.js';
import { Workflow } from '@shared/types/Workflow.js';

const inputsContainer = document.querySelector('.inputs-container') as HTMLElement;
const outputImagesContainer = document.querySelector('.output-images-container') as HTMLElement;
const totalImagesProgressInnerElem = document.querySelector(
    '.total-images-progress .progress-bar-inner'
) as HTMLElement;
const totalImagesProgressTextElem = document.querySelector('.total-images-progress .progress-bar-text') as HTMLElement;
const currentImageProgressInnerElem = document.querySelector(
    '.current-image-progress .progress-bar-inner'
) as HTMLElement;
const currentImageProgressTextElem = document.querySelector(
    '.current-image-progress .progress-bar-text'
) as HTMLElement;
const cancelGenerationButtonElem = document.querySelector('.cancel-run-button') as HTMLButtonElement;
const runButton = document.querySelector('.run-workflow') as HTMLButtonElement;

// @ts-ignore - We get this from EJS via an inline script tag
const workflowDataObject = workflowDataFromEjs;
workflowDataObject['json'] = workflowDataObject.json ? workflowDataObject.json : await fetchLocalWorkflow();

let totalImageCount = 0;
let completedImageCount = 0;

const ws = new WebSocket(`ws://${window.location.host}/ws`);
ws.onopen = () => console.log('Connected to WebSocket client');

function loadWorkflow() {
    renderInputs(workflowDataObject);

    startEventListeners();
}

async function fetchLocalWorkflow() {
    try {
        return getLocalWorkflow(workflowDataObject.identifier);
    } catch (error) {
        handleError(error);
    }
}

function startEventListeners() {
    runButton.addEventListener('click', runWorkflow);
    document
        .querySelectorAll('.workflow-input-container .file-input')
        .forEach((element) => fileUploadEventListener(element as HTMLElement));

    cancelGenerationButtonElem.addEventListener('click', cancelRun);
    inputsContainer.addEventListener('click', handleInputContainerClick);
}

function fileUploadEventListener(element: HTMLElement) {
    element.addEventListener('change', async (e) => {
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

                const selectId = element.getAttribute('data-select-id');

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

function addOptionToSelect(selectElem: HTMLSelectElement, option: string) {
    const optionElem = document.createElement('option');
    optionElem.value = option;
    optionElem.textContent = option;

    selectElem.appendChild(optionElem);
}

function handleInputContainerClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

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

function toggleRandomiseInput(toggleElement: HTMLElement) {
    const toggleElemContainer = toggleElement.parentNode as HTMLElement;

    const randomiseOff = toggleElemContainer.classList.contains('randomise-off');

    if (randomiseOff) {
        toggleElemContainer.classList.remove('randomise-off');
    } else {
        toggleElemContainer.classList.add('randomise-off');
    }
}

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

function generateRandomNum(min: number, max: number, step: number) {
    const range = (max - min) / step;
    return Math.min(min + step * Math.floor(Math.random() * range), max);
}

function generateSeed() {
    return Math.floor(Math.random() * 1e16)
        .toString()
        .padStart(16, '0');
}

function setProgressBar(type: 'total' | 'current', percentage: string) {
    const textElem = type === 'total' ? totalImagesProgressTextElem : currentImageProgressTextElem;
    const barElem = type === 'total' ? totalImagesProgressInnerElem : currentImageProgressInnerElem;

    textElem.textContent = percentage;
    barElem.style.width = percentage;
}

function fillWorkflowWithUserParams(): Workflow {
    const workflowModified = workflowDataObject.json;
    // ComfyUI can't process the workflow if it contains the additional metadata.
    delete workflowModified['_comfyuimini_meta'];

    document.querySelectorAll('.workflow-input-container').forEach((inputContainer) => {
        const randomiseButtonsContainer = inputContainer.querySelector('.randomise-buttons-container');

        if (randomiseButtonsContainer) {
            if (randomiseButtonsContainer.classList.contains('randomise-off')) {
                return;
            }

            const randomisedInputId = randomiseButtonsContainer.getAttribute('data-linked-input-id');

            if (!randomisedInputId) {
                console.error('No linked input id found');
                return;
            }

            randomiseInput(randomisedInputId);
        }

        const inputElem = inputContainer.querySelector('.workflow-input') as HTMLInputElement;

        const [_, nodeId, nodeInputName] = inputElem.id.split('-');
        const inputValue = inputElem.value;

        workflowModified[nodeId].inputs[nodeInputName] = inputValue;
    });

    return workflowModified;
}

export async function runWorkflow() {
    setProgressBar('current', '0%');
    setProgressBar('total', '0%');

    totalImageCount = 0;
    completedImageCount = 0;

    const filledWorkflow = fillWorkflowWithUserParams();
    saveInputValues(workflowDataObject.type, workflowDataObject.identifier, filledWorkflow);

    ws.send(JSON.stringify(filledWorkflow));

    cancelGenerationButtonElem.classList.remove('disabled');

    ws.onmessage = (event) => {
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
    };
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
        outputImagesContainer.querySelectorAll('.image-placeholder-skeleton')[
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
    outputImagesContainer.innerHTML = `<div class="image-placeholder-skeleton"></div>`.repeat(totalImageCount);
}

function finishGeneration(messageData: FinishGenerationMessage) {
    // --- If using cached image and progress isnt set throughout generation
    setProgressBar('current', '100%');
    setProgressBar('total', '100%');
    // ---
    cancelGenerationButtonElem.classList.add('disabled');

    const allImageUrls = Object.values(messageData).map((item) => item[0]);

    outputImagesContainer.innerHTML = allImageUrls.map(urlToImageElem).join('');
}

function urlToImageElem(imageUrl: string) {
    return `<a href="${imageUrl}" target="_blank"><img src="${imageUrl}" class="output-image"></a>`;
}

export function cancelRun() {
    if (cancelGenerationButtonElem.classList.contains('disabled')) {
        return;
    }

    fetch('/comfyui/interrupt');
    cancelGenerationButtonElem.classList.add('disabled');
}

loadWorkflow();
