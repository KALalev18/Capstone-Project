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