from rest_framework import serializers
from .models import Note, OCRResult, NoteSummary


class NoteSerializer(serializers.ModelSerializer):
    """Serializer for Note model."""
    user = serializers.StringRelatedField(read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = ['id', 'name', 'file', 'file_url', 'user', 'uploaded_at', 'updated_at']
        read_only_fields = ['id', 'user', 'uploaded_at', 'updated_at']
    
    def get_file_url(self, obj):
        """Get the full URL for the file."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class NoteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notes with multiple PDF file support."""
    files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=True,
        help_text="List of PDF files to upload"
    )
    names = serializers.ListField(
        child=serializers.CharField(max_length=255),
        write_only=True,
        required=True,
        help_text="List of names corresponding to each PDF file"
    )
    
    class Meta:
        model = Note
        fields = ['files', 'names']
    
    def validate_files(self, files):
        """Validate that all uploaded files are PDFs."""
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif']

        for file in files:
            ext = file.name.lower().rsplit('.', 1)[-1]
            if f'.{ext}' not in allowed_extensions:
                raise serializers.ValidationError(
                    f"File '{file.name}' is not a PDF. Only PDF files are allowed."
                )
        return files
    
    def validate(self, data):
        """Validate that files and names have the same length."""
        files = data.get('files', [])
        names = data.get('names', [])
        
        if len(files) != len(names):
            raise serializers.ValidationError(
                "Number of files must match number of names."
            )
        
        if not files:
            raise serializers.ValidationError("At least one PDF file is required.")
        
        return data
    
    def create(self, validated_data):
        """Create multiple notes from the provided PDF files and names."""
        files = validated_data.pop('files')
        names = validated_data.pop('names')
        user = self.context['request'].user
        
        notes = []
        for file, name in zip(files, names):
            note = Note.objects.create(
                user=user,
                name=name,
                file=file,
                **validated_data
            )
            notes.append(note)
        
        return notes


class OCRResultSerializer(serializers.ModelSerializer):
    """Serializer for OCR results."""
    note_name = serializers.CharField(source='note.name', read_only=True)
    
    class Meta:
        model = OCRResult
        fields = ['id', 'note', 'note_name', 'extracted_text', 'processed_at']
        read_only_fields = ['id', 'processed_at']


class NoteSummarySerializer(serializers.ModelSerializer):
    """Serializer for note summaries."""
    note_name = serializers.CharField(source='note.name', read_only=True)
    
    class Meta:
        model = NoteSummary
        fields = ['id', 'note', 'note_name', 'summary_text', 'generated_at']
        read_only_fields = ['id', 'generated_at']
