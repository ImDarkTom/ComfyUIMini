async function reloadModelsList() {
    const response = await fetch('/comfyui/reloadmodels', {
        method: "POST"
    });
    
    const responseText = await response.text();

    alert(responseText);
}

async function changeTheme(selectElement) {
    const selectedTheme = selectElement.value;

    const response = await fetch(`/setsetting/theme?theme=${selectedTheme}`);
    
    const responseText = await response.text();

    if (response.status === 200) {
        location.reload()
    } else {
        alert(responseText);
    }
}