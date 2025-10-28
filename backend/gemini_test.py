from google import genai
from dotenv import load_dotenv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("❌ No se encontró GOOGLE_API_KEY en el archivo .env")

client = genai.Client(api_key=api_key)

query = "Help me create an outfit for today considering it's a sunny day. Give me the hex colors for each piece of clothing and the clothing type, and keep the answer concise."

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=query
)

print(query)
print(response.text)
