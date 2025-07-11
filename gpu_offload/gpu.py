from flask import Flask, request, jsonify
from llama_cpp import Llama
from pathlib import Path
import os

app = Flask(__name__)

# Load model once on startup
MODEL_PATH = "./models/mistral-7b-instruct-v0.1.Q4_K_M.gguf"
assert Path(MODEL_PATH).exists(), "Model file not found!"

llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=4096,      # Increased context size for more VRAM
    n_threads=os.cpu_count(),     # Adjust based on your CPU
    n_gpu_layers=-1  # Offload all layers to the GPU (for 16GB VRAM)
)

def text_to_markdown(text: str) -> str:
    prompt = f"""You are a Markdown generator.
Convert the following plain text to a rich Markdown document with:
- Proper headings
- Task lists
- Tables
- Links
- Images
- Quotes
- Footnotes
- Math formatting
- Code blocks
Use **bold** and *italic* where appropriate.

Input:
\"\"\"
{text.strip()}
\"\"\"

Markdown Output:
"""
    response = llm(prompt, max_tokens=1024, stop=["</s>"])
    return response["choices"][0]["text"].strip()

@app.route("/generate-markdown", methods=["POST"])
def generate_markdown():
    try:
        data = request.get_json()
        plain_text = data.get("input", "")
        markdown_output = text_to_markdown(plain_text)
        return jsonify({"markdown": markdown_output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # host=0.0.0.0 to accept external connections from tunnels
    # threaded=True to allow concurrent requests
    app.run(host="0.0.0.0", port=5000, threaded=True)
