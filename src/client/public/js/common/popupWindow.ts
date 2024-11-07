function openPopupWindow(message: string) {
    const popupContainerDiv = document.createElement('div');
    popupContainerDiv.classList.add('popup-container');

    const html = `
    <div class="popup-window">
        <span class="popup-message">${message}</span>
        <span class="popup-continue-button" onclick="closePopupWindow()">Ok</span>
    </div>
    `;

    popupContainerDiv.innerHTML = html;

    document.body.appendChild(popupContainerDiv);
    return;
}

function closePopupWindow() {
    const popupContainer = document.querySelector('.popup-container');

    if (!popupContainer) {
        return;
    }

    popupContainer.remove();
    return;
}
