#TODO: Get London weather data, then process it.

# Shows hourly weather data via pandas DataFrame. The last column is coco meaning the weather condition code.
# Weather code meanings: https://dev.meteostat.net/formats.html#weather-condition-codes

# Meteostat python hourly: https://dev.meteostat.net/python/api/hourly/
# Import Meteostat library and dependencies
from datetime import datetime
from meteostat import Hourly

# Example usage: Replace with frontend input
start = datetime(2001, 1, 1)
end_date = datetime.now()

# Get hourly data
def hourlyData(station_id, start_date, end_date):
    data = Hourly(station_id, start_date, end_date)
    return data.fetch()
# e.g data = Hourly('EGTK07', start, end)
# data = data.fetch()

# Print the data example
print(hourlyData('EGTK07', start, end_date))


# Shows GB region stations
#https://dev.meteostat.net/python/api/stations/count.html

"""from meteostat import Stations

stations = Stations()
stations = stations.region('GB')
stations = stations.fetch(100, sample=True)

print(stations)"""