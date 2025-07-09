import os
import requests
from tqdm import tqdm

MODEL_URL = "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
MODEL_PATH = "/models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"

def download_model():
    if os.path.exists(MODEL_PATH):
        print("✅ GGUF model already exists at:", MODEL_PATH)
        return MODEL_PATH

    print("⬇️ Downloading GGUF model from Hugging Face...")
    response = requests.get(MODEL_URL, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    block_size = 1024 * 1024  # 1 MB
    with open(MODEL_PATH, 'wb') as f, tqdm(total=total_size, unit='iB', unit_scale=True) as bar:
        for data in response.iter_content(block_size):
            bar.update(len(data))
            f.write(data)

    print("✅ Download complete. Saved to:", MODEL_PATH)
    return MODEL_PATH
