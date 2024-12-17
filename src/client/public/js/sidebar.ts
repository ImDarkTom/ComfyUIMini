import getAllWorkflowsInfo from './modules/getWorkflows.js';

const elements = {
    sidebar: document.getElementById('sidebar') as HTMLElement,
    overlay: document.getElementById('sidebar-overlay') as HTMLElement,
    dropdownButtonItem: document.querySelector('.sidebar-list-item-dropdown') as HTMLElement,
    dropdownList: document.querySelector('.sidebar-dropdown-list') as HTMLElement,
    dropdownArrow: document.querySelector('.dropdown-arrow') as HTMLElement,
    toggleButton: document.getElementById('sidebar-toggle') as HTMLElement,
};

elements.toggleButton.addEventListener('click', () => openSidebar());

elements.dropdownButtonItem.addEventListener('click', () => toggleDropdown());

function toggleDropdown() {
    if (elements.dropdownList.classList.contains('hidden')) {
        elements.dropdownList.classList.remove('hidden');
        elements.dropdownArrow.innerHTML = '▲';
    } else {
        elements.dropdownList.classList.add('hidden');
        elements.dropdownArrow.innerHTML = '▼';
    }
}

elements.overlay.addEventListener('click', () => closeSidebar());

function closeSidebar() {
    elements.sidebar.classList.add('slide-out');
    elements.overlay.classList.add('slide-out');

    elements.sidebar.addEventListener('transitionend', function handle() {
        elements.sidebar.classList.remove('slide-out');
        elements.sidebar.classList.add('hidden');

        elements.overlay.classList.remove('slide-out');
        elements.overlay.classList.add('hidden');

        document.body.classList.remove('locked');

        elements.sidebar.removeEventListener('transitionend', handle);
    });
}

function openSidebar() {
    elements.sidebar.classList.add('slide-in');
    elements.sidebar.classList.remove('hidden');

    elements.overlay.classList.add('slide-in');
    elements.overlay.classList.remove('hidden');

    elements.sidebar.addEventListener('transitionend', function handle() {
        elements.sidebar.classList.remove('slide-in');
        elements.overlay.classList.remove('slide-in');

        document.body.classList.add('locked');

        elements.sidebar.removeEventListener('transitionend', handle);
    });
}

async function loadWorkflowsIntoSidebar() {
    let html = '';

    const allWorkflowsInfo = await getAllWorkflowsInfo();

    for (const workflow of allWorkflowsInfo) {
        html += `
        <a href="/workflow/${workflow.type}/${workflow.identifier}" class="sidebar-dropdown-list-item">
            <span class="icon ${workflow.icon}"></span>
            <span class="sidebar-list-item-text">${workflow.title}</span>
        </a>`;
    }

    elements.dropdownList.innerHTML = html;
}

loadWorkflowsIntoSidebar();

export { openSidebar, closeSidebar };
