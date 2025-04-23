window.onload = function() {
    // Get the elements
    const codeInput = document.getElementById('code-input');
    const lineNumbers = document.getElementById('line-numbers');
    const codeInputContainer = document.querySelector('.code-input-container');
    const uploadCodeContainer = document.querySelector('.upload-code-container');
    const pasteButton = document.querySelector('.aurora-glow-button2');
    const linkButton = document.querySelector('.aurora-glow-button3');
    const processButton = document.querySelector('.aurora-glow-button4');
    const analysisContainer = document.querySelector('.analysis-container');
    
    if (!codeInput || !lineNumbers) {
        console.error('Could not find code input or line numbers elements');
        return;
    }
    processButton.style.display = 'none';
    // analysisContainer.style.display = 'none';
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
                processButton.style.display = 'block';
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
            
            // Hide the analysis container
            if (analysisContainer) {
                analysisContainer.style.display = 'none';
            }
            
            // Hide the Process Code button
            if (processButton) {
                processButton.style.display = 'none';
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
        
<<<<<<< HEAD

=======
        // Add this: Scroll to the process button after a short delay
>>>>>>> 2d4779278a7b48fcd57b1693cc9c288ff6c4fbe6
        setTimeout(() => {
            // Ensure the process button is visible
            processButton.style.display = 'block';
            
            // Scroll to the process button
            processButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
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

    // Function to show an error message
    function showError(message, errorId) {
        clearError(errorId); // Clear existing error if any
        const error = document.createElement('p');
        error.id = errorId;
        error.textContent = message;
        error.style.color = 'red';
        error.style.marginTop = '10px';
        error.style.fontWeight = 'bold';
        error.style.textAlign = 'center';
        document.querySelector('.content').appendChild(error);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            clearError(errorId);
        }, 3000);
    }

    // Function to clear error messages
    function clearError(errorId) {
        const error = document.getElementById(errorId);
        if (error) {
            error.remove();
        }
    }

    // Function to show a status message
    function showStatus(message, statusId) {
        clearStatus(statusId);
        const status = document.createElement('p');
        status.id = statusId;
        status.textContent = message;
        status.style.color = '#50e52c';
        status.style.marginTop = '10px';
        status.style.fontWeight = 'bold';
        status.style.textAlign = 'center';
        document.querySelector('.content').appendChild(status);
        return status;
    }

    // Function to clear status messages
    function clearStatus(statusId) {
        const status = document.getElementById(statusId);
        if (status) {
            status.remove();
        }
    }

    // Function to show a success message
    function showSuccess(message, statusId) {
        const status = document.getElementById(statusId);
        if (status) {
            status.textContent = message;
            status.style.color = '#f62df5';
            
            // Auto-remove after 1 second
            setTimeout(() => {
                clearStatus(statusId);
            }, 1000);
        }
    }

    // Add event listener for "Process the Code" button
    if (processButton) {
        processButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the code from the textarea
            const code = codeInput.value.trim();

            // Check if code is not empty
            if (!code) {
                showError("Please paste or type some code before processing.", "process-error");
                return;
            }

            // Show processing status
            const statusElement = showStatus("Processing code...", "process-status");
            
            // Scroll to the status message
            setTimeout(() => {
                statusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            
            fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: code })
            })
            .then(response => response.text())
            .then(data => {
                // Display the analysis result
                if (analysisContainer) {
                    analysisContainer.style.display = 'block';
                }
                analysisContainer.innerHTML = data;
                showSuccess("", "process-status");
                
                // Scroll to the analysis container
                setTimeout(() => {
                    analysisContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            })
            .catch(error => {
                console.error("Error processing the code:", error);
                showError("Error processing the code. Please try again.", "process-error");
                clearStatus("process-status");
            });
        });
    }
};



//for the dashboard.html linkning to the github repo
document.addEventListener('DOMContentLoaded', function() {
    // Show the GitHub URL input when "Link to Github Repo" button is clicked
    const linkToGithubButton = document.querySelector('.aurora-glow-button3');
    const uploadCodeContainer = document.querySelector('.upload-code-container');
    const codeInputContainer = document.querySelector('.code-input-container');
    const analysisContainer = document.querySelector('.analysis-container');
    const processButton = document.querySelector('.aurora-glow-button4');
    
    linkToGithubButton.addEventListener('click', function(e) {
        e.preventDefault();
        uploadCodeContainer.style.display = 'flex';
        codeInputContainer.style.display = 'none';
        
        // Also hide the analysis container and process button
        if (analysisContainer) {
            analysisContainer.style.display = 'none';
        }
        
        if (processButton) {
            processButton.style.display = 'none';
        }
    });
    
    // Handle "View Stats" button click
    const viewStatsButton = document.getElementById('view-stats-button');
    viewStatsButton.addEventListener('click', async function() {
        const githubUrlInput = document.querySelector('.input-field');
        const errorMessage = document.getElementById('error-message');
        const url = githubUrlInput.value.trim();
        
        // Clear previous error message
        errorMessage.textContent = '';
        
        // Validate if it's a proper GitHub repository URL
        const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/([^/]+)\/([^/]+)\/?$/i;
        
        if (!githubUrlPattern.test(url)) {
            errorMessage.textContent = 'Invalid GitHub repository URL. Please enter a valid URL (e.g., https://github.com/username/repository)';
            githubUrlInput.focus();
            return;
        }
        
        // Extract username and repository name from the URL
        const match = url.match(githubUrlPattern);
        const username = match[2];
        const repository = match[3];
        
        // Check if the repository exists using GitHub API
        const apiUrl = `https://api.github.com/repos/${username}/${repository}`;
        
        // Use headers only if window.githubToken is defined.
        const headers = window.githubToken ? { Authorization: `token ${window.githubToken}` } : {};


        
        try {
            const response = await fetch(apiUrl, { headers });
            if (!response.ok) {
                throw new Error('Repository does not exist');
            }
            
            // Save URL to localStorage so dashboard.html can access it
            localStorage.setItem('repoUrl', url);
            
            // Redirect to dashboard.html
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorMessage.textContent = 'Repository does not exist. Please enter a valid GitHub repository URL.';
            githubUrlInput.focus();
        }
    });
});
