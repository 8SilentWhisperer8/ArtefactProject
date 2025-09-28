
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
    <div className="metric-value">{value.toFixed(1)}{title !== 'Usability Index' ? '%' : ''}</div>
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
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
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
      const [summary, sessions] = await Promise.all([
        apiService.getDashboardSummary(),
        apiService.getRecentSessions()
      ]);
      
      console.log('Dashboard Summary:', summary);
      console.log('Recent Sessions:', sessions);
      console.log('Sessions length:', sessions.length);
      
      setDashboardSummary(summary);
      setRecentSessions(sessions);
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
      return recentSessions;
    }
    return recentSessions.filter(session => session.completion_status === selectedGroup);
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
                    <span className="performance-value">0:00</span>
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
                {recentSessions.map((session) => (
                  <option key={session.session_id} value={session.session_id}>
                    Session {session.session_id}
                  </option>
                ))}
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



          {/* Session Detailed Analytics */}
          <div className="session-analytics-tile">
            <div className="analytics-header">
              <h3>📊 Detailed Session Metrics</h3>
            </div>
            <div className="unified-analytics-grid">
              <div className="analytics-item">
                <div className="analytics-icon">📍</div>
                <div className="analytics-number">{sessionAnalytics.current_step} / 6</div>
                <div className="analytics-label">PROGRESS</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-icon">👣</div>
                <div className="analytics-number">{sessionAnalytics.steps}</div>
                <div className="analytics-label">TOTAL STEPS</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-icon">🔄</div>
                <div className="analytics-number">{sessionAnalytics.backtracks}</div>
                <div className="analytics-label">BACKTRACKS</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-icon">❌</div>
                <div className="analytics-number">{sessionAnalytics.errors}</div>
                <div className="analytics-label">ERRORS</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-icon">🕐</div>
                <div className="analytics-number">{sessionAnalytics.task_time}</div>
                <div className="analytics-label">DURATION</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-icon">�</div>
                <div className="analytics-number">{((sessionAnalytics.current_step / 6) * 100).toFixed(0)}%</div>
                <div className="analytics-label">COMPLETION</div>
              </div>
              <div className="analytics-item">
                <div className="analytics-icon">💨</div>
                <div className="analytics-number">{sessionAnalytics.steps > 0 ? (sessionAnalytics.steps / Math.max(1, parseFloat(sessionAnalytics.task_time.replace('s', '')))).toFixed(1) : '0.0'}</div>
                <div className="analytics-label">STEPS/SEC</div>
              </div>



            </div>
          </div>

          {/* Step Flow Chart */}
          <div className="visualization-tile">
            <div className="visualization-header">
              <h3>� Step Progress Flow</h3>
            </div>
            <div className="chart-container">
              <div className="step-flow-chart">
                {/* Progress Steps Visual */}
                <div className="steps-visualization">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div key={step} className="step-node-container">
                      <div className={`step-node ${step <= sessionAnalytics.current_step ? 'completed' : step === sessionAnalytics.current_step + 1 ? 'current' : 'pending'}`}>
                        {step <= sessionAnalytics.current_step ? '✓' : step}
                      </div>
                      {step < 6 && <div className={`step-connector ${step < sessionAnalytics.current_step ? 'completed' : ''}`}></div>}
                    </div>
                  ))}
                </div>
                
                {/* Metrics Bar */}
                <div className="flow-metrics">
                  <div className="metric-bar">
                    <div className="bar-section success" style={{width: `${(sessionAnalytics.steps / Math.max(sessionAnalytics.steps + sessionAnalytics.errors + sessionAnalytics.backtracks, 1)) * 100}%`}}></div>
                    <div className="bar-section backtrack" style={{width: `${(sessionAnalytics.backtracks / Math.max(sessionAnalytics.steps + sessionAnalytics.errors + sessionAnalytics.backtracks, 1)) * 100}%`}}></div>
                    <div className="bar-section error" style={{width: `${(sessionAnalytics.errors / Math.max(sessionAnalytics.steps + sessionAnalytics.errors + sessionAnalytics.backtracks, 1)) * 100}%`}}></div>
                  </div>
                  <div className="legend">
                    <span className="legend-item"><span className="legend-color success"></span>Steps ({sessionAnalytics.steps})</span>
                    <span className="legend-item"><span className="legend-color backtrack"></span>Backtracks ({sessionAnalytics.backtracks})</span>
                    <span className="legend-item"><span className="legend-color error"></span>Errors ({sessionAnalytics.errors})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Activity Breakdown */}
          <div className="visualization-tile">
            <div className="visualization-header">
              <h3>📊 Session Activity Breakdown</h3>
            </div>
            <div className="chart-container">
              <div className="activity-breakdown">
                <div className="breakdown-chart">
                  <svg viewBox="0 0 400 250" className="breakdown-svg">
                    {/* Calculate max value for scaling */}
                    {(() => {
                      const maxValue = Math.max(sessionAnalytics.steps, sessionAnalytics.backtracks, sessionAnalytics.errors, 1);
                      const scale = 180 / maxValue; // Scale to fit in 180px height
                      
                      return (
                        <g>
                          {/* Grid Lines */}
                          {[0, Math.ceil(maxValue * 0.25), Math.ceil(maxValue * 0.5), Math.ceil(maxValue * 0.75), maxValue].map((value, index) => (
                            <g key={value}>
                              <line 
                                x1="60" 
                                y1={200 - (value * scale)} 
                                x2="350" 
                                y2={200 - (value * scale)} 
                                stroke="#f1f5f9" 
                                strokeWidth="1" 
                              />
                              <text 
                                x="50" 
                                y={205 - (value * scale)} 
                                fontSize="10" 
                                fill="#9ca3af" 
                                textAnchor="end"
                              >
                                {Math.round(value)}
                              </text>
                            </g>
                          ))}
                          
                          {/* Steps Bar */}
                          <rect
                            x="80" 
                            y={200 - (sessionAnalytics.steps * scale)}
                            width="60" 
                            height={sessionAnalytics.steps * scale}
                            fill="#10b981"
                            rx="3"
                          />
                          <text x="110" y="220" fontSize="11" fill="#374151" textAnchor="middle" fontWeight="600">Steps</text>
                          <text x="110" y={190 - (sessionAnalytics.steps * scale)} fontSize="12" fill="#1f2937" textAnchor="middle" fontWeight="700">
                            {sessionAnalytics.steps}
                          </text>
                          
                          {/* Backtracks Bar */}
                          <rect
                            x="170" 
                            y={200 - (sessionAnalytics.backtracks * scale)}
                            width="60" 
                            height={sessionAnalytics.backtracks * scale || 2}
                            fill="#f59e0b"
                            rx="3"
                          />
                          <text x="200" y="220" fontSize="11" fill="#374151" textAnchor="middle" fontWeight="600">Backtracks</text>
                          <text x="200" y={190 - (sessionAnalytics.backtracks * scale)} fontSize="12" fill="#1f2937" textAnchor="middle" fontWeight="700">
                            {sessionAnalytics.backtracks}
                          </text>
                          
                          {/* Errors Bar */}
                          <rect
                            x="260" 
                            y={200 - (sessionAnalytics.errors * scale)}
                            width="60" 
                            height={sessionAnalytics.errors * scale || 2}
                            fill="#ef4444"
                            rx="3"
                          />
                          <text x="290" y="220" fontSize="11" fill="#374151" textAnchor="middle" fontWeight="600">Errors</text>
                          <text x="290" y={190 - (sessionAnalytics.errors * scale)} fontSize="12" fill="#1f2937" textAnchor="middle" fontWeight="700">
                            {sessionAnalytics.errors}
                          </text>
                          
                          {/* Base Line */}
                          <line x1="60" y1="200" x2="340" y2="200" stroke="#374151" strokeWidth="2" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>
                
                {/* Summary Stats */}
                <div className="activity-summary">
                  <div className="summary-item">
                    <span className="summary-stat">{sessionAnalytics.steps + sessionAnalytics.backtracks + sessionAnalytics.errors}</span>
                    <span className="summary-label">Total Actions</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-stat">{sessionAnalytics.steps > 0 ? ((sessionAnalytics.steps / (sessionAnalytics.steps + sessionAnalytics.backtracks + sessionAnalytics.errors)) * 100).toFixed(1) : '0'}%</span>
                    <span className="summary-label">Success Rate</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-stat">{parseFloat(sessionAnalytics.task_time.replace('s', '')).toFixed(1)}s</span>
                    <span className="summary-label">Duration</span>
                  </div>
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
              <div className="overview-grid">
                <div className="overview-card">
                  <div className="overview-icon">📈</div>
                  <div className="overview-content">
                    <h3>Total Sessions</h3>
                    <div className="overview-number">{dashboardSummary.total_sessions}</div>
                    <div className="overview-subtitle">All time usage</div>
                  </div>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">✅</div>
                  <div className="overview-content">
                    <h3>Success Rate</h3>
                    <div className="overview-number">{dashboardSummary.success_rate.toFixed(1)}%</div>
                    <div className="overview-subtitle">{dashboardSummary.successful_sessions} successful sessions</div>
                  </div>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">⚡</div>
                  <div className="overview-content">
                    <h3>Avg Time</h3>
                    <div className="overview-number">{dashboardSummary.avg_time_spent.toFixed(1)}s</div>
                    <div className="overview-subtitle">Per session completion</div>
                  </div>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">🎯</div>
                  <div className="overview-content">
                    <h3>Avg Steps</h3>
                    <div className="overview-number">{dashboardSummary.avg_steps.toFixed(1)}</div>
                    <div className="overview-subtitle">Steps per session</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Performance Averages */}
            <div className="performance-section">
              <h2>📊 Aggregate Performance Metrics</h2>
              <div className="metrics-grid">
                <MetricTile
                  title="Effectiveness"
                  value={dashboardSummary.avg_effectiveness}
                  icon="🎯"
                  color="effectiveness"
                  description="Average completion success across all sessions"
                />
                <MetricTile
                  title="Efficiency"
                  value={dashboardSummary.avg_efficiency}
                  icon="⚡"
                  color="efficiency"
                  description="Average time & effort optimization"
                />
                <MetricTile
                  title="Satisfaction"
                  value={dashboardSummary.avg_satisfaction}
                  icon="😊"
                  color="satisfaction"
                  description="User experience quality"
                />
                <MetricTile
                  title="Usability Index"
                  value={dashboardSummary.avg_usability_index}
                  icon="📊"
                  color="usability-index"
                  description="Overall usability score"
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
                          <span className="metric-value">{session.effectiveness.toFixed(1)}%</span>
                        </div>
                        <div className="session-metric">
                          <span className="metric-label">Time:</span>
                          <span className="metric-value">{session.time_spent_sec.toFixed(0)}s</span>
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

            {/* Quick Stats Summary */}
            <div className="summary-sections">
              <div className="session-summary">
                <h3>📋 System Statistics</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-number">{dashboardSummary.avg_backtracks.toFixed(1)}</div>
                    <div className="summary-label">AVG BACKTRACKS</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-number">{dashboardSummary.avg_errors.toFixed(1)}</div>
                    <div className="summary-label">AVG ERRORS</div>
                  </div>
                  <div className="summary-item rate">
                    <div className="summary-number">{dashboardSummary.success_rate.toFixed(1)}%</div>
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
                      <span className="performance-value">
                        {Math.floor(dashboardSummary.avg_time_spent / 60)}:
                        {Math.floor(dashboardSummary.avg_time_spent % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="performance-label">Avg Task Time</span>
                    </div>
                  </div>
                  <div className="performance-item">
                    <div className="performance-icon">👥</div>
                    <div className="performance-details">
                      <span className="performance-value">{dashboardSummary.avg_steps.toFixed(1)}</span>
                      <span className="performance-label">Avg Steps</span>
                    </div>
                  </div>
                  <div className="performance-item">
                    <div className="performance-icon">❌</div>
                    <div className="performance-details">
                      <span className="performance-value">{dashboardSummary.avg_errors.toFixed(1)}</span>
                      <span className="performance-label">Avg Errors</span>
                    </div>
                  </div>
                  <div className="performance-item">
                    <div className="performance-icon">↩️</div>
                    <div className="performance-details">
                      <span className="performance-value">{dashboardSummary.avg_backtracks.toFixed(1)}</span>
                      <span className="performance-label">Avg Backtracks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
