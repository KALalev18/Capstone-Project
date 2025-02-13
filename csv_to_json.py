import csv
import json

with open("sentiment_data.csv", mode="r", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    
    data = []
    for row in reader:
        structured_entry = {
            "ID": int(row["ID"]), 
            "Text": row["Text"],    
            "Sentiment": row["Sentiment"]  
        }
        data.append(structured_entry)


json_output = json.dumps(data, indent=4)


print(json_output)

with open("sentiment_data.json", "w", encoding="utf-8") as json_file:
    json_file.write(json_output)

print("✅ JSON file 'sentiment_data.json' has been created successfully!")
