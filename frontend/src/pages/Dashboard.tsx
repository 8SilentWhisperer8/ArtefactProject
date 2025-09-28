
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
      
      setDashboardSummary(summary);
      setRecentSessions(sessions);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
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
          <div className="dashboard-tabs">
            <button className="tab-button active">📊 Overview</button>
          </div>

          <div className="session-selector">
            <label htmlFor="session-select">Session Selection:</label>
            <select
              id="session-select"
              value={selectedSession}
              onChange={(e) => handleSessionChange(e.target.value)}
              className="session-dropdown"
            >
              <option value="all">All Sessions</option>
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
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-tabs">
            <button className="tab-button active">📊 Overview</button>
          </div>

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

          {/* Current Session Analytics */}
          <div className="session-info">
            <h2>Session Analytics: {sessionAnalytics.session_id}</h2>
            <button onClick={refreshData} className="refresh-button">
              🔄 Refresh Data
            </button>
          </div>

          {/* Overall Performance Averages */}
          <div className="performance-section">
            <h2>📊 Overall Performance Averages</h2>
            <div className="metrics-grid">
              <MetricTile
                title="Effectiveness"
                value={sessionAnalytics.effectiveness}
                icon="🎯"
                color="effectiveness"
                description="Task completion success rate"
              />
              <MetricTile
                title="Efficiency"
                value={sessionAnalytics.efficiency}
                icon="⚡"
                color="efficiency"
                description="Time & effort optimization"
              />
              <MetricTile
                title="Satisfaction"
                value={sessionAnalytics.satisfaction}
                icon="😊"
                color="satisfaction"
                description="User experience quality"
              />
              <MetricTile
                title="Usability Index"
                value={sessionAnalytics.usability_index}
                icon="📊"
                color="usability-index"
                description="Overall usability score"
              />
            </div>
          </div>

          {/* Session Summary */}
          <div className="summary-sections">
            <div className="session-summary">
              <h3>📋 Session Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-number">{sessionAnalytics.current_step}</div>
                  <div className="summary-label">CURRENT STEP</div>
                </div>
                <div className="summary-item">
                  <div className="summary-number">{sessionAnalytics.steps}</div>
                  <div className="summary-label">TOTAL STEPS</div>
                </div>
                <div className="summary-item">
                  <div className="summary-number">{sessionAnalytics.backtracks}</div>
                  <div className="summary-label">BACKTRACKS</div>
                </div>
                <div className="summary-item">
                  <div className="summary-number">{sessionAnalytics.errors}</div>
                  <div className="summary-label">ERRORS</div>
                </div>
              </div>
            </div>

            <div className="performance-metrics">
              <h3>📈 Performance Metrics</h3>
              <div className="performance-grid">
                <div className="performance-item">
                  <div className="performance-icon">🕐</div>
                  <div className="performance-details">
                    <span className="performance-value">{sessionAnalytics.task_time}</span>
                    <span className="performance-label">Task Time</span>
                  </div>
                </div>
                <div className="performance-item">
                  <div className="performance-icon">📊</div>
                  <div className="performance-details">
                    <span className="performance-value">{sessionAnalytics.usability_index.toFixed(1)}</span>
                    <span className="performance-label">Usability Score</span>
                  </div>
                </div>
                <div className="performance-item">
                  <div className="performance-icon">🎯</div>
                  <div className="performance-details">
                    <span className="performance-value">{sessionAnalytics.effectiveness.toFixed(1)}%</span>
                    <span className="performance-label">Effectiveness</span>
                  </div>
                </div>
                <div className="performance-item">
                  <div className="performance-icon">⚡</div>
                  <div className="performance-details">
                    <span className="performance-value">{sessionAnalytics.efficiency.toFixed(1)}%</span>
                    <span className="performance-label">Efficiency</span>
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
        <div className="dashboard-tabs">
          <button className="tab-button active">📊 Overview</button>
        </div>

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

        {dashboardSummary && (
          <>
            {/* Overall Performance Averages */}
            <div className="performance-section">
              <h2>📊 Overall Performance Averages</h2>
              <div className="metrics-grid">
                <MetricTile
                  title="Effectiveness"
                  value={dashboardSummary.avg_effectiveness}
                  icon="🎯"
                  color="effectiveness"
                  description="Task completion success rate"
                />
                <MetricTile
                  title="Efficiency"
                  value={dashboardSummary.avg_efficiency}
                  icon="⚡"
                  color="efficiency"
                  description="Time & effort optimization"
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

            {/* Session Summary */}
            <div className="summary-sections">
              <div className="session-summary">
                <h3>📋 Session Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-number">{dashboardSummary.total_sessions}</div>
                    <div className="summary-label">TOTAL SESSIONS</div>
                  </div>
                  <div className="summary-item success">
                    <div className="summary-number">{dashboardSummary.successful_sessions}</div>
                    <div className="summary-label">SUCCESSFUL</div>
                  </div>
                  <div className="summary-item failed">
                    <div className="summary-number">{dashboardSummary.failed_sessions}</div>
                    <div className="summary-label">FAILED</div>
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
