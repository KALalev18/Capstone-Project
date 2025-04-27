# Capstone-Project

# How to run the project (MVP version 1.0)

## 1. Clone the repository: https://github.com/KALalev18/Capstone-Project.git
## 2. Open a new window with Visual Studio Code.
## 3. Paste the repository URL and select the designated folder to save the project. 
## 4. Go to: folder 'MVP' -> .env

## 5. How to generate a Groq API key

  5.1. Log in / register in [GroqCloud](https://console.groq.com/)
  5.2. Click on 'Creating your API key'
  5.3. Paste it on line 1, inside the double quotation marks

## 6. How to generate a Metepstat key

  6.1. Go to [Meteostat ](https://dev.meteostat.net/), and click 'JSON API' on the navigation menu
  6.2. Scroll down to the 'Sign Up' heading, and click [RapidAPI](https://rapidapi.com/signup)
  6.3. Sign up if you haven't. 
  6.4. If you can't redirect to the API, you can find it by clicking on your profile picture, then selecting 'User Settings', then from the left navigation menu, select the default application, created automatically after setting up your key.
  ![image](https://github.com/user-attachments/assets/50979a9e-3d51-45a0-a7cb-6f1e60deb919)
  6.5. By clicking the eye, you will get your meteostat key, which you can paste at line 2 in the .env file.
  6.6. Paste your Meteostat key on line 2, inside the double quotation marks

## 7. How to generate a GitHub API token

  7.1. Click the profile picture on your top right
  7.2. On the left navigation menu, click 'Developer settings'
  7.3. Again, on the new left navigation menu, click 'Personal access tokens', then click 'Tokens (classic)'
  7.4. On the right of 'Personal access tokens (classic)', click 'Generate new token', then click 'Generate new token'
  7.5. Type your password
  7.6. Name your token, set the expiration date, and for testing purposes, click all the ticks with the scopes, and click 'Generate token'.
  7.7. Paste your personal GitHub token inside the double quotation marks on line 3

## 8. Don't forget to run 'pip install -r requirements.txt' to install the requirements, with which you can run the project.
## 9. In the terminal, run: 'cd MVP'
## 10. Run 'npm install' to verify the node, 
## 11. Verify the installation with both 'node -v' and 'npm -v' commands
## 12. After that, run: 'node server.js'
## 13. http://localhost:3000/FrontPage.html is opened in the browser by default, and it should look like this:

![image](https://github.com/user-attachments/assets/ff311798-5c9c-4e84-ba20-b07e657f3782)

## 14. Paste and process the code feature:

![image](https://github.com/user-attachments/assets/db5a1032-02fa-4cdb-87ff-48b2e818fa13)

## 15. Upload, analyze the file, and generate a function graph based on the content

![image](https://github.com/user-attachments/assets/742a43b2-ca45-4f8f-9ea8-3ee59ee6aa8c)

![image](https://github.com/user-attachments/assets/992d1a8c-e04b-4b88-9e2c-734d05861189)

A special case is that you cannot generate a function graph for a file, with an extension different than the ones on the picture: py, js, java, html, css, c

![image](https://github.com/user-attachments/assets/25484ddb-ac96-43e2-b84f-a14c00a6b807)


## 16. Paste any GitHub repository link: 

![image](https://github.com/user-attachments/assets/e4ead2e1-42ef-44d8-b8a9-3aacf18e5197)

You must paste the cloned URL of the repository to receive the desired results.

Correct implementation:

![image](https://github.com/user-attachments/assets/6604b0e4-642e-425f-bac4-f8faf4fe8cbf)

Results (it takes a while to load, as the data has to be processed, be patient with enormous repositories, please):

![image](https://github.com/user-attachments/assets/b527af8a-90e6-4306-ad7a-370d13fa64e4)

The weather chart, SonarQube, and Average coding hours charts are connected to the calendar.

Due to limitations in Meteostat, we can generate only 2-3 charts at a time.

![image](https://github.com/user-attachments/assets/ea8f4164-6977-4818-a3f9-44e7631125f8)

If the SonarQube analysis states that there’s an error connecting, reload the page or paste the link again; it is an API timeout

[Test](https://sonarcloud.io/project/overview?id=microsoft_kiota)

![image](https://github.com/user-attachments/assets/f2243e4e-0d1e-4991-b6af-dd21ea1e383d)

The sentiment analysis chart is shown as in the picture; the commit analysis takes a while to load, after going from page to page it will load the chart with the latest updates automatically

![image](https://github.com/user-attachments/assets/651a545d-8cd9-41cc-84fa-3798fe897837)

## Optional: Setup a .venv

1. In the search bar, search '> Python: Create Environment'
2. Select the .venv option
3. Select any Python version you like
4. Select the 'requirements.txt' file to install the necessary dependencies. (If it doesn't show, use 'pip install -r requirements.txt' later on)
5. Run '.\.venv\Scripts\Activate' to start the .venv
6. Run 'python --version' and 'pip list' to check versions of Python and libraries respectively.

[Video with testing the MVP - TBD again](https://youtu.be/Ar1QXgED57g)

In case of any further requests, please let us know!
