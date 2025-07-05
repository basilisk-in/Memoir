"""
Notion OAuth2 and API utility functions.
"""

import requests
import json
import re
from django.conf import settings
from .models import NotionIntegration


def get_notion_authorization_url():
    """
    Generate Notion OAuth2 authorization URL.
    
    Returns:
        str: Authorization URL
    """
    params = {
        'client_id': settings.NOTION_CLIENT_ID,
        'redirect_uri': settings.NOTION_REDIRECT_URI,
        'response_type': 'code',
        'owner': 'user',
        'scope': 'insert:content,read:content'
    }
    
    query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
    return f"{settings.NOTION_AUTHORIZATION_URL}?{query_string}"


def exchange_code_for_token(code):
    """
    Exchange authorization code for access token.
    
    Args:
        code (str): Authorization code from Notion
        
    Returns:
        dict: Token response from Notion
    """
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': settings.NOTION_REDIRECT_URI,
    }
    
    response = requests.post(
        settings.NOTION_TOKEN_URL,
        auth=(settings.NOTION_CLIENT_ID, settings.NOTION_CLIENT_SECRET),
        json=data
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to exchange code for token: {response.text}")


def get_notion_workspace_info(access_token):
    """
    Get workspace information from Notion.
    
    Args:
        access_token (str): Notion access token
        
    Returns:
        dict: Workspace information
    """
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        f"{settings.NOTION_API_BASE_URL}/users/me",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to get workspace info: {response.text}")


def markdown_to_notion_blocks(markdown_text):
    """
    Convert markdown text to Notion blocks.
    
    Args:
        markdown_text (str): Markdown text to convert
        
    Returns:
        list: List of Notion blocks
    """
    blocks = []
    lines = markdown_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Handle headings
        if line.startswith('#'):
            level = len(line) - len(line.lstrip('#'))
            if level > 3:
                level = 3  # Notion supports up to 3 heading levels
            
            text = line.lstrip('#').strip()
            blocks.append({
                "object": "block",
                "type": f"heading_{level}",
                f"heading_{level}": {
                    "rich_text": [{"type": "text", "text": {"content": text}}]
                }
            })
        
        # Handle bullet points
        elif line.startswith('- ') or line.startswith('* '):
            text = line[2:].strip()
            blocks.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": text}}]
                }
            })
        
        # Handle numbered lists
        elif re.match(r'^\d+\.\s', line):
            text = re.sub(r'^\d+\.\s', '', line).strip()
            blocks.append({
                "object": "block",
                "type": "numbered_list_item",
                "numbered_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": text}}]
                }
            })
        
        # Handle code blocks
        elif line.startswith('```'):
            # Simple code block handling
            blocks.append({
                "object": "block",
                "type": "code",
                "code": {
                    "rich_text": [{"type": "text", "text": {"content": line[3:]}}],
                    "language": "plain text"
                }
            })
        
        # Handle bold text
        elif '**' in line:
            # Simple bold text handling
            text = line.replace('**', '').strip()
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{
                        "type": "text",
                        "text": {"content": text},
                        "annotations": {"bold": True}
                    }]
                }
            })
        
        # Default to paragraph
        else:
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": line}}]
                }
            })
    
    return blocks


def debug_blocks(blocks, prefix=""):
    """
    Debug function to log block structure.
    
    Args:
        blocks (list): List of Notion blocks
        prefix (str): Prefix for logging
    """
    for i, block in enumerate(blocks):
        if isinstance(block, dict):
            block_type = block.get("type", "unknown")
            print(f"{prefix}Block {i}: {block_type}")
            
            if block_type == "table":
                table = block.get("table", {})
                width = table.get("table_width", 0)
                children = table.get("children", [])
                print(f"{prefix}  Table width: {width}, Children: {len(children)}")
                
                for j, child in enumerate(children):
                    if child.get("type") == "table_row":
                        cells = child.get("table_row", {}).get("cells", [])
                        print(f"{prefix}    Row {j}: {len(cells)} cells")
                        for k, cell in enumerate(cells):
                            if isinstance(cell, list) and len(cell) > 0:
                                content = cell[0].get("text", {}).get("content", "")
                                print(f"{prefix}      Cell {k}: '{content}'")


def validate_and_fix_notion_blocks(blocks):
    """
    Validate and fix Notion blocks to ensure they meet Notion's requirements.
    Specifically handles table structure issues.
    
    Args:
        blocks (list): List of Notion blocks
        
    Returns:
        list: Fixed and validated blocks
    """
    if not blocks:
        return blocks
    
    # Debug the incoming blocks
    print("🔍 Debugging incoming blocks:")
    debug_blocks(blocks, "  ")
    
    fixed_blocks = []
    
    for block in blocks:
        if not isinstance(block, dict):
            continue
            
        # Handle table blocks specifically
        if block.get("type") == "table":
            table_block = block.get("table", {})
            table_width = table_block.get("table_width", 0)
            children = table_block.get("children", [])
            
            # If no table width is specified, try to infer it from the first row
            if table_width == 0 and children:
                first_row = children[0]
                if first_row.get("type") == "table_row":
                    cells = first_row.get("table_row", {}).get("cells", [])
                    table_width = len(cells)
                    print(f"🔧 Inferred table width: {table_width}")
            
            # Fix table rows to match table width
            fixed_children = []
            for child in children:
                if child.get("type") == "table_row":
                    cells = child.get("table_row", {}).get("cells", [])
                    
                    # Ensure we have the right number of cells
                    while len(cells) < table_width:
                        cells.append([{"type": "text", "text": {"content": ""}}])
                    
                    # Truncate if too many cells
                    if len(cells) > table_width:
                        cells = cells[:table_width]
                    
                    fixed_child = {
                        "object": "block",
                        "type": "table_row",
                        "table_row": {"cells": cells}
                    }
                    fixed_children.append(fixed_child)
            
            # Create fixed table block
            fixed_table = {
                "object": "block",
                "type": "table",
                "table": {
                    "table_width": table_width,
                    "has_column_header": table_block.get("has_column_header", False),
                    "has_row_header": table_block.get("has_row_header", False),
                    "children": fixed_children
                }
            }
            fixed_blocks.append(fixed_table)
            print(f"🔧 Fixed table with width {table_width} and {len(fixed_children)} rows")
            
        else:
            # For non-table blocks, just add them as-is
            fixed_blocks.append(block)
    
    # Debug the fixed blocks
    print("🔍 Debugging fixed blocks:")
    debug_blocks(fixed_blocks, "  ")
    
    return fixed_blocks


def create_notion_page(access_token, title, blocks, parent_id=None):
    """
    Create a new page in Notion.
    
    Args:
        access_token (str): Notion access token
        title (str): Page title
        blocks (list): List of Notion blocks
        parent_id (str, optional): Parent page/database ID
        
    Returns:
        dict: Created page information
    """
    # Validate and fix blocks before sending to Notion
    fixed_blocks = validate_and_fix_notion_blocks(blocks)
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
    }
    
    payload = {
        "properties": {
            "title": [{"text": {"content": title}}]
        },
        "children": fixed_blocks
    }
    
    # Set parent
    if parent_id:
        payload["parent"] = {"type": "page_id", "page_id": parent_id}
    else:
        payload["parent"] = {"type": "workspace", "workspace": True}
    
    response = requests.post(
        f"{settings.NOTION_API_BASE_URL}/pages",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to create Notion page: {response.text}")


def get_user_notion_integration(user):
    """
    Get or create Notion integration for a user.
    
    Args:
        user: Django User instance
        
    Returns:
        NotionIntegration: User's Notion integration
    """
    integration, created = NotionIntegration.objects.get_or_create(user=user)
    return integration 