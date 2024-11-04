/**
 *
 * @param {string} selector The CSS selector of the element to get.
 * @returns {Element} The element found by the selector.
 */
function getElementOrThrow(selector) {
    const element = document.querySelector(selector);

    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }

    return element;
}

const workflowFileInput = getElementOrThrow('#file-input');
const workflowInputLabel = getElementOrThrow('.file-input-label');

workflowFileInput.addEventListener('change', () => {
    const file = workflowFileInput.files[0];

    if (!file) {
        return alert('No file selected.');
    }

    if (file.type != 'application/json') {
        return alert('Please select a valid JSON file.');
    }

    workflowInputLabel.textContent = `Opening ${file.name}`;

    const reader = new FileReader();
    reader.readAsText(file);

    reader.addEventListener('load', () => {
        const resultText = String(reader.result);

        const form = document.createElement('form');
        form.action = '/edit2';
        form.method = 'post';

        const workflowInput = document.createElement('input');
        workflowInput.name = 'workflow';
        workflowInput.value = resultText;

        form.appendChild(workflowInput);
        document.body.appendChild(form);

        form.submit();
        form.remove();
    });
});