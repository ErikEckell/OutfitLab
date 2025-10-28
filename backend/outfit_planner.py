# OufitLab\backend\outfit_planner.py
from google import genai
from dotenv import load_dotenv
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
api_key = os.getenv("GOOGLE_API_KEY")

def generate_outfit_recommendation(weather_data, clothing_items):
    """
    clothing_items: lista de diccionarios como tu GET
    weather_data: string con la información del clima
    """
    print("clothing_items: ", clothing_items)
    client = genai.Client(api_key=api_key)

    simplified_items = [
        {
            "id": item["id"],
            "type": item["type"]["name"],
            "main_color": item["main_color"],
            "formality": item["formality"],
            "category": item["type"]["category"]
        }
        for item in clothing_items
    ]

    prompt = f"""
    You are a fashion assistant. Based on the following weather info:
    {weather_data}
    and the following clothing items:
    {simplified_items}
    Recommend an outfit. Consider colors (they should match), formality, and weather.
    Return ONLY ONE OF EACH CATEGORY (e.g. one TOP, one BOTTOM, etc.) if available.
    Return ONLY a JSON array with the IDs of the recommended clothing items. 
    Example: [1, 3]
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    try:
        recommended_ids = json.loads(response.text)
        if not isinstance(recommended_ids, list):
            recommended_ids = []
    except json.JSONDecodeError:
        recommended_ids = []
    print("recommended_ids: ", recommended_ids)
    return recommended_ids



clothing_items_example = [
    {
        "id": 1,
        "type": {"id": 1, "name": "T-shirt", "category": "Top"},
        "main_color": "blue",
        "formality": "casual"
    },
    {
        "id": 2,
        "type": {"id": 2, "name": "Jeans", "category": "Bottom"},
        "main_color": "black",
        "formality": "casual"
    },
    {
        "id": 3,
        "type": {"id": 3, "name": "Blazer", "category": "Top"},
        "main_color": "grey",
        "formality": "formal"
    }
]

weather_data_example = "Sunny, 75°F"

recommended_ids = generate_outfit_recommendation(weather_data_example, clothing_items_example)
print("Prendas recomendadas (IDs):", recommended_ids)
