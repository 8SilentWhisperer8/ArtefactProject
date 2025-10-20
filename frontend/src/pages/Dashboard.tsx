import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { FormOutputData, DashboardSummary, SessionAnalytics } from '../services/api';
import './Dashboard.css';

interface MetricTileProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  description: string;
}

const MetricTile: React.FC<MetricTileProps> = ({ title, value, icon, color, description }) => (
  <div className={`metric-tile ${color}`}>
    <div className="metric-header">
      <div className="metric-icon">{icon}</div>
      <div className="metric-title">{title}</div>
    </div>
    <div className="metric-value">{value.toFixed(2)}{title !== 'Usability Index' ? '%' : ''}</div>
    <div className="metric-description">{description}</div>
  </div>
);

const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [recentSessions, setRecentSessions] = useState<FormOutputData[]>([]);
  const [allSessions, setAllSessions] = useState<FormOutputData[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedCompletionStatus, setSelectedCompletionStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if coming from specific session
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get('session');
    
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setSelectedSession(sessionId);
      loadSessionAnalytics(sessionId);
    } else {
      loadDashboardData();
    }
  }, [location]);

  const loadSessionAnalytics = async (sessionId: string) => {
    try {
      setLoading(true);
      const analytics = await apiService.getSessionAnalytics(sessionId);
      setSessionAnalytics(analytics);
      setError(null);
    } catch (err) {
      setError('Failed to load session analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summary, sessions, allSessionsData] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getRecentSessions(10), // Recent 10 for display
        apiService.getAllSessions() // All sessions for filtering
      ]);
      
      console.log('Dashboard Summary:', summary);
      console.log('Recent Sessions:', sessions);
      console.log('All Sessions:', allSessionsData.length);
      
      setDashboardSummary(summary);
      setRecentSessions(sessions);
      setAllSessions(allSessionsData);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
    
    if (sessionId === 'all') {
      setCurrentSessionId(null);
      setSessionAnalytics(null);
      navigate('/dashboard');
    } else {
      setCurrentSessionId(sessionId);
      loadSessionAnalytics(sessionId);
      navigate(`/dashboard?session=${sessionId}`);
    }
  };

  const startNewTest = () => {
    navigate('/test');
  };

  const refreshData = () => {
    if (currentSessionId) {
      loadSessionAnalytics(currentSessionId);
    } else {
      loadDashboardData();
    }
  };

  const getFilteredSessions = () => {
    if (selectedGroup === 'all') {
      return allSessions;
    }
    return allSessions.filter(session => session.completion_status === selectedGroup);
  };

  // Calculate filtered metrics based on selected group
  const getFilteredMetrics = () => {
    // When showing 'all', use the complete dashboard summary data
    if (selectedGroup === 'all' && dashboardSummary) {
      return {
        total_sessions: dashboardSummary.total_sessions,
        successful_sessions: dashboardSummary.successful_sessions,
        partial_sessions: dashboardSummary.partial_sessions,
        failed_sessions: dashboardSummary.failed_sessions,
        success_rate: dashboardSummary.success_rate,
        avg_time_spent: dashboardSummary.avg_time_spent,
        avg_steps: dashboardSummary.avg_steps,
        avg_effectiveness: dashboardSummary.avg_effectiveness,
        avg_efficiency: dashboardSummary.avg_efficiency,
        avg_satisfaction: dashboardSummary.avg_satisfaction,
        avg_usability_index: dashboardSummary.avg_usability_index,
        avg_backtracks: dashboardSummary.avg_backtracks,
        avg_errors: dashboardSummary.avg_errors
      };
    }

    // For specific status filtering, use the filtered recent sessions
    const filteredSessions = getFilteredSessions();
    
    if (filteredSessions.length === 0) {
      return {
        total_sessions: 0,
        successful_sessions: 0,
        partial_sessions: 0,
        failed_sessions: 0,
        success_rate: 0,
        avg_time_spent: 0,
        avg_steps: 0,
        avg_effectiveness: 0,
        avg_efficiency: 0,
        avg_satisfaction: 0,
        avg_usability_index: 0,
        avg_backtracks: 0,
        avg_errors: 0
      };
    }

    const successfulSessions = filteredSessions.filter(s => s.completion_status === 'success').length;
    const partialSessions = filteredSessions.filter(s => s.completion_status === 'partial').length;
    const failedSessions = filteredSessions.filter(s => s.completion_status === 'failure').length;
    
    return {
      total_sessions: filteredSessions.length,
      successful_sessions: successfulSessions,
      partial_sessions: partialSessions,
      failed_sessions: failedSessions,
      success_rate: (successfulSessions / filteredSessions.length) * 100,
      avg_time_spent: filteredSessions.reduce((sum, s) => sum + s.time_spent_sec, 0) / filteredSessions.length,
      avg_steps: filteredSessions.reduce((sum, s) => sum + s.steps_taken, 0) / filteredSessions.length,
      avg_effectiveness: filteredSessions.reduce((sum, s) => sum + s.effectiveness, 0) / filteredSessions.length,
      avg_efficiency: filteredSessions.reduce((sum, s) => sum + s.efficiency, 0) / filteredSessions.length,
      avg_satisfaction: filteredSessions.reduce((sum, s) => sum + s.satisfaction, 0) / filteredSessions.length,
      avg_usability_index: filteredSessions.reduce((sum, s) => sum + s.usability_index, 0) / filteredSessions.length,
      avg_backtracks: filteredSessions.reduce((sum, s) => sum + s.backtracks, 0) / filteredSessions.length,
      avg_errors: filteredSessions.reduce((sum, s) => sum + s.error_counts, 0) / filteredSessions.length
    };
  };

  // Render loading state
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="error-state">
            <h2>⚠️ Error Loading Data</h2>
            <p>{error}</p>
            <button onClick={refreshData} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render "No session data available" state
  if (!currentSessionId && dashboardSummary && dashboardSummary.total_sessions === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="session-selector">
            <label htmlFor="session-select">Session Selection:</label>
            <select
              id="session-select"
              value={selectedSession}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="session-dropdown"
            >
              <option value="all">All Sessions</option>
              {recentSessions.map((session) => (
                <option key={session.session_id} value={session.session_id}>
                  Session {session.session_id}
                </option>
              ))}
            </select>
            <span className="time-filter">All Time</span>
          </div>

          {/* No Session Data Tile */}
          <div className="no-data-section">
            <div className="no-data-tile">
              <div className="no-data-icon">📊</div>
              <h3>No Session Data Available</h3>
              <p>Start using the form in the Test page to generate analytics data!</p>
              <button onClick={startNewTest} className="start-test-button">
                Start New Test
              </button>
            </div>
          </div>

          {/* Overall Performance Averages - Empty State */}
          <div className="performance-section">
            <h2>📊 Overall Performance Averages</h2>
            <div className="metrics-grid">
              <MetricTile
                title="Effectiveness"
                value={0}
                icon="🎯"
                color="effectiveness"
                description="Task completion success rate"
              />
              <MetricTile
                title="Efficiency"
                value={0}
                icon="⚡"
                color="efficiency"
                description="Time & effort optimization"
              />
              <MetricTile
                title="Satisfaction"
                value={0}
                icon="😊"
                color="satisfaction"
                description="User experience quality"
              />
              <MetricTile
                title="Usability Index"
                value={0}
                icon="📊"
                color="usability-index"
                description="Overall usability score"
              />
            </div>
          </div>

          {/* Session Summary - Empty State */}
          <div className="summary-sections">
            <div className="session-summary">
              <h3>📋 Session Summary</h3>
              <div className="summary-grid">
                <div className="summary-item success">
                  <div className="summary-number">0</div>
                  <div className="summary-label">TOTAL SESSIONS</div>
                </div>
                <div className="summary-item success">
                  <div className="summary-number">0</div>
                  <div className="summary-label">SUCCESSFUL</div>
                </div>
                <div className="summary-item failed">
                  <div className="summary-number">0</div>
                  <div className="summary-label">FAILED</div>
                </div>
                <div className="summary-item rate">
                  <div className="summary-number">0%</div>
                  <div className="summary-label">SUCCESS RATE</div>
                </div>
              </div>
            </div>

            <div className="performance-metrics">
              <h3>📈 Performance Metrics</h3>
              <div className="performance-grid">
                <div className="performance-item">
                  <div className="performance-icon">🕐</div>
                  <div className="performance-details">
                    <span className="performance-value">0s</span>
                    <span className="performance-label">Avg Task Time</span>
                  </div>
                </div>
                <div className="performance-item">
                  <div className="performance-icon">👥</div>
                  <div className="performance-details">
                    <span className="performance-value">0.0</span>
                    <span className="performance-label">Avg Steps</span>
                  </div>
                </div>
                <div className="performance-item">
                  <div className="performance-icon">❌</div>
                  <div className="performance-details">
                    <span className="performance-value">0.0</span>
                    <span className="performance-label">Avg Errors</span>
                  </div>
                </div>
                <div className="performance-item">
                  <div className="performance-icon">↩️</div>
                  <div className="performance-details">
                    <span className="performance-value">0.0</span>
                    <span className="performance-label">Avg Backtracks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render session-specific analytics (First State)
  if (currentSessionId && sessionAnalytics) {
    return (
      <div className="dashboard-page session-specific">
        <div className="dashboard-container">
          <div className="session-selector">
            <div className="selector-left">
              <label htmlFor="session-select">Session Selection:</label>
              <select
                id="session-select"
                value={selectedSession}
                onChange={(e) => handleSessionChange(e.target.value)}
                className="session-dropdown"
              >
                <option value="all">All Sessions</option>
                {recentSessions
                  .filter(session => selectedCompletionStatus === 'all' || session.completion_status === selectedCompletionStatus)
                  .map((session) => (
                    <option key={session.session_id} value={session.session_id}>
                      Session {session.session_id} ({session.completion_status})
                    </option>
                  ))}
              </select>
            </div>
            <div className="selector-group">
              <label htmlFor="status-filter">Filter by Status:</label>
              <select
                id="status-filter"
                value={selectedCompletionStatus}
                onChange={(e) => setSelectedCompletionStatus(e.target.value)}
                className="session-dropdown"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="partial">Partial</option>
                <option value="failure">Failure</option>
              </select>
            </div>
            <button 
              onClick={() => handleSessionChange('all')} 
              className="back-to-general-btn"
              title="Return to General Dashboard"
            >
              ← Back to Overview
            </button>
          </div>

          {/* Session Performance Details */}
          <div className="performance-section">
            <h2>🎯 This Session's Performance</h2>
            <div className="metrics-grid">
              <MetricTile
                title="Effectiveness"
                value={sessionAnalytics.effectiveness}
                icon="🎯"
                color="effectiveness"
                description="This session's completion rate"
              />
              <MetricTile
                title="Efficiency"
                value={sessionAnalytics.efficiency}
                icon="⚡"
                color="efficiency"
                description="Time & effort for this session"
              />
              <MetricTile
                title="Satisfaction"
                value={sessionAnalytics.satisfaction}
                icon="😊"
                color="satisfaction"
                description="User experience in this session"
              />
              <MetricTile
                title="Usability Index"
                value={sessionAnalytics.usability_index}
                icon="📊"
                color="usability-index"
                description="Overall score for this session"
              />
            </div>
          </div>

          {/* Session Performance Analysis */}
          <div className="session-analytics-tile">
            <div className="analytics-header">
              <h3>📊 Performance Analysis</h3>
            </div>
            
            {/* First Row - Progress Scale */}
            <div className="minimalist-progress-container">
              <div className="progress-track">
                {[1, 2, 3, 4, 5, 6, 7].map((step) => {
                  // If session is successfully completed (current_step >= 7), show all steps as completed
                  // Step 7 is pressing the "Register" button to complete the form
                  const isCompleted = sessionAnalytics.current_step >= 7 ? true : step <= sessionAnalytics.current_step;
                  const isCurrent = sessionAnalytics.current_step < 7 && step === sessionAnalytics.current_step + 1;
                  
                  return (
                    <div key={step} className="progress-segment">
                      <div className={`step-indicator ${
                        isCompleted ? 'completed' : 
                        isCurrent ? 'current' : 'pending'
                      }`}>
                        {isCompleted ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : step === 7 ? '✓' : step}
                      </div>
                      {step < 7 && <div className={`connector ${isCompleted ? 'completed' : ''}`}></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Second Row - Steps, Time, Progress */}
            <div className="performance-comparison-row">
              <div className="comparison-card">
                <div className="card-header">
                  <div className="card-icon">👥</div>
                  <div className="card-title">Steps</div>
                </div>
                <div className="card-comparison">
                  <div className="actual-value">{sessionAnalytics.current_step}</div>
                  <div className="separator">|</div>
                  <div className="base-value">7</div>
                </div>
                <div className="card-labels">
                  <span className="actual-label">Form progress</span>
                  <span className="base-label">Total steps</span>
                </div>
              </div>

              <div className="comparison-card">
                <div className="card-header">
                  <div className="card-icon">🕐</div>
                  <div className="card-title">Time</div>
                </div>
                <div className="card-comparison">
                  <div className="actual-value">{(() => {
                    try {
                      // Parse MM:SS format to total seconds
                      if (!sessionAnalytics.task_time || typeof sessionAnalytics.task_time !== 'string') {
                        return '0s';
                      }
                      const [minutes, seconds] = sessionAnalytics.task_time.split(':').map(Number);
                      if (isNaN(minutes) || isNaN(seconds)) {
                        return '0s';
                      }
                      const totalSeconds = (minutes * 60) + seconds;
                      return `${totalSeconds}s`;
                    } catch (error) {
                      console.error('Error parsing task_time:', sessionAnalytics.task_time, error);
                      return '0s';
                    }
                  })()}</div>
                  <div className="separator">|</div>
                  <div className="base-value">90s</div>
                </div>
                <div className="card-labels">
                  <span className="actual-label">Total time</span>
                  <span className="base-label">Base time</span>
                </div>
              </div>

              <div className="comparison-card">
                <div className="card-header">
                  <div className="card-icon">📊</div>
                  <div className="card-title">Progress</div>
                </div>
                <div className="card-comparison">
                  <div className="actual-value">{Math.min(sessionAnalytics.current_step, 7)}</div>
                  <div className="separator">|</div>
                  <div className="base-value">{Math.min(((sessionAnalytics.current_step / 7) * 100), 100).toFixed(0)}%</div>
                </div>
                <div className="card-labels">
                  <span className="actual-label">Steps done</span>
                  <span className="base-label">Completion</span>
                </div>
              </div>
            </div>

            {/* Third Row - Backtracks, Errors, Extra Clicks */}
            <div className="session-metrics-row">
              <div className="session-metric-card">
                <div className="metric-icon">↩️</div>
                <div className="metric-content">
                  <div className="metric-value">{sessionAnalytics.backtracks}</div>
                  <div className="metric-label">Backtracks</div>
                </div>
              </div>
              <div className="session-metric-card">
                <div className="metric-icon">❌</div>
                <div className="metric-content">
                  <div className="metric-value">{sessionAnalytics.errors}</div>
                  <div className="metric-label">Errors</div>
                </div>
              </div>
              <div className="session-metric-card">
                <div className="metric-icon">🖱️</div>
                <div className="metric-content">
                  <div className="metric-value">{sessionAnalytics.extra_clicks}</div>
                  <div className="metric-label">Extra Clicks</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Render overall dashboard (Second State with data)
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="session-selector">
          <div className="selector-group">
            <label htmlFor="session-select">Session Selection:</label>
            <select
              id="session-select"
              value={selectedSession}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="session-dropdown"
            >
              <option value="all">All Sessions</option>
              {recentSessions.map((session) => (
                <option key={session.session_id} value={session.session_id}>
                  Session {session.session_id}
                </option>
              ))}
            </select>
          </div>
          <div className="selector-group">
            <label htmlFor="group-select">Filter by Status:</label>
            <select
              id="group-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="session-dropdown"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="partial">Partial</option>
              <option value="failure">Failure</option>
            </select>
          </div>
        </div>

        {dashboardSummary && (
          <>
            {/* System Overview Stats */}
            <div className="overview-stats">
              {/* Group-Specific Tiles: Total Sessions, Average Time, Average Steps */}
              <div className="overview-grid" style={{ marginBottom: selectedGroup === 'all' ? '1.5rem' : '0' }}>
                <div className="overview-card">
                  <div className="overview-icon">📈</div>
                  <div className="overview-content">
                    <h3>Total Sessions</h3>
                    <div className="overview-number">{getFilteredMetrics().total_sessions}</div>
                    <div className="overview-subtitle">{selectedGroup === 'all' ? 'All time usage' : `${selectedGroup.charAt(0).toUpperCase() + selectedGroup.slice(1)} sessions only`}</div>
                  </div>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">⚡</div>
                  <div className="overview-content">
                    <h3>Avg Time</h3>
                    <div className="overview-number">{getFilteredMetrics().avg_time_spent.toFixed(2)}s</div>
                    <div className="overview-subtitle">{selectedGroup === 'all' ? 'Per session completion' : `For ${selectedGroup} sessions`}</div>
                  </div>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">🎯</div>
                  <div className="overview-content">
                    <h3>Avg Steps</h3>
                    <div className="overview-number">{getFilteredMetrics().avg_steps.toFixed(2)}</div>
                    <div className="overview-subtitle">{selectedGroup === 'all' ? 'Steps per session' : `In ${selectedGroup} sessions`}</div>
                  </div>
                </div>
              </div>
              
              {/* Second Row: Success Sessions, Partial Sessions, Failure Sessions (Only show when 'all' is selected) */}
              {selectedGroup === 'all' && (
                <div className="overview-grid">
                  <div className="overview-card">
                    <div className="overview-icon">✅</div>
                    <div className="overview-content">
                      <h3>Success Sessions</h3>
                      <div className="overview-number">{getFilteredMetrics().successful_sessions}</div>
                      <div className="overview-subtitle">{getFilteredMetrics().success_rate.toFixed(2)}% completion rate</div>
                    </div>
                  </div>
                  <div className="overview-card">
                    <div className="overview-icon">🟡</div>
                    <div className="overview-content">
                      <h3>Partial Sessions</h3>
                      <div className="overview-number">{getFilteredMetrics().partial_sessions}</div>
                      <div className="overview-subtitle">Incomplete sessions</div>
                    </div>
                  </div>
                  <div className="overview-card">
                    <div className="overview-icon">❌</div>
                    <div className="overview-content">
                      <h3>Failure Sessions</h3>
                      <div className="overview-number">{getFilteredMetrics().failed_sessions}</div>
                      <div className="overview-subtitle">Failed sessions</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Overall Performance Averages */}
            <div className="performance-section">
              <h2>📊 Aggregate Performance Metrics</h2>
              <div className="metrics-grid">
                <MetricTile
                  title="Effectiveness"
                  value={getFilteredMetrics().avg_effectiveness}
                  icon="🎯"
                  color="effectiveness"
                  description={selectedGroup === 'all' ? "Average completion success across all sessions" : `Average completion success for ${selectedGroup} sessions`}
                />
                <MetricTile
                  title="Efficiency"
                  value={getFilteredMetrics().avg_efficiency}
                  icon="⚡"
                  color="efficiency"
                  description={selectedGroup === 'all' ? "Average time & effort optimization" : `Average time & effort for ${selectedGroup} sessions`}
                />
                <MetricTile
                  title="Satisfaction"
                  value={getFilteredMetrics().avg_satisfaction}
                  icon="😊"
                  color="satisfaction"
                  description={selectedGroup === 'all' ? "User experience quality" : `User experience for ${selectedGroup} sessions`}
                />
                <MetricTile
                  title="Usability Index"
                  value={getFilteredMetrics().avg_usability_index}
                  icon="📊"
                  color="usability-index"
                  description={selectedGroup === 'all' ? "Overall usability score" : `Usability score for ${selectedGroup} sessions`}
                />
              </div>
            </div>

            {/* Recent Sessions List */}
            <div className="recent-sessions-section">
              <h2>🕒 Recent Sessions</h2>
              <div className="sessions-list">
                {getFilteredSessions().length > 0 ? (
                  getFilteredSessions().slice(0, 5).map((session) => (
                    <div key={session.session_id} className="session-card">
                      <div className="session-header">
                        <span className="session-id">Session {session.session_id}</span>
                        <span className={`session-status ${session.completion_status}`}>
                          {session.completion_status === 'success' ? '✅' : 
                           session.completion_status === 'partial' ? '🟡' : '❌'}
                          {session.completion_status}
                        </span>
                      </div>
                      <div className="session-metrics">
                        <div className="session-metric">
                          <span className="metric-label">Effectiveness:</span>
                          <span className="metric-value">{session.effectiveness.toFixed(2)}%</span>
                        </div>
                        <div className="session-metric">
                          <span className="metric-label">Time:</span>
                          <span className="metric-value">{session.time_spent_sec.toFixed(2)}s</span>
                        </div>
                        <div className="session-metric">
                          <span className="metric-label">Steps:</span>
                          <span className="metric-value">{session.steps_taken}</span>
                        </div>
                      </div>
                      <button 
                        className="view-session-btn"
                        onClick={() => handleSessionChange(session.session_id)}
                      >
                        View Details
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-sessions-message">
                    <p>No sessions available yet. Start a test to see data here!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;