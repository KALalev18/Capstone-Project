from datetime import datetime, timedelta
from meteostat import Hourly, Stations
from geopy.geocoders import Nominatim
import warnings
import pandas as pd
import json

warnings.filterwarnings("ignore", category=FutureWarning)

weather_conditions = {
    1: "Clear", 2: "Fair", 3: "Cloudy", 4: "Overcast", 5: "Fog", 6: "Freezing Fog",
    7: "Light Rain", 8: "Rain", 9: "Heavy Rain", 10: "Freezing Rain", 11: "Heavy Freezing Rain",
    12: "Sleet", 13: "Heavy Sleet", 14: "Light Snowfall", 15: "Snowfall", 16: "Heavy Snowfall",
    17: "Rain Shower", 18: "Heavy Rain Shower", 19: "Sleet Shower", 20: "Heavy Selt Shower",
    21: "Snow Shower", 22: "Heavy Snow Shower", 23: "Lightning", 24: "Hail", 25: "Thunderstorm",
    26: "Heavy Thunderstorm", 27: "Storm"
}


def interpolate_coco(data):
    data = data.sort_index()
    for i in range(len(data)):
        if pd.isna(data.iloc[i]['coco']):
            original_index = data.index[i]
            for offset in range(1, 4):
                prev_hour = original_index - timedelta(hours=offset)
                if prev_hour in data.index and not pd.isna(data.loc[prev_hour, 'coco']):
                    data.at[original_index, 'coco'] = data.loc[prev_hour, 'coco']
                    break
                next_hour = original_index + timedelta(hours=offset)
                if next_hour in data.index and not pd.isna(data.loc[next_hour, 'coco']):
                    data.at[original_index, 'coco'] = data.loc[next_hour, 'coco']
                    break
    return data


def get_best_station(city_name):
    geolocator = Nominatim(user_agent="weather_app")
    location = geolocator.geocode(city_name)
    if not location:
        raise ValueError(f"City '{city_name}' not found.")
    print(f"Coordinates for '{city_name}': Latitude={location.latitude}, Longitude={location.longitude}")
    stations = Stations().nearby(location.latitude, location.longitude)
    station_list = stations.fetch(10)
    if station_list.empty:
        raise ValueError(f"No weather stations found for '{city_name}'.")
    print("Available Stations:")
    print(station_list)
    for _, station in station_list.iterrows():
        station_id = station.name
        print(f"Trying station ID: {station_id}")
        start = datetime(2018, 1, 1)
        end = datetime(2018, 12, 31, 23, 59)
        data = Hourly(station_id, start, end).fetch()
        if not data.empty and not data['coco'].isna().all():
            print(f"Selected station ID: {station_id} with valid data")
            return station_id
    raise ValueError(f"No station with valid data found for '{city_name}'.")


def fetch_weather_data(city_name, start_date, end_date):
    try:
        station_id = get_best_station(city_name)
        print(f"Using weather station ID: {station_id} for '{city_name}'")
        data = Hourly(station_id, start_date, end_date).fetch()
        data = interpolate_coco(data)

        # Print the header
        print("\nDate\t\tTime\t\tWeather Condition")
        print("-" * 40)

        # Print data on screen
        for index, row in data.iterrows():
            date_time = index
            coco = row.get('coco')
            if pd.isna(coco):
                weather_condition = "No Data"
            elif coco == 0.0:
                weather_condition = "No Data"
            else:
                weather_condition = weather_conditions.get(coco, f"Code {coco}")
            print(f"{date_time.strftime('%Y-%m-%d')}\t{date_time.strftime('%H:%M:%S')}\t{weather_condition}")

        # Save data to JSON file
        data_dict = data.reset_index().to_dict(orient='records')
        with open('weather_data.json', 'w') as f:
            json.dump(data_dict, f, default=str)
        print("\nWeather data saved to 'weather_data.json'")
    except Exception as e:
        print(f"Error: {e}")


city_name = input("Enter the name of the city: ").strip()
start_date = datetime.strptime(input("Enter start date (YYYY-MM-DD): "), "%Y-%m-%d")
end_date = datetime.strptime(input("Enter end date (YYYY-MM-DD): "), "%Y-%m-%d")
fetch_weather_data(city_name, start_date, end_date)