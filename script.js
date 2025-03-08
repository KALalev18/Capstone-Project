const dropzoneContainer = document.querySelector('label')

dropzoneContainer.addEventListener('dragover', (e) => {
  e.preventDefault()
  
  dropzoneContainer.classList.add('dragging')
})

dropzoneContainer.addEventListener('dragleave', (e) => {  
  dropzoneContainer.classList.remove('dragging')
})

dropzoneContainer.addEventListener('drop', (e) => {
  e.preventDefault()
  
  dropzoneContainer.classList.remove('dragging')
  
  if (e.dataTransfer.items) {
    // using DataTransferItemList
    [...e.dataTransfer.items].forEach((item, i) => {
      // only process items if they're files
      if (item.kind === "file") {
        const file = item.getAsFile()
        console.log(file.name, 'DataTransferItemList is supported!!')
      }
    })
    // ...
  } else {
    // using DataTransfer
    [...e.dataTransfer.files].forEach((file, i) => {
      console.log(file.name, 'whatever')
    })
  }
})

function displayInputField(){

    const inputField = document.querySelector('.input-field');
    console.log("Yo");
    inputField.classList.add("show");
}


document.addEventListener("DOMContentLoaded", () => {
    const button3 = document.querySelector('.aurora-glow-button3');
    if (button3) button3.addEventListener('click', displayInputField);

});

// Upload Script

document.getElementById('file-label').addEventListener('click', () => {
    const fileInput = document.getElementById('code-upload');
    fileInput.click();
});

function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('File selected:', file.name);
    }
}
