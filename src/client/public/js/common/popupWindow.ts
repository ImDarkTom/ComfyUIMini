enum PopupWindowType {
    ERROR = 'An error has occured',
    WARNING = 'Warning',
    INFO = 'Info',
}

function parseError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return 'Unknown error';
    }
}

function openPopupWindow(type: PopupWindowType = PopupWindowType.ERROR, message: string, error: unknown = null) {
    const popupContainerDiv = document.createElement('div');
    popupContainerDiv.classList.add('popup-container');

    const typeKey = Object.keys(PopupWindowType).find(
        (key) => PopupWindowType[key as keyof typeof PopupWindowType] === type
    );

    const popupTypeClass = (typeKey ?? 'INFO').toLowerCase();

    let errorElement: null | HTMLElement = null;
    if (error) {
        errorElement = document.createElement('div');
        errorElement.classList.add('popup-error');
        errorElement.textContent = parseError(error);
    }

    const html = `
    <div class="popup-window">
        <span class="popup-message-type ${popupTypeClass}">${type}</span>
        <span class="popup-message">${message}</span>
        ${errorElement?.outerHTML ?? ''}
        <span class="popup-continue-button">Ok</span>
    </div>
    `;

    popupContainerDiv.innerHTML = html;

    popupContainerDiv.querySelector('.popup-continue-button')?.addEventListener('click', closePopupWindow);

    document.body.appendChild(popupContainerDiv);
    document.body.classList.add('locked');
}

function closePopupWindow() {
    document.body.classList.remove('locked');
    const popupContainer = document.querySelector('.popup-container');

    if (!popupContainer) {
        return;
    }

    popupContainer.remove();
    return;
}

export { openPopupWindow, PopupWindowType };
