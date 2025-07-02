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
]
