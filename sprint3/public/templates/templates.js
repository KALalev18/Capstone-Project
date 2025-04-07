

document.addEventListener('DOMContentLoaded', function() {
    const commitsField = document.getElementById('commits');
    const progressField = document.getElementById('progressChart');
    const branchField = document.getElementById('branches');
    const issueField = document.getElementById("issue");
    const PRField = document.getElementById("prs");
    const deploymentField = document.getElementById("deployment");
    const contributorsField = document.getElementById("contributor");
    


    if ( progressField) {
        progressField.addEventListener('click', async function() {

            window.location.href = 'templates/commit.html';
          
        });
    }
    if ( commitsField) {
        commitsField.addEventListener('click', async function() {

            window.location.href = 'templates/commit.html';
          
        });
    }

    if ( branchField ) {
        branchField.addEventListener('click', async function() {

            window.location.href = 'templates/branches.html';
          
        });
    }


    if ( issueField ) {
        issueField.addEventListener('click', async function() {

            window.location.href = 'templates/issues.html';
          
        });
    }
    if ( PRField ) {
        PRField.addEventListener('click', async function() {

            window.location.href = 'templates/prs.html';
          
        });
    }
    if ( deploymentField ) {
        deploymentField.addEventListener('click', async function() {

            window.location.href = 'templates/deployments.html';
          
        });
    }
    if ( contributorsField ) {
        contributorsField.addEventListener('click', async function() {

            window.location.href = 'templates/contributors.html';
          
        });
    }
    





 
});



// //for the dashboard.html linkning to the github repo
// document.addEventListener('DOMContentLoaded', function() {
    
   

//     // Handle "View Stats" button click
//     const commitsField = document.getElementById('commits');
//     commitsField.onclick = function(){alert('hi');};
//     commitsField.addEventListener('click', async function() {
//         console.log("Here")
//         const githubUrlInput = document.querySelector('.input-field');
//         const errorMessage = document.getElementById('error-message');
//         const url = githubUrlInput.value.trim();
        
//         // Clear previous error message
//         errorMessage.textContent = '';
        
//         // Validate if it's a proper GitHub repository URL
//         const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/([^/]+)\/([^/]+)\/?$/i;
        
//         if (!githubUrlPattern.test(url)) {
//             errorMessage.textContent = 'Invalid GitHub repository URL. Please enter a valid URL (e.g., https://github.com/username/repository)';
//             githubUrlInput.focus();
//             return;
//         }
        
//         // Extract username and repository name from the URL
//         const match = url.match(githubUrlPattern);
//         const username = match[2];
//         const repository = match[3];
        
//         // Check if the repository exists using GitHub API
//         const apiUrl = `https://api.github.com/repos/${username}/${repository}`;
        
//         // Use headers only if window.githubToken is defined.
//         const headers = window.githubToken ? { Authorization: `token ${window.githubToken}` } : {};


        
//         try {
//             const response = await fetch(apiUrl, { headers });
//             if (!response.ok) {
//                 throw new Error('Repository does not exist');
//             }
            
//             // Save URL to localStorage so dashboard.html can access it
//             localStorage.setItem('repoUrl', url);
            
//             // Redirect to dashboard.html
//             window.location.href = 'dashboard.html';
//         } catch (error) {
//             errorMessage.textContent = 'Repository does not exist. Please enter a valid GitHub repository URL.';
//             githubUrlInput.focus();
//         }
//     });
// });
