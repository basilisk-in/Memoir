from django.contrib import admin
from .models import Note, OCRResult, NoteSummary


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'uploaded_at', 'updated_at']
    list_filter = ['uploaded_at', 'updated_at', 'user']
    search_fields = ['name', 'user__username']
    readonly_fields = ['uploaded_at', 'updated_at']
    ordering = ['-uploaded_at']


@admin.register(OCRResult)
class OCRResultAdmin(admin.ModelAdmin):
    list_display = ['note', 'processed_at', 'get_note_user']
    list_filter = ['processed_at', 'note__user']
    search_fields = ['note__name', 'note__user__username', 'extracted_text']
    readonly_fields = ['processed_at']
    ordering = ['-processed_at']
    
    def get_note_user(self, obj):
        return obj.note.user.username
    get_note_user.short_description = 'User'
    get_note_user.admin_order_field = 'note__user__username'


@admin.register(NoteSummary)
class NoteSummaryAdmin(admin.ModelAdmin):
    list_display = ['note', 'generated_at', 'get_note_user']
    list_filter = ['generated_at', 'note__user']
    search_fields = ['note__name', 'note__user__username', 'summary_text']
    readonly_fields = ['generated_at']
    ordering = ['-generated_at']
    
    def get_note_user(self, obj):
        return obj.note.user.username
    get_note_user.short_description = 'User'
    get_note_user.admin_order_field = 'note__user__username'
