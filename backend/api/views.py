from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import datetime
from django.http import HttpResponseRedirect, JsonResponse
from django.conf import settings
import requests
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from urllib.parse import quote

from .models import Note, OCRResult, NoteSummary, NotionIntegration
from .serializers import (
    NoteSerializer, 
    NoteCreateSerializer, 
    OCRResultSerializer, 
    NoteSummarySerializer,
    NotionIntegrationSerializer
)
from .ocr_utils import process_note_ocr
from .summary_utils import process_note_summary
from .notion_utils import (
    get_notion_authorization_url,
    exchange_code_for_token,
    get_notion_workspace_info,
    markdown_to_notion_blocks,
    create_notion_page,
    get_user_notion_integration
)


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


# Notion Integration Views

@csrf_exempt
def notion_authorize(request):
    """
    Start Notion OAuth2 flow by redirecting to Notion's authorization URL.
    This endpoint doesn't require authentication as it's the starting point of OAuth.
    """
    try:
        auth_url = get_notion_authorization_url()
        return HttpResponseRedirect(auth_url)
    except Exception as e:
        return JsonResponse(
            {'error': f'Failed to start Notion authorization: {str(e)}'},
            status=500
        )


@csrf_exempt
def test_callback(request):
    """
    Test endpoint to verify callback URL is working.
    """
    return JsonResponse({
        'message': 'Callback URL is working!',
        'method': request.method,
        'get_params': dict(request.GET),
        'headers': dict(request.headers)
    })


@csrf_exempt
def notion_callback(request):
    """
    Handle Notion OAuth callback and exchange code for access token.
    """
    
    code = request.GET.get('code')
    state = request.GET.get('state')
    
    if not code:
        return JsonResponse({'error': 'No authorization code received'}, status=400)
    
    try:
        # Exchange code for access token
        token_data = exchange_code_for_token(code)
        access_token = token_data['access_token']
        
        # Get workspace info from token response (as per Notion docs)
        workspace_id = token_data.get('workspace_id')
        workspace_name = token_data.get('workspace_name', 'Unknown')
        bot_id = token_data.get('bot_id')
        
        # Store in session
        request.session['notion_access_token'] = access_token
        request.session['notion_workspace_id'] = workspace_id
        request.session['notion_workspace_name'] = workspace_name
        request.session['notion_bot_id'] = bot_id
        
        # Always create a temporary integration record to avoid session issues
        from .models import NotionIntegration
        temp_integration = NotionIntegration.objects.create(
            user=None,  # Will be assigned when user completes integration
            access_token=access_token,
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            bot_id=bot_id
        )
        request.session['temp_notion_integration_id'] = temp_integration.id
        request.session.save()
        
        # Also save to current user if authenticated (as backup)
        if request.user.is_authenticated:
            integration = get_user_notion_integration(request.user)
            integration.access_token = access_token
            integration.workspace_id = workspace_id
            integration.workspace_name = workspace_name
            integration.bot_id = bot_id
            integration.save()
        
        # Redirect to frontend
        redirect_url = f"{settings.FRONTEND_URL}/documents?notion_connected=true"
        return HttpResponseRedirect(redirect_url)
        
    except Exception as e:
        error_url = f"{settings.FRONTEND_URL}/documents?notion_error={quote(str(e))}"
        return HttpResponseRedirect(error_url)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notion_status(request):
    """
    Get current Notion integration status for the user.
    """
    try:
        integration = get_user_notion_integration(request.user)
        serializer = NotionIntegrationSerializer(integration)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': f'Failed to get Notion status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_notion_integration(request):
    """
    Complete Notion integration by saving session data to user's integration.
    """
    
    try:
        # Check if user already has an integration (from direct save during callback)
        try:
            integration = NotionIntegration.objects.get(user=request.user)
            if integration.access_token:
                return Response({
                    'success': True,
                    'message': 'Notion integration already completed',
                    'workspace_name': integration.workspace_name
                })
        except NotionIntegration.DoesNotExist:
            pass
        
        # First try to get session data from OAuth callback
        access_token = request.session.get('notion_access_token')
        workspace_id = request.session.get('notion_workspace_id')
        workspace_name = request.session.get('notion_workspace_name')
        bot_id = request.session.get('notion_bot_id')
        
        # If no session data, try to get from temporary integration record
        temp_integration_id = None
        if not access_token:
            temp_integration_id = request.session.get('temp_notion_integration_id')
            
            # If no session data, try to find any unassigned temporary integration
            if not temp_integration_id:
                try:
                    # Get the most recent unassigned temporary integration
                    temp_integration = NotionIntegration.objects.filter(
                        user=None, 
                        access_token__isnull=False
                    ).exclude(access_token="").order_by('-created_at').first()
                    
                    if temp_integration:
                        temp_integration_id = temp_integration.id
                except Exception as e:
                    print(f"❌ Error looking for unassigned integration: {e}")
            
            if temp_integration_id:
                try:
                    temp_integration = NotionIntegration.objects.get(id=temp_integration_id, user=None)
                    access_token = temp_integration.access_token
                    workspace_id = temp_integration.workspace_id
                    workspace_name = temp_integration.workspace_name
                    bot_id = temp_integration.bot_id
                except NotionIntegration.DoesNotExist:
                    pass
        
        if not access_token:
            return Response(
                {'error': 'No Notion access token found. Please complete the OAuth flow first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save or update integration
        integration = get_user_notion_integration(request.user)
        integration.access_token = access_token
        integration.workspace_id = workspace_id
        integration.workspace_name = workspace_name
        integration.bot_id = bot_id
        integration.save()
        
        # Clear session data
        request.session.pop('notion_access_token', None)
        request.session.pop('notion_workspace_id', None)
        request.session.pop('notion_workspace_name', None)
        request.session.pop('notion_bot_id', None)
        request.session.pop('temp_notion_integration_id', None)
        
        # Delete temporary integration if it exists
        if temp_integration_id:
            try:
                NotionIntegration.objects.filter(id=temp_integration_id, user=None).delete()
            except:
                pass
        
        return Response({
            'success': True,
            'message': 'Notion integration completed successfully',
            'workspace_name': workspace_name
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to complete Notion integration: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def export_to_notion(request, note_id):
    """
    Export a note's summary to Notion, or use provided Notion blocks from frontend.
    """
    try:
        # Get the note and ensure it belongs to the user
        note = get_object_or_404(Note, id=note_id, user=request.user)
        
        # Get or create summary
        try:
            summary = note.summary
        except NoteSummary.DoesNotExist:
            summary = process_note_summary(note)
        
        # Get user's Notion integration
        integration = get_user_notion_integration(request.user)
        if not integration.is_valid():
            return Response(
                {'error': 'Notion integration not connected. Please connect your Notion account first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use blocks from frontend if provided, else convert markdown
        blocks = request.data.get('blocks')
        if not blocks:
            # Convert markdown to Notion blocks (legacy fallback)
            blocks = markdown_to_notion_blocks(summary.summary_text)
        
        # Create page title
        page_title = f"{note.name}"
        
        # Get parent_id from request if provided
        parent_id = request.data.get('parent_id')
        
        # Create Notion page
        page_data = create_notion_page(
            access_token=integration.access_token,
            title=page_title,
            blocks=blocks,
            parent_id=parent_id
        )
        
        return Response({
            'success': True,
            'message': 'Successfully exported to Notion',
            'page_id': page_data.get('id'),
            'page_url': page_data.get('url'),
            'note_name': note.name
        })
        
    except Note.DoesNotExist:
        return Response(
            {'error': 'Note not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to export to Notion: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def disconnect_notion(request):
    """
    Disconnect user's Notion integration.
    """
    try:
        integration = get_user_notion_integration(request.user)
        integration.access_token = ""
        integration.workspace_id = None
        integration.workspace_name = None
        integration.bot_id = None
        integration.save()
        
        return Response({
            'success': True,
            'message': 'Notion integration disconnected successfully'
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to disconnect Notion: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
