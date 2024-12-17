import { getAllWorkflows } from './getLocalWorkflow.js';

export interface WorkflowInfo {
    title: string;
    icon: 'server' | 'phone';
    type: 'server' | 'local';
    identifier: string;
}

async function getAllWorkflowsInfo(): Promise<WorkflowInfo[]> {
    const allLocalWorkflows = getAllWorkflows();

    let workflowsInfoList = allLocalWorkflows.map((workflow) => {
        return {
            title: workflow._comfyuimini_meta.title,
            icon: 'phone' as const,
            type: 'local' as const,
            identifier: workflow._comfyuimini_meta.title,
        };
    });

    const serverWorkflowInfo = await fetch('/allserverworkflows');
    const serverWorkflowInfoJson = await serverWorkflowInfo.json();

    workflowsInfoList = workflowsInfoList.concat(serverWorkflowInfoJson);

    return workflowsInfoList;
}

export default getAllWorkflowsInfo;
