import { getLocalWorkflow } from '../modules/getLocalWorkflow.js';
import { handleError } from '../common/errorHandler.js';
import { renderInputs } from '../modules/workflowInputRenderer.js';

const inputsContainer = document.querySelector('.inputs-container');
const outputImagesContainer = document.querySelector('.output-images-container');
const totalImagesProgressInnerElem = document.querySelector('.total-images-progress .progress-bar-inner');
const totalImagesProgressTextElem = document.querySelector('.total-images-progress .progress-bar-text');
const currentImageProgressInnerElem = document.querySelector('.current-image-progress .progress-bar-inner');
const currentImageProgressTextElem = document.querySelector('.current-image-progress .progress-bar-text');
const cancelGenerationButtonElem = document.querySelector('.cancel-run-button');


const workflowDataObject = workflowDataFromEjs;
workflowDataObject['json'] = workflowDataObject.json ? workflowDataObject.json : await fetchLocalWorkflow();

let totalImageCount = 0;
let completedImageCount = 0;

const ws = new WebSocket(`ws://${window.location.host}/ws`);
ws.onopen = () => console.log('Connected to WebSocket client');

function loadWorkflow() {
    renderInputs(workflowDataObject["json"]);

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
    document.querySelector('.run-workflow').addEventListener('click', runWorkflow);
    document.querySelectorAll('.workflow-input-container .file-input').forEach((element) => fileUploadEventListener(element));

    cancelGenerationButtonElem.addEventListener('click', cancelRun);
    inputsContainer.addEventListener('click', handleInputContainerClick);
}

function fileUploadEventListener(element) {
    element.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('/comfyui/upload/image', {
                    method: 'POST',
                    body: formData
                });

                const responseJson = await response.json();

                if (responseJson.error) {
                    console.error(responseJson.error);
                }

                addOptionToSelect(document.querySelector('#' + element.getAttribute('data-select-id')), responseJson.externalResponse.name);

            } catch (err) {
                console.error(err);
            }
        }
    });
}

function addOptionToSelect(selectElem, option) {
    const optionElem = document.createElement('option');
    optionElem.value = option;
    optionElem.textContent = option;

    selectElem.appendChild(optionElem);
}

function handleInputContainerClick(e) {
    if (e.target.classList.contains('randomise-input-toggle')) {
        toggleRandomiseInput(e.target);
    } else if (e.target.classList.contains('randomise-now-button'))
        randomiseInput(e.target.parentNode.getAttribute('data-linked-input-id'));
}

function toggleRandomiseInput(toggleElement) {
    const toggleElemContainer = toggleElement.parentNode;
    const randomiseOff = toggleElemContainer.classList.contains('randomise-off');

    if (randomiseOff) {
        toggleElemContainer.classList.remove('randomise-off');
    } else {
        toggleElemContainer.classList.add('randomise-off');
    }
}

function randomiseInput(inputId) {
    const input = document.getElementById(inputId);
    const min = parseFloat(input.getAttribute('min'));
    const max = parseFloat(input.getAttribute('max'));
    const step = parseFloat(input.getAttribute('step')) || 1;

    let randomNumber;
    if (!isNaN(min) && !isNaN(max) && max > min) {
        randomNumber = generateRandomNum(min, max, step);
    } else {
        randomNumber = generateSeed();
    }

    input.value = randomNumber;
}

function generateRandomNum(min, max, step) {
    const range = (max - min) / step;
    return Math.min(min + step * Math.floor(Math.random() * range), max);
}

function generateSeed() {
    return Math.floor(Math.random() * 1e16)
        .toString()
        .padStart(16, '0');
}

function setProgressBar(type, percentage) {
    const textElem = type === 'total' ? totalImagesProgressTextElem : currentImageProgressTextElem;
    const barElem = type === 'total' ? totalImagesProgressInnerElem : currentImageProgressInnerElem;

    textElem.textContent = percentage;
    barElem.style.width = percentage;
}

function fillWorkflowWithUserParams() {
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

            randomiseInput(randomisedInputId);
        }

        const inputElem = inputContainer.querySelector('.workflow-input');

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

function updateProgressBars(messageData) {
    const currentImageProgress = `${Math.round((messageData.value / messageData.max) * 100)}%`;
    setProgressBar('current', currentImageProgress);

    if (messageData.value === messageData.max) {
        completedImageCount += 1;

        const allImagesProgress = `${Math.round((completedImageCount / totalImageCount) * 100)}%`;
        setProgressBar('total', allImagesProgress);
    }
}

function updateImagePreview(messageData) {
    const currentSkeletonLoaderElem =
        outputImagesContainer.querySelectorAll('.image-placeholder-skeleton')[
        totalImageCount - completedImageCount - 1
        ];

    if (!currentSkeletonLoaderElem) {
        return;
    }

    let previewImageElem = currentSkeletonLoaderElem.querySelector('.preview');
    if (!previewImageElem) {
        previewImageElem = document.createElement('img');
        previewImageElem.classList.add('preview');
        previewImageElem.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        // Empty image to ensure no flicker between when element is loaded and src is set

        currentSkeletonLoaderElem.appendChild(previewImageElem);
    }

    previewImageElem.src = `data:${messageData.mimetype};base64,${messageData.image}`;
}

function setupImagePlaceholders(messageData) {
    totalImageCount = messageData;
    outputImagesContainer.innerHTML = `<div class="image-placeholder-skeleton"></div>`.repeat(totalImageCount);
}

function finishGeneration(messageData) {
    // --- If using cached image and progress isnt set throughout generation
    setProgressBar('current', '100%');
    setProgressBar('total', '100%');
    // ---
    cancelGenerationButtonElem.classList.add('disabled');

    const allImageUrls = Object.values(messageData).map((item) => item[0]);

    outputImagesContainer.innerHTML = allImageUrls.map(urlToImageElem).join('');
}

function urlToImageElem(imageUrl) {
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
