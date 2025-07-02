"""
Summary generation utility functions for processing OCR text.
This is a dummy implementation for demonstration purposes.
"""

import re
from .models import NoteSummary, OCRResult


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


def generate_summary(text, max_sentences=3):
    """
    Generate a simple summary from text.
    This is a dummy implementation using basic text processing.
    In a real application, you would use NLP libraries like transformers, spacy, etc.
    
    Args:
        text (str): Text to summarize
        max_sentences (int): Maximum number of sentences in summary
        
    Returns:
        str: Generated summary
    """
    if not text or len(text.strip()) == 0:
        return "No content available for summarization."
    
    # Clean the text
    cleaned_text = clean_text(text)
    
    if len(cleaned_text) < 50:
        return cleaned_text
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', cleaned_text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if not sentences:
        return "Unable to generate summary from the provided text."
    
    # Simple summarization: take first few sentences and try to find key sentences
    summary_sentences = []
    
    # Add the first sentence
    if sentences:
        summary_sentences.append(sentences[0])
    
    # Look for sentences with common keywords that might be important
    keywords = ['important', 'key', 'main', 'summary', 'conclusion', 'result', 'finding']
    
    for sentence in sentences[1:]:
        if len(summary_sentences) >= max_sentences:
            break
            
        # Check if sentence contains important keywords
        sentence_lower = sentence.lower()
        if any(keyword in sentence_lower for keyword in keywords):
            summary_sentences.append(sentence)
        elif len(sentence) > 20 and len(summary_sentences) < max_sentences:
            # Add longer sentences that might contain more information
            summary_sentences.append(sentence)
    
    # If we still need more sentences, add from the middle/end
    if len(summary_sentences) < max_sentences and len(sentences) > len(summary_sentences):
        remaining_sentences = [s for s in sentences if s not in summary_sentences]
        for sentence in remaining_sentences:
            if len(summary_sentences) >= max_sentences:
                break
            if len(sentence) > 15:  # Only add meaningful sentences
                summary_sentences.append(sentence)
    
    # Join sentences and ensure proper punctuation
    summary = '. '.join(summary_sentences)
    if not summary.endswith('.'):
        summary += '.'
    
    return summary


def generate_advanced_summary(text):
    """
    Generate a more detailed summary with key points.
    
    Args:
        text (str): Text to summarize
        
    Returns:
        str: Detailed summary with structure
    """
    if not text or len(text.strip()) == 0:
        return "No content available for summarization."
    
    cleaned_text = clean_text(text)
    
    if len(cleaned_text) < 100:
        return f"Brief note: {cleaned_text}"
    
    # Generate basic summary
    basic_summary = generate_summary(text, max_sentences=2)
    
    # Extract potential key points
    sentences = re.split(r'[.!?]+', cleaned_text)
    sentences = [s.strip() for s in sentences if s.strip() and len(s) > 10]
    
    # Look for numbered lists or bullet points
    key_points = []
    for sentence in sentences:
        # Look for patterns that might indicate important points
        if (re.match(r'^\d+\.', sentence.strip()) or 
            sentence.strip().startswith('-') or 
            sentence.strip().startswith('•') or
            any(keyword in sentence.lower() for keyword in ['important', 'note', 'remember', 'key'])):
            key_points.append(sentence.strip())
    
    # Build structured summary
    result = f"Summary: {basic_summary}"
    
    if key_points:
        result += f"\n\nKey Points:\n"
        for i, point in enumerate(key_points[:5], 1):  # Limit to 5 key points
            result += f"{i}. {point}\n"
    
    # Add word count and reading time estimate
    word_count = len(cleaned_text.split())
    reading_time = max(1, word_count // 200)  # Assume 200 words per minute
    
    result += f"\nDocument Stats: {word_count} words, ~{reading_time} min read"
    
    return result


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
