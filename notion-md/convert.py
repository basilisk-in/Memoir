import subprocess
import json
import sys

def convert_markdown_to_notion(input_md_path):
    result = subprocess.run(
        ['node', 'markdown_to_notion.js', input_md_path],
        capture_output=True,
        text=True,
        check=True
    )
    data = json.loads(result.stdout)
    return data["blocks"], data["richText"]

if __name__ == "__main__":
    blocks, richtext = convert_markdown_to_notion("example.md")

    with open("notion_blocks.json", "w", encoding="utf-8") as f:
        json.dump(blocks, f, indent=2, ensure_ascii=False)

    with open("notion_richtext.json", "w", encoding="utf-8") as f:
        json.dump(richtext, f, indent=2, ensure_ascii=False)

    print("✅ Saved blocks and rich text JSON")
