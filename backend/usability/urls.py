from django.urls import path
from . import views

app_name = 'usability'

urlpatterns = [
    # Session management
    path('sessions/', views.FormOutputListCreateView.as_view(), name='session-list-create'),
    path('sessions/create/', views.create_session, name='session-create'),
    path('sessions/<str:session_id>/', views.FormOutputDetailView.as_view(), name='session-detail'),
    path('sessions/<str:session_id>/update/', views.update_session_metrics, name='session-update'),
    path('sessions/<str:session_id>/complete/', views.complete_session, name='session-complete'),
    path('sessions/<str:session_id>/analytics/', views.get_session_analytics, name='session-analytics'),
    
    # Dashboard endpoints
    path('dashboard/summary/', views.dashboard_summary, name='dashboard-summary'),
    path('dashboard/recent/', views.recent_sessions, name='recent-sessions'),
]
