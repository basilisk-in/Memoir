from django.db import models
from django.contrib.auth.models import User
import os


def note_upload_path(instance, filename):
    """Generate upload path for PDF note files."""
    return f'notes/{instance.user.id}/{filename}'


def validate_pdf_file(file):
    """Validate that uploaded file is a PDF."""
    if not file.name.lower().endswith('.pdf'):
        from django.core.exceptions import ValidationError
        raise ValidationError('Only PDF files are allowed.')
    return file


class Note(models.Model):
    """Model for storing uploaded PDF notes."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    name = models.CharField(max_length=255, help_text='Name/title for this note')
    file = models.FileField(
        upload_to=note_upload_path, 
        validators=[validate_pdf_file],
        help_text='PDF file containing the note'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"
    
    def delete(self, *args, **kwargs):
        """Delete file from filesystem when model is deleted."""
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        super().delete(*args, **kwargs)


class OCRResult(models.Model):
    """Model for storing OCR results of notes."""
    note = models.OneToOneField(Note, on_delete=models.CASCADE, related_name='ocr_result')
    extracted_text = models.TextField()
    processed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"OCR for {self.note.name}"


class NoteSummary(models.Model):
    """Model for storing AI-generated summaries of notes."""
    note = models.OneToOneField(Note, on_delete=models.CASCADE, related_name='summary')
    summary_text = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Summary for {self.note.name}"
