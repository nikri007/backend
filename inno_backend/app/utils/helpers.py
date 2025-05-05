import json

def ensure_json_string(data):
    """Convert data to JSON string if it's not already a string"""
    if isinstance(data, str):
        try:
            # Make sure it's a valid JSON string
            json.loads(data)
            return data
        except:
            # If not valid JSON, convert it to a JSON string
            return json.dumps([data])
    # If data is a list or other structure, convert to JSON string
    return json.dumps(data)

def parse_phone_numbers(phone_numbers):
    """Parse phone numbers from various formats to a list"""
    if not phone_numbers:
        return []
    if isinstance(phone_numbers, list):
        return phone_numbers
    if isinstance(phone_numbers, str):
        try:
            return json.loads(phone_numbers)
        except:
            return [phone_numbers]
    return []