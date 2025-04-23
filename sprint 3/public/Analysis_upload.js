let uploadedFile = null; // Store the uploaded file
let errorTimeout; // Variable to store the timeout ID

// Function to show an error message
function showError(message, errorId) {
    const existingError = document.getElementById(errorId);
    if (!existingError) {
        const error = document.createElement('p');
        error.id = errorId;
        error.textContent = message;
        error.style.color = 'red';
        error.style.marginTop = '10px';
        error.style.fontWeight = 'bold'; // Make text bolder
        document.querySelector('.button-container').appendChild(error);

        // Set a timeout to hide the error after 3 seconds instead of 5
        errorTimeout = setTimeout(() => {
            error.style.display = 'none';
        }, 3000); // Changed from 5000 to 3000 milliseconds
    }
}

// Function to clear the error message instantly
function clearError(errorId) {
    const error = document.getElementById(errorId);
    if (error) {
        error.remove(); // Remove the error message from the DOM
    }
    clearTimeout(errorTimeout); // Clear the timeout if it exists
}

// Function to show a status message
function showStatus(message, statusId) {
    clearStatus(statusId); // Clear any existing status first
    const status = document.createElement('p');
    status.id = statusId;
    status.textContent = message;
    status.style.color = '#50e52c';
    status.style.marginTop = '10px';
    status.style.fontWeight = 'bold'; // Make text bolder
    document.querySelector('.button-container').appendChild(status);
}

// Function to show a success message and then remove it
function showSuccess(message, statusId) {
    const status = document.getElementById(statusId);
    if (status) {
        status.textContent = message;
        status.style.color = '#f62df5'; // Change from blue to bright magenta
        status.style.fontWeight = 'bold'; // Make text bolder
        
        // Set timeout to remove the message after 1 second
        setTimeout(() => {
            status.remove();
        }, 1000);
    }
}

// Function to clear status messages
function clearStatus(statusId) {
    const status = document.getElementById(statusId);
    if (status) {
        status.remove();
    }
}

// Modified analyseFile function with status messages
function analyseFile() {
    const fileNamesContainer = document.getElementById('file-names');
    const errorId = 'error-message';
    const statusId = 'status-analyse';

    // Check if multiple files are selected
    if (fileNamesContainer.children.length > 1) {
        showError('You can only analyze one file at a time.', errorId);
        return;
    }

    // Proceed with analysis if only one file is selected
    const uploadedFile = document.getElementById('code-upload').files[0];
    if (!uploadedFile) {
        return; // No file selected, do nothing
    }

    // Show the analyzing status
    showStatus('Analyzing...', statusId);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    fetch('/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('analysis-result').innerHTML = data;
        clearError(errorId); // Clear the error message if it exists
        showSuccess('Analyzed!', statusId); // Show success and auto-disappear
    })
    .catch(error => {
        console.error('Error:', error);
        clearStatus(statusId); // Clear the status message on error
    });
}

// Modified generateGraphFromUpload function with status messages
function generateGraphFromUpload() {
    const fileNamesContainer = document.getElementById('file-names');
    const errorId = 'error-message-graph';
    const statusId = 'status-graph';

    // Check if more than 3 files are selected
    if (fileNamesContainer.children.length > 3) {
        showError('You can only generate function graphs for up to 3 files at once.', errorId);
        return;
    }

    // Proceed with graph generation if 3 or fewer files are selected
    const files = document.getElementById('code-upload').files;
    if (!files || files.length === 0) {
        clearError(errorId); // Clear the error message if it exists
        return; // No files selected, do nothing
    }

    // Show the generating status
    showStatus('Generating...', statusId);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
        formData.append("files", file);
    });

    fetch('/process-files', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('analysis-result').innerHTML = data;
        clearError(errorId); // Clear the error message if it exists
        showSuccess('Generated!', statusId); // Show success and auto-disappear
    })
    .catch(error => {
        document.getElementById('analysis-result').innerHTML =
            `<div class="error">Error generating function graphs: ${error.message}</div>`;
        clearStatus(statusId); // Clear the status message on error
    });
}

// Handle file input change
function handleFileChange(event) {
    clearError('error-message'); // Clear the error message instantly
    clearError('error-message-graph'); // Clear the graph error message instantly

    uploadedFile = event.target.files[0]; // Store the file
    if (uploadedFile) {
        document.getElementById('analyse-button').disabled = false; // Enable analyse button
        document.getElementById('generate-graph-button').disabled = false; // Enable graph button

        // Display the file name
        const fileName = uploadedFile.name;
        const fileNameDisplay = document.createElement('p');
        fileNameDisplay.textContent = fileName;
        document.getElementById('file-names').appendChild(fileNameDisplay);

        // Show the file-names div
        document.getElementById('file-names').style.display = 'block';
    } else {
        document.getElementById('analyse-button').disabled = true; // Disable the button if no file
        document.getElementById('generate-graph-button').disabled = true; // Disable the graph button
        // Clear the displayed file names
        document.getElementById('file-names').innerHTML = '';

        // Hide the file-names div
        document.getElementById('file-names').style.display = 'none';
    }
}

// Attach event listeners to buttons and file input
document.getElementById('analyse-button').addEventListener('click', () => {
    // Clear BOTH error messages
    clearError('error-message');
    clearError('error-message-graph');
    analyseFile();
});

document.getElementById('generate-graph-button').addEventListener('click', () => {
    // Clear BOTH error messages
    clearError('error-message');
    clearError('error-message-graph');
    generateGraphFromUpload();
});

document.getElementById('code-upload').addEventListener('change', (event) => {
    // Clear BOTH error messages
    clearError('error-message');
    clearError('error-message-graph');
    handleFileChange(event);
});



document.getElementById("upload-form").addEventListener("submit", function(event) {
    event.preventDefault();
    document.getElementById('code-upload').click();
});