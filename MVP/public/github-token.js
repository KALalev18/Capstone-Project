// Simple GitHub token fetcher
(function() {
  // Fetch token on page load
  window.fetchGithubToken = async function() {
    if (window.githubToken) {
      return window.githubToken; // Return existing token if already fetched
    }
    
    try {
      const response = await fetch('/api/github-token');
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub token');
      }
      const data = await response.json();
      window.githubToken = data.token;
      console.log('GitHub token loaded successfully');
      return window.githubToken;
    } catch (error) {
      console.error('Error fetching GitHub token:', error);
      throw error;
    }
  };
  
  // Start the fetch immediately
  fetchGithubToken();
})();