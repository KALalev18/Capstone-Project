window.onload = function() {
    // Get the elements
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.getElementById('line-numbers');
    const codeInputContainer = document.querySelector('.code-input-container');
    const uploadCodeContainer = document.querySelector('.upload-code-container');
    const pasteButton = document.querySelector('.aurora-glow-button2');
    const linkButton = document.querySelector('.aurora-glow-button3');
    
    if (!codeInput || !lineNumbers) {
        console.error('Could not find code input or line numbers elements');
        return;
    }
    
    // Show code input container when "Paste the Code" button is clicked
    if (pasteButton) {
        pasteButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor behavior
            
            // Hide the GitHub repo container if it's visible
            if (uploadCodeContainer) {
                uploadCodeContainer.style.display = 'none';
            }
            
            // Show the code input container
            if (codeInputContainer) {
                codeInputContainer.style.display = 'flex'; // Using flex to maintain the layout
                
                // Focus on the textarea
                codeInput.focus();
                
                // Scroll to the container to ensure it's visible
                codeInputContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Show GitHub repo input container when "Link to Github Repo" button is clicked
    if (linkButton) {
        linkButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor behavior
            
            // Hide the code input container if it's visible
            if (codeInputContainer) {
                codeInputContainer.style.display = 'none';
            }
            
            // Show the GitHub repo container
            if (uploadCodeContainer) {
                uploadCodeContainer.style.display = 'flex';
                
                // Focus on the input field
                const inputField = uploadCodeContainer.querySelector('.input-field');
                if (inputField) {
                    inputField.focus();
                }
                
                // Scroll to the container to ensure it's visible
                uploadCodeContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Function to get the current line number based on cursor position
    function getCurrentLineNumber() {
        const cursorPosition = codeInput.selectionStart;
        const textBeforeCursor = codeInput.value.substring(0, cursorPosition);
        return (textBeforeCursor.match(/\n/g) || []).length + 1;
    }
    
    // Function to update line numbers and adjust heights
    function updateLineNumbers() {
        // Get the number of lines
        const lines = codeInput.value.split('\n');
        const lineCount = lines.length || 1; // At least one line
        const currentLineNumber = getCurrentLineNumber();
        
        // Clear the line numbers container
        lineNumbers.innerHTML = '';
        
        // Add line numbers
        for (let i = 1; i <= lineCount; i++) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'ace_gutter-cell';
            lineDiv.id = `line-${i}`;
            lineDiv.style.height = '19px';
            lineDiv.textContent = i;
            
            // Highlight current line
            if (i === currentLineNumber) {
                lineDiv.classList.add('current-line');
            }
            
            lineNumbers.appendChild(lineDiv);
        }
        
        // Adjust the heights
        adjustHeights();
    }
    
    // Function to adjust heights of both elements
    function adjustHeights() {
        // Calculate the needed height based on line count
        const lineCount = codeInput.value.split('\n').length || 1;
        const calculatedHeight = Math.max(400, lineCount * 19 + 20); // 19px per line + padding
        
        // Apply heights to both elements
        codeInput.style.height = `${calculatedHeight}px`;
        lineNumbers.style.height = `${calculatedHeight}px`;
    }
    
    // Initialize with the first line
    updateLineNumbers();
    
    // Add event listeners
    codeInput.addEventListener('input', updateLineNumbers);
    
    codeInput.addEventListener('keyup', updateLineNumbers);
    
    // Update line highlighting when cursor moves
    codeInput.addEventListener('click', updateLineNumbers);
    codeInput.addEventListener('mouseup', updateLineNumbers);
    
    // Enhanced paste event handling
    codeInput.addEventListener('paste', function(e) {
        // Prevent default paste to handle it manually
        e.preventDefault();
        
        // Get clipboard data
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedText = clipboardData.getData('text');
        
        // Get cursor position
        const start = this.selectionStart;
        const end = this.selectionEnd;
        
        // Insert text manually at cursor position
        this.value = this.value.substring(0, start) + pastedText + this.value.substring(end);
        
        // Update cursor position
        this.selectionStart = this.selectionEnd = start + pastedText.length;
        
        // Update line numbers
        updateLineNumbers();
        
        // Force scroll to top - try multiple times to ensure it works
        codeInput.scrollTop = 0;
        
        // Multiple attempts with increasing delays
        setTimeout(() => { codeInput.scrollTop = 0; }, 0);
        setTimeout(() => { codeInput.scrollTop = 0; }, 10);
        setTimeout(() => { codeInput.scrollTop = 0; }, 50);
        setTimeout(() => { codeInput.scrollTop = 0; }, 100);
    });
    
    // Sync horizontal scrolling only (vertical scrolling is no longer needed)
    codeInput.addEventListener('scroll', function() {
        // Only sync horizontal scrolling if needed
        if (codeInput.scrollWidth > codeInput.clientWidth) {
            // We're only concerned with horizontal scrolling now
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        updateLineNumbers();
    });
    
    // Handle tab key to insert spaces instead of changing focus
    codeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            // Insert 4 spaces at the cursor position
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            
            // Move cursor after the inserted spaces
            this.selectionStart = this.selectionEnd = start + 4;
            
            // Update line numbers
            updateLineNumbers();
        } else if (e.key === 'Enter') {
            // Special handling for Enter key to ensure immediate height adjustment
            setTimeout(updateLineNumbers, 0);
        } else {
            // For arrow keys and other navigation
            setTimeout(updateLineNumbers, 0);
        }
    });
    
    // Implement fetchData function for GitHub repo button
    window.fetchData = function() {
        //nothing haapens for now
        const inputField = document.querySelector('.input-field');
    };
};

//for the dashboard.html linkning

document.addEventListener('DOMContentLoaded', function () {
  const viewStatsButton = document.getElementById('view-stats-button');
  
  viewStatsButton.addEventListener('click', function () {
    window.location.href = 'dashboard.html';
  });
});