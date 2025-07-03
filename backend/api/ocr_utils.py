"""
OCR utility functions for processing uploaded PDF notes.
This is a dummy implementation for demonstration purposes.
"""

from PIL import Image
import os
import fitz  # PyMuPDF
from pdf2image import convert_from_path
from .models import OCRResult
from paddleocr import PaddleOCR  
import numpy as np

# Initialize PaddleOCR
ocr = PaddleOCR(
    use_doc_orientation_classify=False, 
    use_doc_unwarping=False, 
    use_textline_orientation=False,
)

def extract_text_using_paddleocr(image):
    result = ocr.predict(np.array(image))

    final_result = ""
    for res in result:
        for text in res['rec_texts']:
            final_result += f"{text} "

    return final_result.strip()


def extract_text_from_pdf(file_path):
    """
    Extract text from a PDF file using OCR.
    First tries to extract text directly, then falls back to OCR if needed.
    
    Args:
        file_path (str): Path to the PDF file
        
    Returns:
        str: Extracted text from the PDF
    """
    try:
        # First, try to extract text directly from PDF
        doc = fitz.open(file_path)
        text = ""
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            page_text = page.get_text()
            if page_text.strip():
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page_text
        
        doc.close()
        
        # If we got meaningful text, return it
        if text.strip() and len(text.strip()) > 10:
            return text.strip()
        
        # If no text was extracted or very little text, use OCR
        return extract_text_from_pdf_ocr(file_path)
    
    except Exception as e:
        print(f"Error extracting text from PDF {file_path}: {str(e)}")
        # Fallback to OCR if direct extraction fails
        try:
            return extract_text_from_pdf_ocr(file_path)
        except Exception as ocr_error:
            return f"Error processing PDF: {str(e)} | OCR Error: {str(ocr_error)}"


def extract_text_from_pdf_ocr(file_path):
    """
    Extract text from PDF using OCR by converting pages to images.
    
    Args:
        file_path (str): Path to the PDF file
        
    Returns:
        str: OCR extracted text from the PDF
    """
    try:
        # Convert PDF pages to images
        images = convert_from_path(file_path, dpi=100)
        
        extracted_text = ""
        
        for i, image in enumerate(images):
            # Perform OCR on each page
            page_text = extract_text_using_paddleocr(image)
            if page_text.strip():
                extracted_text += f"\n--- Page {i + 1} (OCR) ---\n"
                extracted_text += page_text
        
        return extracted_text.strip()
    
    except Exception as e:
        raise Exception(f"OCR processing failed: {str(e)}")


def extract_text_from_image(file_path):
    """
    Extract text from an image file using OCR.
    (Kept for backward compatibility)
    
    Args:
        file_path (str): Path to the image file
        
    Returns:
        str: Extracted text from the image
    """
    try:
        # Open the image
        image = Image.open(file_path)
        
        # Perform OCR using tesseract
        extracted_text = extract_text_using_paddleocr(image)
        
        return extracted_text.strip()
    
    except Exception as e:
        print(f"Error extracting text from {file_path}: {str(e)}")
        return f"Error processing file: {str(e)}"


def process_note_ocr(note):
    """
    Process OCR for a note and save the result.
    
    Args:
        note: Note model instance
        
    Returns:
        OCRResult: The created OCR result object
    """
    try:
        # Get the file path
        file_path = note.file.path
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Determine file type and extract text accordingly
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            extracted_text = extract_text_from_pdf(file_path)
        elif file_extension in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif']:
            extracted_text = extract_text_from_image(file_path)
        else:
            extracted_text = f"Unsupported file type: {file_extension}"
        
        # Create or update OCR result
        ocr_result, created = OCRResult.objects.get_or_create(
            note=note,
            defaults={'extracted_text': extracted_text}
        )
        
        if not created:
            ocr_result.extracted_text = extracted_text
            ocr_result.save()
        
        return ocr_result
    
    except Exception as e:
        print(f"Error processing OCR for note {note.id}: {str(e)}")
        # Create a fallback OCR result with error message
        ocr_result, created = OCRResult.objects.get_or_create(
            note=note,
            defaults={'extracted_text': f"OCR processing failed: {str(e)}"}
        )
        return ocr_result


def bulk_process_ocr(notes):
    """
    Process OCR for multiple notes.
    
    Args:
        notes: QuerySet or list of Note objects
        
    Returns:
        list: List of OCRResult objects
    """
    results = []
    for note in notes:
        try:
            result = process_note_ocr(note)
            results.append(result)
        except Exception as e:
            print(f"Failed to process OCR for note {note.id}: {str(e)}")
    
    return results


def get_supported_file_extensions():
    """
    Get list of supported file extensions for OCR.
    
    Returns:
        list: List of supported file extensions
    """
    return ['.pdf', '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif']


def is_supported_file(file_path):
    """
    Check if a file is supported for OCR processing.
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        bool: True if file is supported, False otherwise
    """
    _, ext = os.path.splitext(file_path.lower())
    return ext in get_supported_file_extensions()
