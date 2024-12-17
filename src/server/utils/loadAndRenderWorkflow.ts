import { RequestWithTheme } from '@shared/types/Requests';
import { WorkflowType } from '@shared/types/Workflow';
import { Response } from 'express';
import { readServerWorkflow } from './workflowUtils';

function loadAndRenderWorkflow(
    workflowType: WorkflowType,
    workflowIdentifier: string,
    req: RequestWithTheme,
    res: Response,
    page: string
) {
    if (workflowType === 'local') {
        res.render(page, {
            workflowTitle: workflowIdentifier,
            workflowIdentifier: workflowIdentifier,
            workflowText: '',
            workflowType: 'local',
            workflowFilename: '',
            theme: req.theme,
        });
    } else {
        const workflowFileJson = readServerWorkflow(workflowIdentifier);

        if ('error' in workflowFileJson) {
            if (workflowFileJson.error === 'notFound') {
                res.status(404).send('Workflow not found.');
                return;
            } else if (workflowFileJson.error === 'invalidJson') {
                res.status(400).send('Invalid workflow file.');
                return;
            } else {
                res.status(500).send('Internal Server Error');
                return;
            }
        }

        const workflowTitle = workflowFileJson['_comfyuimini_meta'].title;

        res.render(page, {
            workflowTitle: workflowTitle,
            workflowIdentifier: workflowIdentifier,
            workflowText: JSON.stringify(workflowFileJson),
            workflowType: 'server',
            workflowFilename: workflowIdentifier,
            theme: req.theme,
        });
    }
}

export default loadAndRenderWorkflow;
