async function getJiraIssues() {
  // This function is designed to fetch issues from a Jira URL provided by the user using a POST request.
  // It takes user input for the Jira URL, API token, and user email.
  // It then sends a POST request to the local server to fetch issues from the Jira API.
  // If the request is successful, it displays the issues in a table format.
  // If there are no issues found, it displays a message indicating that no issues were found.
  // If there is an error, it displays an error message.
  const jiraUrl = document.getElementById('jira-url').value;
  const apiToken = document.getElementById('api-token').value;
  const userEmail = document.getElementById('user-email').value;

  const baseUrl = jiraUrl.replace(/\/jira\/software\/projects\/.*$/, '/rest/api/3/search');
  const errorContainer = document.getElementById('error-container');
  const issuesList = document.getElementById('issues-list');
  const issuesTableHeader = document.getElementById('issues-table-header');
  
  errorContainer.innerHTML = ''; // Clear previous error messages
  issuesList.innerHTML = ''; // Clear previous issues
  issuesTableHeader.innerHTML = ''; // Clear previous table header

  if (!baseUrl.includes('/rest/api/3/search')) {
    errorContainer.innerHTML = '<div class="error-message">Invalid URL</div>';
    return;
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/api/issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ baseUrl, apiToken, userEmail }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const issues = await response.json();

    if (issues.length === 0) {
      issuesList.innerHTML = '<h2>No issues found for this project</h2>';
      return;
    }

    issuesTableHeader.innerHTML = `
      <tr>
        <th>Issue Key</th>
        <th>Summary</th>
        <th>Assignee</th>
        <th>Reporter</th>
        <th>Status</th>
        <th>Created</th>
        <th>Resolved</th>
        <th>Duration</th>
      </tr>
    `;

    issuesList.innerHTML = issues.map(issue => {
      let statusClass = '';
      switch (issue.status.toLowerCase()) {
        case 'todo':
          statusClass = 'status-todo';
          break;
        case 'in progress':
          statusClass = 'status-in-progress';
          break;
        case 'done':
          statusClass = 'status-done';
          break;
        case 'dropped':
          statusClass = 'status-dropped';
          break;
        default:
          statusClass = '';
      }

      const createdDate = new Date(issue.created);
      const resolvedDate = issue.resolved !== "Unresolved" ? new Date(issue.resolved) : null;
      let duration = "Unresolved";
      if (resolvedDate) {
        const diffTime = Math.abs(resolvedDate - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        if (diffDays > 1) {
          duration = `${diffDays} days`;
        } else if (diffDays === 1) {
          duration = "1 day";
        } else {
          duration = `${diffHours} hours`;
        }
      }

      return `
        <tr>
          <td>${issue.key}</td>
          <td class="summary">${issue.summary}</td>
          <td>${issue.assignee}</td>
          <td>${issue.reporter}</td>
          <td><span class="issue-status ${statusClass}">${issue.status}</span></td>
          <td>${createdDate.toLocaleDateString()}</td>
          <td>${resolvedDate ? resolvedDate.toLocaleDateString() : "Unresolved"}</td>
          <td>${duration}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    errorContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
  }
}

