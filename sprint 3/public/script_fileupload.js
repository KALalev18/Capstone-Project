//i made some changes to the file upload script formally known as script.js using AI because it was not working on my computer
//i think you need to double check if it works on yours

document.addEventListener('DOMContentLoaded', function() {
    // Get the dropzone container using the specific ID
    const dropzoneContainer = document.querySelector('label#upload-form');

    // Only add event listeners if the element exists
    if (dropzoneContainer) {
        dropzoneContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzoneContainer.classList.add('dragging');
        });

        dropzoneContainer.addEventListener('dragleave', (e) => {
            dropzoneContainer.classList.remove('dragging');
        });

        dropzoneContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzoneContainer.classList.remove('dragging');

            if (e.dataTransfer.items) {
                // Process files using DataTransferItemList
                [...e.dataTransfer.items].forEach((item) => {
                    if (item.kind === "file") {
                        const file = item.getAsFile();
                        //uploadFile(file); // REMOVE THIS LINE
                        uploadedFile = file; // Store the file
                        document.getElementById('analyse-button').disabled = false; // Enable the button
                    }
                });
            } else {
                // Process files using DataTransfer
                [...e.dataTransfer.files].forEach((file) => {
                    //uploadFile(file); // REMOVE THIS LINE
                    uploadedFile = file; // Store the file
                    document.getElementById('analyse-button').disabled = false; // Enable the button
                });
            }
        });
    }

    // Function to handle file upload
    function uploadFile(file) {
        const formData = new FormData();
        formData.append("file", file);

        fetch('/', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            // Display the analysis result in the designated container
            const analysisResult = document.getElementById('analysis-result');
            analysisResult.innerHTML = data;
        })
        .catch(error => console.error('Error uploading file:', error));
    }

    // Update the handleFileChange function to include the "X" button functionality
    function handleFileChange(event) {
        const files = event.target.files; // Get all selected files
        const fileNamesContainer = document.getElementById('file-names');
        fileNamesContainer.innerHTML = ''; // Clear previous file names

        if (files.length > 0) {
            document.getElementById('analyse-button').disabled = false; // Enable analyse button
            document.getElementById('generate-graph-button').disabled = false; // Enable graph button

            // Iterate over all selected files
            Array.from(files).forEach((file, index) => {
                const fileContainer = document.createElement('div');
                fileContainer.classList.add('file-container');

                const fileName = document.createElement('span');
                fileName.textContent = file.name;
                fileName.classList.add('file-name');

                const removeButton = document.createElement('button');
                removeButton.textContent = 'X';
                removeButton.classList.add('remove-button');
                removeButton.addEventListener('click', () => {
                    // Remove the file from the list
                    const updatedFiles = Array.from(files).filter((_, i) => i !== index);
                    const dataTransfer = new DataTransfer();
                    updatedFiles.forEach((updatedFile) => dataTransfer.items.add(updatedFile));
                    event.target.files = dataTransfer.files; // Update the file input

                    handleFileChange({ target: event.target }); // Re-render the file list
                });

                fileContainer.appendChild(fileName);
                fileContainer.appendChild(removeButton);
                fileNamesContainer.appendChild(fileContainer);
            });

            // Show the file-names div
            fileNamesContainer.style.display = 'block';
        } else {
            document.getElementById('analyse-button').disabled = true; // Disable the button if no file
            document.getElementById('generate-graph-button').disabled = true; // Disable the graph button
            fileNamesContainer.innerHTML = ''; // Clear the displayed file names
            fileNamesContainer.style.display = 'none'; // Hide the file-names div
        }
    }

    const fileInput = document.getElementById('code-upload');
    const uploadForm = document.getElementById('upload-form');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileChange);
    }

    //you had two upload forms, i commented out the second one because it was the file selector appear twice when i click the button
    // if (uploadForm) {
    //   uploadForm.addEventListener('click', () => {
    //     fileInput.click();
    //   });
    // }

    const button3 = document.querySelector('.aurora-glow-button3');
    if (button3) button3.addEventListener('click', displayInputField);

    // Define displayInputField within the scope of DOMContentLoaded
    function displayInputField() {
        // Your displayInputField function code here
        console.log('displayInputField function called');
    }
});