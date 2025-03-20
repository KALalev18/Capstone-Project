//i made some changes to the file upload script formally known as script.js using AI because it was not working on my computer
//i think you need to double check if it works on yours

const dropzoneContainer = document.querySelector('label');

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
        uploadFile(file);
      }
    });
  } else {
    // Process files using DataTransfer
    [...e.dataTransfer.files].forEach((file) => {
      uploadFile(file);
    });
  }
});

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

// Handle file input change
function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    uploadFile(file);
  }
}



document.addEventListener("DOMContentLoaded", () => {
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
});