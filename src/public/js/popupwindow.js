function openPopupWindow(message) {
    const html = `
    <div class="popup-container">
        <div class="popup-window">
            <span class="popup-message">${message}</span>
            <span class="popup-continue-button" onclick="closePopupWindow()">Ok</span>
        </div>
    </div>
    `;

    document.body.innerHTML += html;
}

function closePopupWindow() {
    const popupContainer = document.querySelector('.popup-container');

    popupContainer.remove();
}