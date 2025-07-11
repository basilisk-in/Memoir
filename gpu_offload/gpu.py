from flask import Flask, request, jsonify
from llama_cpp import Llama
from pathlib import Path
import os
from paddleocr import PaddleOCR
from pdf2image import convert_from_path
from PIL import Image
import tempfile
import numpy as np

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

# Initialize PaddleOCR
ocr = PaddleOCR(
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
)

def extract_text_using_paddleocr(image):
    result = ocr.ocr(np.array(image), cls=False)
    final_result = ""
    for line in result:
        for res in line:
            final_result += f"{res[1][0]} "
    return final_result.strip()

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

@app.route("/generate-ocr", methods=["POST"])
def generate_ocr():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part in the request"}), 400
        file = request.files['file']
        filename = file.filename.lower()
        # Save to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=filename[-4:]) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        extracted_text = ""
        if filename.endswith('.pdf'):
            images = convert_from_path(tmp_path, dpi=100)
            for i, image in enumerate(images):
                page_text = extract_text_using_paddleocr(image)
                if page_text.strip():
                    extracted_text += f"\n--- Page {i + 1} (OCR) ---\n"
                    extracted_text += page_text
        elif filename.endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif')):
            image = Image.open(tmp_path)
            extracted_text = extract_text_using_paddleocr(image)
        else:
            return jsonify({"error": f"Unsupported file type: {filename}"}), 400
        os.remove(tmp_path)
        return jsonify({"extracted_text": extracted_text.strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # host=0.0.0.0 to accept external connections from tunnels
    # threaded=True to allow concurrent requests
    app.run(host="0.0.0.0", port=5000, threaded=True)
