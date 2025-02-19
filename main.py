import os
from flask import Flask, render_template, request
from groq import Groq

app = Flask(__name__)

# api key
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# Initialize the Groq client
client = Groq(api_key=GROQ_API_KEY)

@app.route('/jira')
def jira():
    return render_template('jira.html')

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # error handling for upload
        if 'file' not in request.files:
            return "No file part"

        file = request.files['file']

        # error handling for upload
        if file.filename == '':
            return "No selected file"

        code_content = file.read().decode('utf-8')

        # store response
        analysis_result = analyze_code_with_groq(code_content)
        return render_template('index.html', analysis=analysis_result)

    # for err
    return render_template('index.html', analysis=None)


def analyze_code_with_groq(code_content):
    prompt = f"""
    Analyze the following code and provide insights or suggestions for improvement:
    ```
    {code_content}
    ```
    """
    try:
        #process input
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes code."},
                {"role": "user", "content": prompt}
            ],
            model="mixtral-8x7b-32768",  #maybe change to deepseek idk we'll see
            max_tokens=500,
            temperature=0.7  # numbers for test
        )

        analysis = chat_completion.choices[0].message.content.strip()
        return analysis

    except Exception as e:
        return f"An error occurred while communicating with the Groq API: {e}"


if __name__ == '__main__':
    app.run(debug=True)