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
                codeInput.focus();
                codeInputContainer.scrollIntoView({ behavior: 'smooth' });
                processButton.style.display = 'block';
            }
        });
    }
    
    // Show GitHub repo input container when "Link to Github Repo" button is clicked
    if (linkButton) {
        linkButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor behavior
            if (codeInputContainer) {
                codeInputContainer.style.display = 'none';
            }
            if (uploadCodeContainer) {
                uploadCodeContainer.style.display = 'flex';
                const inputField = uploadCodeContainer.querySelector('.input-field');
                if (inputField) {
                    inputField.focus();
                }
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
        const lines = codeInput.value.split('\n');
        const lineCount = lines.length || 1;
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
            
            if (i === currentLineNumber) {
                lineDiv.classList.add('current-line');
            }
            
            lineNumbers.appendChild(lineDiv);
        }
        
        adjustHeights();
    }
    
    // Function to adjust heights of both elements
    function adjustHeights() {
        const lineCount = codeInput.value.split('\n').length || 1;
        const calculatedHeight = Math.max(400, lineCount * 19 + 20);
        codeInput.style.height = `${calculatedHeight}px`;
        lineNumbers.style.height = `${calculatedHeight}px`;
    }
    
    updateLineNumbers();
    
    // Add event listeners
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('keyup', updateLineNumbers);
    codeInput.addEventListener('click', updateLineNumbers);
    codeInput.addEventListener('mouseup', updateLineNumbers);
    
    // Enhanced paste event handling
    codeInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const clipboardData = e.clipboardData || window.clipboardData;
        const pastedText = clipboardData.getData('text');
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + pastedText + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + pastedText.length;
        updateLineNumbers();
        codeInput.scrollTop = 0;
    });
    
    // Sync horizontal scrolling only
    codeInput.addEventListener('scroll', function() {});

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
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
            updateLineNumbers();
        } else if (e.key === 'Enter') {
            setTimeout(updateLineNumbers, 0);
        } else {
            setTimeout(updateLineNumbers, 0);
        }
    });
    
    // Implement fetchData function for GitHub repo button
    window.fetchData = function() {
        const inputField = document.querySelector('.input-field');
    };

    // Add event listener for "Process the Code" button
    // Add event listener for "Process the Code" button
if (processButton) {
    processButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (analysisContainer) {
            analysisContainer.style.display = 'block';
        }
        // Get the code from the textarea
        const code = codeInput.value.trim();

        // Check if code is not empty
        if (!code) {
            alert("Please paste or type some code before processing.");
            return;
        }

        // REPLACE THIS SECTION:
        // const formData = new FormData();
        // formData.append("code", code);
        // fetch('/analyze', {
        //     method: 'POST',
        //     body: formData
        // })

        // WITH THIS:
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
           
            analysisContainer.innerHTML = data;
        })
        .catch(error => {
            console.error("Error processing the code:", error);
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
    
    linkToGithubButton.addEventListener('click', function(e) {
        e.preventDefault();
        uploadCodeContainer.style.display = 'flex';
        codeInputContainer.style.display = 'none';
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
