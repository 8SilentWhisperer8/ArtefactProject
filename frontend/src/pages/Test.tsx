
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import TestSave from '../components/TestSave';
import './Test.css';

interface ActivityMetrics {
  currentStep: number;
  taskTime: string;
  steps: number;
  backtracks: number;
  errors: number;
}

interface UsabilityMetrics {
  effectiveness: number;
  efficiency: number;
  satisfaction: number;
  usabilityIndex: number;
}

const Test: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [showStartModal, setShowStartModal] = useState(true);
  const [isNewSession, setIsNewSession] = useState(true);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Tracking metrics
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetrics>({
    currentStep: 0,
    taskTime: '0:00',
    steps: 0,
    backtracks: 0,
    errors: 0
  });

  const [usabilityMetrics, setUsabilityMetrics] = useState<UsabilityMetrics>({
    effectiveness: 0,
    efficiency: 0,
    satisfaction: 0,
    usabilityIndex: 0
  });

  // Tracking state
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<string | null>(null);
  const [fieldVisitOrder, setFieldVisitOrder] = useState<string[]>([]);
  const [extraClicks, setExtraClicks] = useState(0);
  
  const timeIntervalRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<{[key: string]: number[]}>({});

  // Check if coming from existing session
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const existingSessionId = searchParams.get('session');
    
    if (existingSessionId) {
      setSessionId(existingSessionId);
      setIsNewSession(false);
      loadExistingSession(existingSessionId);
    }
  }, [location]);

  const loadExistingSession = async (sessionId: string) => {
    try {
      const analytics = await apiService.getSessionAnalytics(sessionId);
      setActivityMetrics({
        currentStep: analytics.current_step,
        taskTime: analytics.task_time,
        steps: analytics.steps,
        backtracks: analytics.backtracks,
        errors: analytics.errors
      });
      setUsabilityMetrics({
        effectiveness: analytics.effectiveness,
        efficiency: analytics.efficiency,
        satisfaction: analytics.satisfaction,
        usabilityIndex: analytics.usability_index
      });
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const startNewTest = async () => {
    try {
      const response = await apiService.createSession();
      setSessionId(response.session_id);
      setShowStartModal(false);
      setStartTime(new Date());
      
      // Start timer
      timeIntervalRef.current = setInterval(updateTimer, 1000);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const startExistingTest = () => {
    setShowStartModal(false);
    setStartTime(new Date());
    timeIntervalRef.current = setInterval(updateTimer, 1000);
  };

  const updateTimer = () => {
    if (startTime) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setActivityMetrics(prev => ({
        ...prev,
        taskTime: `${minutes}:${seconds.toString().padStart(2, '0')}`
      }));
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    // Track field visits and detect backtracks
    if (!fieldVisitOrder.includes(fieldName)) {
      setFieldVisitOrder(prev => [...prev, fieldName]);
      setActivityMetrics(prev => ({
        ...prev,
        steps: prev.steps + 1,
        currentStep: Math.max(prev.currentStep, getFieldStep(fieldName))
      }));
    } else if (lastFocusedField && getFieldStep(fieldName) < getFieldStep(lastFocusedField)) {
      // Backtrack detected
      setActivityMetrics(prev => ({
        ...prev,
        backtracks: prev.backtracks + 1
      }));
    }
    
    setLastFocusedField(fieldName);
    updateSessionMetrics();
  };

  const handleFieldBlur = (fieldName: string) => {
    // Validate field on blur and count errors
    const value = formData[fieldName as keyof typeof formData];
    if (value && !isFieldValid(fieldName, value)) {
      setActivityMetrics(prev => ({
        ...prev,
        errors: prev.errors + 1
      }));
    }
  };

  const handleClick = (fieldName: string) => {
    const now = Date.now();
    const fieldKey = fieldName || 'form';
    
    // Track clicks for frustration detection
    if (!lastClickTimeRef.current[fieldKey]) {
      lastClickTimeRef.current[fieldKey] = [];
    }
    
    lastClickTimeRef.current[fieldKey].push(now);
    
    // Check for frustration clicks (4+ clicks within 600ms)
    const recentClicks = lastClickTimeRef.current[fieldKey].filter(
      time => now - time <= 600
    );
    lastClickTimeRef.current[fieldKey] = recentClicks;
    
    if (recentClicks.length >= 4) {
      setExtraClicks(prev => prev + 1);
      // Clear the array to avoid double counting
      lastClickTimeRef.current[fieldKey] = [];
    }
  };

  const getFieldStep = (fieldName: string): number => {
    const stepMap: {[key: string]: number} = {
      firstName: 1,
      lastName: 2,
      dateOfBirth: 3,
      email: 4,
      password: 5,
      confirmPassword: 6
    };
    return stepMap[fieldName] || 0;
  };

  const isFieldValid = (fieldName: string, value: string): boolean => {
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        return value.length >= 2;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'password':
        return value.length >= 8;
      case 'confirmPassword':
        return value === formData.password;
      case 'dateOfBirth':
        return /^\d{2}\/\d{2}\/\d{4}$/.test(value);
      default:
        return true;
    }
  };

  const updateSessionMetrics = async () => {
    if (!sessionId || !startTime) return;

    const timeSpent = (new Date().getTime() - startTime.getTime()) / 1000;
    const fieldsCompleted = Object.values(formData).filter(value => value.trim() !== '').length;
    
    try {
      const analytics = await apiService.updateSessionMetrics(sessionId, {
        time_spent_sec: timeSpent,
        steps_taken: activityMetrics.steps,
        backtracks: activityMetrics.backtracks,
        error_counts: activityMetrics.errors,
        extra_clicks: extraClicks,
        fields_completed: fieldsCompleted,
        completion_status: fieldsCompleted === 6 ? 'success' : fieldsCompleted > 0 ? 'partial' : 'failure'
      });

      setUsabilityMetrics({
        effectiveness: analytics.effectiveness,
        efficiency: analytics.efficiency,
        satisfaction: analytics.satisfaction,
        usabilityIndex: analytics.usability_index
      });
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId) return;

    const fieldsCompleted = Object.values(formData).filter(value => value.trim() !== '').length;
    const isSuccess = fieldsCompleted === 6 && Object.entries(formData).every(([key, value]) => 
      isFieldValid(key, value)
    );

    try {
      await apiService.completeSession(sessionId, {
        completion_status: isSuccess ? 'success' : fieldsCompleted > 0 ? 'partial' : 'failure',
        user_group_data: {
          outcome: isSuccess ? 'success' : 'failure',
          ...(isSuccess ? {
            success_notes: 'Form completed successfully'
          } : {
            failure_steps_completed: fieldsCompleted,
            failure_last_section: lastFocusedField || 'unknown',
            failure_abort_reason: 'Form validation errors or incomplete fields'
          })
        }
      });

      // Navigate to dashboard with session ID
      navigate(`/dashboard?session=${sessionId}`);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const seeDetails = () => {
    if (sessionId) {
      navigate(`/dashboard?session=${sessionId}`);
    }
  };

  // Update metrics periodically
  useEffect(() => {
    if (sessionId && startTime && !showStartModal) {
      const intervalId = setInterval(() => {
        updateSessionMetrics();
      }, 2000); // Update every 2 seconds

      return () => clearInterval(intervalId);
    }
  }, [sessionId, startTime, showStartModal, activityMetrics, extraClicks, formData]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  if (showStartModal) {
    return (
      <div className="test-page">
        <div className="modal-overlay">
          <div className="start-modal">
            <h2>Usability Test</h2>
            {isNewSession ? (
              <>
                <p>Welcome to the usability test. You will be asked to complete a registration form while we track interaction patterns.</p>
                <div className="modal-buttons">
                  <button onClick={startNewTest} className="start-button">
                    Start the test
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Continue with your existing session or start a new test.</p>
                <div className="modal-buttons">
                  <button onClick={startExistingTest} className="start-button">
                    Continue Session
                  </button>
                  <button onClick={startNewTest} className="secondary-button">
                    Start New Test
                  </button>
                  <button onClick={seeDetails} className="details-button">
                    See Details
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="test-page">
      <div className="test-container">
        <div className="test-layout">
          {/* Registration Form */}
          <div className="form-section">
            <form onSubmit={handleSubmit} className="registration-form">
              <h2>Create Your Account</h2>
              
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onFocus={() => handleFieldFocus('firstName')}
                  onBlur={() => handleFieldBlur('firstName')}
                  onClick={() => handleClick('firstName')}
                  className={formData.firstName && !isFieldValid('firstName', formData.firstName) ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onFocus={() => handleFieldFocus('lastName')}
                  onBlur={() => handleFieldBlur('lastName')}
                  onClick={() => handleClick('lastName')}
                  className={formData.lastName && !isFieldValid('lastName', formData.lastName) ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="text"
                  id="dateOfBirth"
                  placeholder="dd/mm/yyyy"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  onFocus={() => handleFieldFocus('dateOfBirth')}
                  onBlur={() => handleFieldBlur('dateOfBirth')}
                  onClick={() => handleClick('dateOfBirth')}
                  className={formData.dateOfBirth && !isFieldValid('dateOfBirth', formData.dateOfBirth) ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => handleFieldFocus('email')}
                  onBlur={() => handleFieldBlur('email')}
                  onClick={() => handleClick('email')}
                  className={formData.email && !isFieldValid('email', formData.email) ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => handleFieldFocus('password')}
                  onBlur={() => handleFieldBlur('password')}
                  onClick={() => handleClick('password')}
                  className={formData.password && !isFieldValid('password', formData.password) ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onFocus={() => handleFieldFocus('confirmPassword')}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  onClick={() => handleClick('confirmPassword')}
                  className={formData.confirmPassword && !isFieldValid('confirmPassword', formData.confirmPassword) ? 'error' : ''}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button">Cancel</button>
                <button type="submit" className="register-button">Register</button>
              </div>
            </form>
          </div>

          {/* Activity Monitor */}
          <div className="activity-monitor">
            <h3>Activity monitor</h3>
            
            <TestSave 
              formData={formData} 
              onSave={() => updateSessionMetrics()}
            />
            
            <div className="current-step">
              <span className="label">Starting point:</span>
              <span className="value">Step {activityMetrics.currentStep}</span>
            </div>

            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Task timer:</span>
                <span className="metric-value">{activityMetrics.taskTime}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Steps:</span>
                <span className="metric-value">{activityMetrics.steps}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Backtracks:</span>
                <span className="metric-value">{activityMetrics.backtracks}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Errors:</span>
                <span className="metric-value">{activityMetrics.errors}</span>
              </div>
            </div>

            <button onClick={seeDetails} className="see-details-button">
              See details
            </button>

            {/* Usability Metrics Display */}
            <div className="usability-metrics">
              <h4>Usability Metrics</h4>
              <div className="metrics-tiles">
                <div className="metric-tile effectiveness">
                  <div className="metric-icon">🎯</div>
                  <div className="metric-name">Effectiveness</div>
                  <div className="metric-score">{usabilityMetrics.effectiveness.toFixed(1)}%</div>
                </div>
                <div className="metric-tile efficiency">
                  <div className="metric-icon">⚡</div>
                  <div className="metric-name">Efficiency</div>
                  <div className="metric-score">{usabilityMetrics.efficiency.toFixed(1)}%</div>
                </div>
                <div className="metric-tile satisfaction">
                  <div className="metric-icon">😊</div>
                  <div className="metric-name">Satisfaction</div>
                  <div className="metric-score">{usabilityMetrics.satisfaction.toFixed(1)}%</div>
                </div>
                <div className="metric-tile usability-index">
                  <div className="metric-icon">📊</div>
                  <div className="metric-name">Usability Index</div>
                  <div className="metric-score">{usabilityMetrics.usabilityIndex.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
