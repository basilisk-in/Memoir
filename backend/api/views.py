from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import datetime

from .models import Note, OCRResult, NoteSummary
from .serializers import (
    NoteSerializer, 
    NoteCreateSerializer, 
    OCRResultSerializer, 
    NoteSummarySerializer
)
from .ocr_utils import process_note_ocr
from .summary_utils import process_note_summary


class NoteUploadView(generics.CreateAPIView):
    """
    Upload multiple PDF notes with names.
    Supports multiple file upload with corresponding names.
    OCR processing happens synchronously for proof of concept.
    """
    serializer_class = NoteCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notes = serializer.save()
        
        # Process OCR synchronously for each uploaded note (proof of concept)
        for note in notes:
            try:
                process_note_ocr(note)
            except Exception as e:
                print(f"Failed to process OCR for note {note.id}: {str(e)}")
        
        # Return serialized note data
        response_serializer = NoteSerializer(notes, many=True, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class NoteListView(generics.ListAPIView):
    """
    List all notes for the authenticated user.
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)


class NoteDetailView(generics.RetrieveAPIView):
    """
    Get details of a specific note by ID.
    Returns the file address and note information.
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)


class NotesByDateView(generics.ListAPIView):
    """
    Fetch notes by date.
    Query parameters:
    - date: YYYY-MM-DD format
    - start_date: YYYY-MM-DD format
    - end_date: YYYY-MM-DD format
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Note.objects.filter(user=user)
        
        # Get date parameters
        date = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if date:
            # Filter by specific date
            try:
                filter_date = datetime.strptime(date, '%Y-%m-%d').date()
                queryset = queryset.filter(uploaded_at__date=filter_date)
            except ValueError:
                queryset = queryset.none()
        elif start_date and end_date:
            # Filter by date range
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(uploaded_at__date__range=[start, end])
            except ValueError:
                queryset = queryset.none()
        elif start_date:
            # Filter from start date onwards
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(uploaded_at__date__gte=start)
            except ValueError:
                queryset = queryset.none()
        elif end_date:
            # Filter up to end date
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(uploaded_at__date__lte=end)
            except ValueError:
                queryset = queryset.none()
        
        return queryset.order_by('-uploaded_at')


class NotesSearchView(generics.ListAPIView):
    """
    Search notes by name.
    Query parameters:
    - q: Search query
    - name: Search in name field specifically
    """
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Note.objects.filter(user=user)
        
        # Get search parameters
        query = self.request.query_params.get('q')
        name_query = self.request.query_params.get('name')
        
        if query:
            # Search in both name and file name
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(file__icontains=query)
            )
        elif name_query:
            # Search specifically in name field
            queryset = queryset.filter(name__icontains=name_query)
        
        return queryset.order_by('-uploaded_at')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_note_ocr(request, note_id):
    """
    Get OCR results for a specific note.
    If OCR hasn't been processed yet, trigger processing.
    """
    try:
        note = get_object_or_404(Note, id=note_id, user=request.user)
        
        # Try to get existing OCR result
        try:
            ocr_result = note.ocr_result
        except OCRResult.DoesNotExist:
            # Process OCR if not already done
            ocr_result = process_note_ocr(note)
        
        serializer = OCRResultSerializer(ocr_result, context={'request': request})
        return Response(serializer.data)
    
    except Note.DoesNotExist:
        return Response(
            {'error': 'Note not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to process OCR: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_note_summary(request, note_id):
    """
    Get summary for a specific note.
    If summary hasn't been generated yet, trigger generation.
    """
    try:
        note = get_object_or_404(Note, id=note_id, user=request.user)
        
        # Try to get existing summary
        try:
            summary = note.summary
        except NoteSummary.DoesNotExist:
            # Generate summary if not already done
            summary = process_note_summary(note)
        
        serializer = NoteSummarySerializer(summary, context={'request': request})
        return Response(serializer.data)
    
    except Note.DoesNotExist:
        return Response(
            {'error': 'Note not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to generate summary: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def regenerate_ocr(request, note_id):
    """
    Regenerate OCR for a specific note.
    """
    try:
        note = get_object_or_404(Note, id=note_id, user=request.user)
        
        # Delete existing OCR result if it exists
        try:
            note.ocr_result.delete()
        except OCRResult.DoesNotExist:
            pass
        
        # Process OCR again
        ocr_result = process_note_ocr(note)
        
        serializer = OCRResultSerializer(ocr_result, context={'request': request})
        return Response(serializer.data)
    
    except Note.DoesNotExist:
        return Response(
            {'error': 'Note not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to regenerate OCR: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def regenerate_summary(request, note_id):
    """
    Regenerate summary for a specific note.
    """
    try:
        note = get_object_or_404(Note, id=note_id, user=request.user)
        
        # Delete existing summary if it exists
        try:
            note.summary.delete()
        except NoteSummary.DoesNotExist:
            pass
        
        # Generate summary again
        summary = process_note_summary(note)
        
        serializer = NoteSummarySerializer(summary, context={'request': request})
        return Response(serializer.data)
    
    except Note.DoesNotExist:
        return Response(
            {'error': 'Note not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to regenerate summary: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
