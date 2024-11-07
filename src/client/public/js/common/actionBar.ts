const actionBarButtons = document.querySelectorAll('button.action-bar-button');

actionBarButtons.forEach((button) => {
    button.addEventListener('click', handleActionButtonClick);
});

async function handleActionButtonClick(e: Event) {
    const target = e.target as HTMLElement;

    const actionData = target.closest('[data-action]')?.getAttribute('data-action');

    if (!actionData) {
        console.error('No action data found for action button');
        return;
    }

    const [functionFile, functionName] = JSON.parse(actionData);

    const moduleFromFile = await import(functionFile);
    const functionToCall = moduleFromFile[functionName];

    functionToCall();
}
