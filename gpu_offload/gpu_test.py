import requests

def request_markdown(server_url: str, input_text: str):
    url = f"{server_url}/generate-markdown"
    headers = {"Content-Type": "application/json"}
    payload = {"input": input_text}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=1800)
        response.raise_for_status()
        data = response.json()
        if "markdown" in data:
            return data["markdown"]
        else:
            return f"Error from server: {data.get('error', 'Unknown error')}"
    except requests.RequestException as e:
        return f"Request failed: {e}"

if __name__ == "__main__":
    SERVER_URL = "https://chilly-lemons-matter.loca.lt/"  # Replace with your actual tunnel URL

    sample_text = """
    Balthazar
    """

    result = request_markdown(SERVER_URL, sample_text)
    print("Response from GPU server:\n")
    print(result)