const pageInput = document.getElementById('page-input') as HTMLInputElement;
const paginationContainer = document.querySelector('.pagination-container') as HTMLElement;

if (document.body.hasAttribute('data-error')) {
    alert(document.body.getAttribute('data-error'));
}

pageInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        window.location.href = `?page=${pageInput.value}`;
    }
});

export function togglePaginationControls() {
    if (paginationContainer.classList.contains('hidden')) {
        paginationContainer.classList.remove('hidden');

        setTimeout(() => {
            paginationContainer.classList.remove('slide-down');
        }, 300);

    } else {
        paginationContainer.classList.add('slide-down');

        setTimeout(() => {
            paginationContainer.classList.add('hidden');
        }, 300);
        
        
    }   
}
