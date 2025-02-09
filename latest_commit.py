import openai
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Fetch tokens from .env variables
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not GITHUB_TOKEN:
    raise ValueError("GitHub token is not set in the environment variables!")

if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key is not set in the environment variables!")

# Set the OpenAI API key for authentication
openai.api_key = OPENAI_API_KEY

GITHUB_API = "https://api.github.com/repos/KALalev18/Capstone-Project/commits"
GITHUB_REPO = "KALalev18/Capstone-Project"

GITHUB_HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": f"token {GITHUB_TOKEN}"
}

def get_commits_by_branch(branch="main"): 
    params = {"sha": branch}  # Specify branch name
    response = requests.get(GITHUB_API, headers=GITHUB_HEADERS, params=params)
    commit_data = response.json()
    
    if isinstance(commit_data, list) and commit_data:  # make sure it's not an empty list
        return [commit["commit"]["message"] for commit in commit_data]
    
    return None

def analyze_commit_description(text):
    try:
        # using the correct api method for the latest versions (depends from pc to pc)
        response = openai.Completion.create(
            model="gpt-3.5-turbo",
            prompt=f"Provide a brief description of this commit message: '{text}'",
            max_tokens=1000,  # token limit for the description
            temperature=0.5  # randomness of description
        )
        return response['choices'][0]['text'].strip()  # Retrieve the generated description
    except Exception as e:
        return f"Error: {str(e)}"

# Fetch commit messages for the branch you want
branch_name = "Cristian"
commit_messages = get_commits_by_branch(branch_name)

if commit_messages:
    print(f"\nLatest commits from '{branch_name}':")
    for i, msg in enumerate(commit_messages[:5], 1):  # latest 5 commits
        print(f"{i}. Commit message: {msg}")  # commit message
        description = analyze_commit_description(msg)  # description from OpenAI
        print(f"   AI Description: {description}")  # AI-generated description
else:
    print(f"\nNo commits found for branch '{branch_name}'.")

# fetch commits from the main branch
main_commit_messages = get_commits_by_branch("main")

if main_commit_messages:
    print(f"\nLatest commits from 'main' branch:")
    for i, msg in enumerate(main_commit_messages[:5], 1):  # latest 5 commits from main branch
        print(f"{i}. Commit message: {msg}")  # print the commit message
        description = analyze_commit_description(msg)  # description from OpenAI
        print(f"   AI Description: {description}")  # AI-generated description
else:
    print("\nNo commits found for the 'main' branch.")

# we need paid access to openai APIs to show ai description of a commit, we can ask PO