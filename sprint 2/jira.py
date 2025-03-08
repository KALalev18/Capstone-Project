import requests, json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/issues', methods=['POST'])
def get_issues():
    # Get the data from the request input
    data = request.json
    base_url = data.get('baseUrl')
    user = data.get('userEmail')
    pwd = data.get('apiToken')

    if not base_url or not user or not pwd:
        return "Invalid Token or Email", 400

    try:
        response = requests.get(base_url, headers={
            "Accept": "application/json",
            "Content": "application/json"
        }, auth=(user, pwd))

        if response.status_code == 401:
            return "This token is not authorized for this Jira URL", 401
        elif response.status_code == 403:
            return "The email is not connected or authorized to the said Jira URL", 403
        elif response.status_code != 200:
            return "Failed to fetch issues", response.status_code

        issues = response.json()["issues"]
        # Extract the necessary information from the issues and return it
        issues_list = [
            {
                "key": issue["key"],
                "summary": issue["fields"]["summary"],
                "status": issue["fields"]["status"]["name"],
                "reporter": issue["fields"]["reporter"]["displayName"] if issue["fields"]["reporter"] else "Unknown",
                "created": issue["fields"]["created"],
                "resolved": issue["fields"]["resolutiondate"] if issue["fields"]["resolutiondate"] else "Unresolved",
                "assignee": issue["fields"]["assignee"]["displayName"] if issue["fields"]["assignee"] else "Unassigned"
            }
            for issue in issues
        ]
        return jsonify(issues_list)
    except requests.exceptions.RequestException as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(debug=True)