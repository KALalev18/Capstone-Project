# SSH key not working too, Vatsal try to fix this for the sprint

import requests
import pyodbc

AZURE_ENDPOINT = "https://YOUR_REGION.cognitiveservices.azure.com/" # this link might be different for you Vatsal
AZURE_KEY = "azure_key" # add your azure key 
SENTIMENT_API = AZURE_ENDPOINT + "text/analytics/v3.0/sentiment" # sentiment versionI have used in my azure

# azure sql db config (experimenting, you can do whatever)
SQL_SERVER = "sql_server.database.windows.net"
SQL_DATABASE = "db_name"
SQL_USERNAME = "username"
SQL_PASSWORD = "password"

GITHUB_API = "https://github.com/KALalev18/Capstone-Project"
GITHUB_HEADERS = {"Accept": "application/vnd.github.v3+json"} # version depending

# TL:DR - Review functions and implement new features in mind - for Vatsal

# Fetch latest commit message
def get_latest_commit():
    response = requests.get(GITHUB_API, headers=GITHUB_HEADERS)
    commit_data = response.json()
    return commit_data[0]['commit']['message'] if commit_data else None

# Analyze sentiment with azure cognitive services
def analyze_sentiment(text):
    headers = {"Ocp-Apim-Subscription-Key": AZURE_KEY, "Content-Type": "application/json"}
    data = {"documents": [{"id": "1", "language": "en", "text": text}]}
    response = requests.post(SENTIMENT_API, headers=headers, json=data)
    sentiment_result = response.json()
    return sentiment_result["documents"][0]["sentiment"] if "documents" in sentiment_result else "Unknown"

# Store results in azure sql database
def store_in_db(commit_message, sentiment):
    conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server '''Could be whatever version'''}};SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};UID={SQL_USERNAME};PWD={SQL_PASSWORD}"
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Create table if not exists
    cursor.execute("""
        IF NOT EXISTS (SELECT * FROM '''{table_name}''' WHERE name='commit_analysis' AND xtype='U')
        CREATE TABLE commit_analysis (id INT IDENTITY(1,1) PRIMARY KEY, commit_message TEXT, sentiment VARCHAR(50))
    """)

    # Insert commit message & sentiment
    cursor.execute("INSERT INTO commit_analysis (commit_message, sentiment) VALUES (?, ?)", (commit_message, sentiment))
    conn.commit()
    conn.close()

# need data gathering information to execute this
commit_msg = get_latest_commit()
if commit_msg:
    sentiment = analyze_sentiment(commit_msg)
    store_in_db(commit_msg, sentiment)
    print(f"Commit: {commit_msg}\nSentiment: {sentiment}")
else:
    print("No commit messages found.")
