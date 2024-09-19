const actionBarButtons = document.querySelectorAll('button.action-bar-button');

actionBarButtons.forEach(button => {
    button.addEventListener('click', handleActionButtonClick);
});

async function handleActionButtonClick(e) {
    const actionData = e.target.closest('[data-action]').getAttribute('data-action');
    
    const [functionFile, functionName] = JSON.parse(actionData);

    const moduleFromFile = await import(functionFile);
    const functionToCall = moduleFromFile[functionName];

    functionToCall();
}