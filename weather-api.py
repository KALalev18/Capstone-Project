import requests
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
import os
import matplotlib.pyplot as plt

#'Weather data provided by OpenWeather'
#Hyperlink to our website https://openweathermap.org/
# TODO: add logo according to the guidelines on the website for accreditation
# THIS NEEDS TO BE DONE ACCORDING TO THEIR WEBSITE

load_dotenv()
API_KEY = os.getenv('OPENWEATHER_API_KEY') # API key can be obtained from https://home.openweathermap.org/users/sign_up Get the free plan.
CITY = "London" # Any city
#	Hourly forecast: unavailable
#   Daily forecast: unavailable
#   Calls per minute: 60
#   3 hour forecast: 5 days



#### Demonstration of openweather API. We get the data here, we can process the data through the .csv we get ####
### Current weather data
def fetch_current_weather(city): # Fetch weather data for current weather with params.
    base_url = "http://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }
    
    try:
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        if response.status_code == 200:
            return {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "temp": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "weather_main": data["weather"][0]["main"],
                "weather_desc": data["weather"][0]["description"],
                "clouds": data["clouds"]["all"],
                "wind_speed": data["wind"]["speed"]
            }
        else:
            print(f"API Error: {data.get('message', 'Unknown error')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def store_weather_data(weather_data, file_path="weather_data.csv"):
    """Store weather data in a CSV file"""
    df = pd.DataFrame([weather_data])
    
    try:
        # Try to append to existing file
        existing_df = pd.read_csv(file_path)
        updated_df = pd.concat([existing_df, df], ignore_index=True)
        updated_df.to_csv(file_path, index=False)
    except FileNotFoundError:
        # Create new file if it doesn't exist
        df.to_csv(file_path, index=False)
        
    return True



### Forecast data (probably unnecessary, but here just in case)
def fetch_forecast(city): # Fetch weather data for forecast with params.
    base_url = "http://api.openweathermap.org/data/2.5/forecast"
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }
    
    try:
        response = requests.get(base_url, params=params, timeout=10)
        data = response.json()
        
        if response.status_code == 200:
            forecast_data = []
            for item in data["list"]:
                forecast_data.append({
                    "timestamp": item["dt_txt"],
                    "temp": item["main"]["temp"],
                    "humidity": item["main"]["humidity"],
                    "pressure": item["main"]["pressure"],
                    "weather_main": item["weather"][0]["main"],
                    "weather_desc": item["weather"][0]["description"],
                    "clouds": item["clouds"]["all"],
                    "wind_speed": item["wind"]["speed"]
                })
            return forecast_data
        else:
            print(f"API Error: {data.get('message', 'Unknown error')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def store_forecast_data(forecast_data, file_path="forecast_data.csv"):
    """Store forecast data in a CSV file"""
    df = pd.DataFrame(forecast_data)
    df.to_csv(file_path, index=False)
    return True



### Main
# Get and store current weather. TODO: Assess if the .csv should be in .gitignore and if we need to delete this data after usage.
weather_data = fetch_current_weather(CITY)
if weather_data:
    store_weather_data(weather_data)
    print(f"Current weather data for {CITY} has been stored.")

# Get and store forecast data.
forecast_data = fetch_forecast(CITY)
if forecast_data:
    store_forecast_data(forecast_data)
    print(f"5-day forecast for {CITY} has been stored.")