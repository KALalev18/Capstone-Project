#TODO: Get London weather data, then process it.

# Shows hourly weather data via pandas DataFrame. The last column is coco meaning the weather condition code.
# Weather code meanings: https://dev.meteostat.net/formats.html#weather-condition-codes

# Meteostat python hourly: https://dev.meteostat.net/python/api/hourly/
"""# Import Meteostat library and dependencies
from datetime import datetime
from meteostat import Hourly

# Set time period
start = datetime(2025, 1, 1)
end = datetime(2025, 3, 22)

# Get hourly data
data = Hourly('NY', start, end)
data = data.fetch()

# Print DataFrame
print(data)"""


# Shows GB region stations
#https://dev.meteostat.net/python/api/stations/count.html
"""
from meteostat import Stations

stations = Stations()
stations = stations.region('GB')
stations = stations.fetch(100, sample=True)

print(stations)"""