const actionBarButtons = document.querySelectorAll('button.action-bar-button');

actionBarButtons.forEach(button => {
    button.addEventListener('click', handleActionButtonClick);
});

async function handleActionButtonClick(e) {
    const action = e.target.closest('[data-action]').getAttribute('data-action');

    const workflowPageJs = await import('/js/pages/workflow.js');

    switch (action) {
        case 'runWorkflow()':
            workflowPageJs.runWorkflow();
            break;

        case 'cancelRun()':
            workflowPageJs.cancelRun();
            break;

        default:
            console.error(`Unknown action: ${action}`);
            break;
    }
}