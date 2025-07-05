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
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
    }
    
    payload = {
        "properties": {
            "title": [{"text": {"content": title}}]
        },
        "children": blocks
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