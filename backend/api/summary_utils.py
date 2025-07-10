"""
Summary generation utility functions for processing OCR text.
This is a dummy implementation for demonstration purposes.
"""

import re
from .models import NoteSummary, OCRResult
from llama_cpp import Llama
from pathlib import Path
from django.conf import settings
from .download_model import download_model

# MODEL_PATH = download_model()
# MODEL_PATH = Path(settings.BASE_DIR / "api" / "models" / "mistral-7b-instruct-v0.1.Q4_K_M.gguf")
MODEL_PATH = Path("models/mistral-7b-instruct-v0.1.Q4_K_M.gguf")
# Initialize LLaMA model (load once)
#ADJUST THESE VALUES BASED ON YOUR SYSTEM CAPABILITIES
llm = Llama(
    model_path=str(MODEL_PATH),
    n_ctx=4096,        # Can try 6144 or 8192 if memory allows
    n_threads=8,       # Matches your physical core count
    n_gpu_layers=35    # Good balance for 12GB VRAM with Q4_K_M GGUF model
)

def clean_text(text):
    """
    Clean and preprocess text for summarization.
    
    Args:
        text (str): Raw text to clean
        
    Returns:
        str: Cleaned text
    """
    if not text:
        return ""
    
    # Remove extra whitespace and newlines
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?;:\-]', '', text)
    
    return text.strip()


def generate_advanced_summary(text):
    """
    Generate a more detailed summary with key points.
    
    Args:
        text (str): Text to summarize
        
    Returns:
        str: Detailed summary with structure
    """
    prompt = f"""
        You are a Markdown generator.
        Ensure that you take into account what is actually present in the input if there are no tables don't create tables forcefully etc,
        make sure you stick to the input while converting.
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
    raw_string = response["choices"][0]["text"].strip()

    lines = raw_string.split('\n')
    cleaned_lines = [line.strip() for line in lines if line.strip()]
    return '\n'.join(cleaned_lines)


def process_note_summary(note):
    """
    Generate summary for a note based on its OCR result.
    
    Args:
        note: Note model instance
        
    Returns:
        NoteSummary: The created summary object
    """
    try:
        # Get or create OCR result first
        ocr_result = getattr(note, 'ocr_result', None)
        if not ocr_result:
            # Import here to avoid circular imports
            from .ocr_utils import process_note_ocr
            ocr_result = process_note_ocr(note)
        
        # Generate summary from OCR text
        summary_text = generate_advanced_summary(ocr_result.extracted_text)
        print(summary_text)  # Debug output
        
        # Create or update summary
        summary, created = NoteSummary.objects.get_or_create(
            note=note,
            defaults={'summary_text': summary_text}
        )
        
        if not created:
            summary.summary_text = summary_text
            summary.save()
        
        return summary
    
    except Exception as e:
        print(f"Error generating summary for note {note.id}: {str(e)}")
        # Create a fallback summary with error message
        summary, created = NoteSummary.objects.get_or_create(
            note=note,
            defaults={'summary_text': f"Summary generation failed: {str(e)}"}
        )
        return summary


def bulk_process_summaries(notes):
    """
    Generate summaries for multiple notes.
    
    Args:
        notes: QuerySet or list of Note objects
        
    Returns:
        list: List of NoteSummary objects
    """
    results = []
    for note in notes:
        try:
            result = process_note_summary(note)
            results.append(result)
        except Exception as e:
            print(f"Failed to generate summary for note {note.id}: {str(e)}")
    
    return results


def get_summary_statistics(text):
    """
    Get basic statistics about the summarized text.
    
    Args:
        text (str): Text to analyze
        
    Returns:
        dict: Statistics about the text
    """
    if not text:
        return {
            'word_count': 0,
            'sentence_count': 0,
            'character_count': 0,
            'estimated_reading_time': 0
        }
    
    cleaned_text = clean_text(text)
    words = cleaned_text.split()
    sentences = re.split(r'[.!?]+', cleaned_text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    return {
        'word_count': len(words),
        'sentence_count': len(sentences),
        'character_count': len(cleaned_text),
        'estimated_reading_time': max(1, len(words) // 200)  # minutes
    }
