import unittest
from unittest.mock import patch, MagicMock
import openai
import requests
from latest_commit import get_commits_by_branch, analyze_commit_description  # Replace 'latest_commit' with your script's filename

class TestGitHubAndOpenAITests(unittest.TestCase):

    # Test for get_commits_by_branch
    @patch('requests.get')
    def test_get_commits_by_branch_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {"commit": {"message": "Initial commit"}},
            {"commit": {"message": "Added new feature"}},
        ]
        mock_get.return_value = mock_response

        branch_name = "Vatsal"
        result = get_commits_by_branch(branch_name)
        
        self.assertEqual(result, ["Initial commit", "Added new feature"])

    @patch('requests.get')
    def test_get_commits_by_branch_no_commits(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = []
        mock_get.return_value = mock_response

        branch_name = "Cristian"
        result = get_commits_by_branch(branch_name)
        
        self.assertIsNone(result)

    @patch('requests.get')
    def test_get_commits_by_branch_error(self, mock_get):
        mock_get.side_effect = requests.exceptions.RequestException("Error occurred")
        
        branch_name = "Vatsal"
        result = get_commits_by_branch(branch_name)
        
        self.assertIsNone(result)

    @patch('requests.get')
    def test_get_commits_by_branch_error(self, mock_get):
        mock_get.side_effect = requests.exceptions.RequestException("Error occurred")
        
        branch_name = "Cristian"
        result = get_commits_by_branch(branch_name)
        
        self.assertIsNone(result)

    @patch('openai.Completion.create')
    def test_analyze_commit_description_success(self, mock_create):
        # Mocking the OpenAI API response
        mock_create.return_value = {
            'choices': [{'text': 'This commit updates the README file'}]
        }

        commit_message = "Update README.md"
        result = analyze_commit_description(commit_message)
        
        self.assertEqual(result, "This commit updates the README file")

    @patch('openai.Completion.create')
    def test_analyze_commit_description_error(self, mock_create):
        mock_create.side_effect = Exception("OpenAI API error")
        
        commit_message = "Update README.md"
        result = analyze_commit_description(commit_message)
        
        self.assertEqual(result, "Error: OpenAI API error")

if __name__ == '__main__':
    unittest.main()
