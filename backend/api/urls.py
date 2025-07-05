from django.urls import path
from . import views

urlpatterns = [
    # Note management endpoints
    path('notes/upload/', views.NoteUploadView.as_view(), name='note-upload'),
    path('notes/', views.NoteListView.as_view(), name='note-list'),
    path('notes/<int:pk>/', views.NoteDetailView.as_view(), name='note-detail'),
    
    # Note filtering and search endpoints
    path('notes/by-date/', views.NotesByDateView.as_view(), name='notes-by-date'),
    path('notes/search/', views.NotesSearchView.as_view(), name='notes-search'),
    
    # OCR and summary endpoints
    path('get-ocr/<int:note_id>/', views.get_note_ocr, name='get-note-ocr'),
    path('get-summary/<int:note_id>/', views.get_note_summary, name='get-note-summary'),
    
    # Regeneration endpoints
    path('regenerate-ocr/<int:note_id>/', views.regenerate_ocr, name='regenerate-ocr'),
    path('regenerate-summary/<int:note_id>/', views.regenerate_summary, name='regenerate-summary'),
    
    # Notion integration endpoints (using regular Django views for OAuth)
    path('notion/authorize/', views.notion_authorize, name='notion-authorize'),
    path('notion/callback/', views.notion_callback, name='notion-callback'),
    path('notion/test-callback/', views.test_callback, name='test-callback'),
    path('notion/status/', views.notion_status, name='notion-status'),
    path('notion/complete/', views.complete_notion_integration, name='complete-notion-integration'),
    path('notion/export/<int:note_id>/', views.export_to_notion, name='export-to-notion'),
    path('notion/disconnect/', views.disconnect_notion, name='disconnect-notion'),
]
