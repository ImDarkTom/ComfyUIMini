const pageInput = document.getElementById('page-input');

pageInput.addEventListener('keyup', (e) => {
    if (e.key === "Enter") {
        window.location.href = `?page=${pageInput.value}`;
    }
});