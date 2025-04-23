document.getElementById('repoForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const owner = document.getElementById('owner').value;
    const repo = document.getElementById('repo').value;
    const resultsDiv = document.getElementById('commitResults');
    
    resultsDiv.innerHTML = 'Loading...';

    try {
        const response = await fetch(`/analyze/${owner}/${repo}`);
        const data = await response.json();

        resultsDiv.innerHTML = ''; // Clear loading message

        if (data.length === 0) {
            resultsDiv.innerHTML = 'No commits found or there was an error.';
            return;
        }

        data.forEach(commit => {
            const commitElement = document.createElement('div');
            commitElement.classList.add('resultItem');

            commitElement.innerHTML = `
                <h3>Commit by ${commit.author} on ${commit.date}</h3>
                <p><strong>Message Sentiment:</strong> ${commit.commitMessage.score >= 0 ? 'Positive' : 'Negative'}</p>
                <div><strong>Code Comments Sentiment:</strong></div>
                ${commit.codeComments.map(comment => `
                    <p>${comment.comment}: Sentiment: ${comment.score >= 0 ? 'Positive' : 'Negative'}</p>
                `).join('')}
            `;
            resultsDiv.appendChild(commitElement);
        });
    } catch (error) {
        console.error('Error fetching commit data:', error);
        resultsDiv.innerHTML = 'An error occurred while fetching the commit data.';
    }
});
