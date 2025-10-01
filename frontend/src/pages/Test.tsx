
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import './Test.css';

interface ActivityMetrics {
  currentStep: number;
  taskTime: string;
  steps: number;
  backtracks: number;
  errors: number;
  startingPoint: string;
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
    currentStep: 1,
    taskTime: '0s',
    steps: 1,
    backtracks: 0,
    errors: 0,
    startingPoint: 'Fresh Start'
  });

  // Tracking state
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<string | null>(null);
  const [fieldVisitOrder, setFieldVisitOrder] = useState<string[]>([]);
  const [extraClicks, setExtraClicks] = useState(0);
  const [currentFocusedField, setCurrentFocusedField] = useState<string | null>(null);
  const [fieldsTouched, setFieldsTouched] = useState<Set<string>>(new Set());
  
  const timeIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
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
      // Convert MM:SS format to seconds
      let taskTimeInSeconds = '0s';
      try {
        if (analytics.task_time && typeof analytics.task_time === 'string') {
          const [minutes, seconds] = analytics.task_time.split(':').map(Number);
          if (!isNaN(minutes) && !isNaN(seconds)) {
            const totalSeconds = (minutes * 60) + seconds;
            taskTimeInSeconds = `${totalSeconds}s`;
          }
        }
      } catch (timeError) {
        console.error('Error parsing task_time:', analytics.task_time, timeError);
      }
      
      setActivityMetrics({
        currentStep: analytics.current_step,
        taskTime: taskTimeInSeconds,
        steps: analytics.steps,
        backtracks: analytics.backtracks,
        errors: analytics.errors,
        startingPoint: 'Resumed Session'
      });
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const startNewTest = async () => {
    try {
      const response = await apiService.createSession();
      console.log('Session created successfully:', response);
      setSessionId(response.session_id);
      setShowStartModal(false);
      const now = new Date();
      setStartTime(now);
      startTimeRef.current = now;
      
      // Start timer immediately and then every second
      updateTimer();
      timeIntervalRef.current = setInterval(updateTimer, 1000);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const startExistingTest = () => {
    setShowStartModal(false);
    const now = new Date();
    setStartTime(now);
    startTimeRef.current = now;
    
    // Start timer immediately and then every second
    updateTimer();
    timeIntervalRef.current = setInterval(updateTimer, 1000);
  };

  const updateTimer = () => {
    const referenceTime = startTimeRef.current;
    if (referenceTime) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - referenceTime.getTime()) / 1000);
      setActivityMetrics(prev => ({
        ...prev,
        taskTime: `${diff}s`
      }));
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    // Set current focused field
    setCurrentFocusedField(fieldName);
    
    // Mark field as touched
    setFieldsTouched(prev => new Set([...prev, fieldName]));
    
    // Track field visits and detect backtracks
    if (!fieldVisitOrder.includes(fieldName)) {
      setFieldVisitOrder(prev => [...prev, fieldName]);
    }
    
    // Always increment steps when navigating between fields
    setActivityMetrics(prev => ({
      ...prev,
      steps: prev.steps + 1,
      currentStep: Math.max(prev.currentStep, getFieldStep(fieldName)),
      // Set starting point to the first field focused
      startingPoint: prev.startingPoint === 'Not Started' ? fieldName : prev.startingPoint
    }));
    
    // Check for backtracks
    if (lastFocusedField && getFieldStep(fieldName) < getFieldStep(lastFocusedField)) {
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
    // Clear current focused field
    setCurrentFocusedField(null);
    
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
    if (!value.trim()) return false;
    
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        return value.length >= 3 && /^[a-zA-Z\s]+$/.test(value);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'password':
        return value.length >= 8 && 
               /(?=.*[a-z])/.test(value) && 
               /(?=.*[A-Z])/.test(value) && 
               /(?=.*\d)/.test(value);
      case 'confirmPassword':
        return value === formData.password;
      case 'dateOfBirth':
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
        
        const dateParts = value.split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          
          if (day < 1 || day > 31 || month < 1 || month > 12) return false;
          
          const currentYear = new Date().getFullYear();
          const age = currentYear - year;
          
          if (year > currentYear || age > 120 || age < 13) return false;
        }
        return true;
      default:
        return true;
    }
  };

  const updateSessionMetrics = async () => {
    if (!sessionId || !startTime) return;

    const timeSpent = (new Date().getTime() - startTime.getTime()) / 1000;
    const fieldsCompleted = Object.values(formData).filter(value => value.trim() !== '').length;
    
    try {
      await apiService.updateSessionMetrics(sessionId, {
        time_spent_sec: timeSpent,
        steps_taken: activityMetrics.steps,
        backtracks: activityMetrics.backtracks,
        error_counts: activityMetrics.errors,
        extra_clicks: extraClicks,
        fields_completed: fieldsCompleted,
        completion_status: fieldsCompleted === 6 ? 'success' : fieldsCompleted > 0 ? 'partial' : 'failure'
      });


    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  };

  const getFieldValidationMessage = (fieldName: string, value: string): string | null => {
    if (!value.trim()) {
      return null; // Don't show "field is required" message
    }

    switch (fieldName) {
      case 'firstName':
        if (value.length < 3) return 'Your name should have at least 3 letters';
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Your name cannot contain signs like exclamation marks or numbers';
        return null;
      case 'lastName':
        if (value.length < 3) return 'Your surname should have at least 3 letters';
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Your surname cannot contain signs like exclamation marks or numbers';
        return null;
      case 'email':
        if (!value.includes('@')) return 'Email address must contain an @ symbol';
        if (!value.includes('.')) return 'Email address must contain a domain (like .com)';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email format (example@email.com)';
        return null;
      case 'password':
        if (value.length < 8) return 'Your password is too short - needs at least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password should contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password should contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password should contain at least one number';
        return null;
      case 'confirmPassword':
        if (value !== formData.password) return 'Passwords do not match - please type the same password again';
        return null;
      case 'dateOfBirth':
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return 'Please enter your birth date as DD/MM/YYYY';
        
        // Additional age validation
        const dateParts = value.split('/');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          
          if (day < 1 || day > 31) return 'Day must be between 1 and 31';
          if (month < 1 || month > 12) return 'Month must be between 1 and 12';
          
          const currentYear = new Date().getFullYear();
          const age = currentYear - year;
          
          if (year > currentYear) return 'You cannot be born in the future';
          if (age > 120) return 'You cannot be over 120 years old';
          if (age < 13) return 'You must be at least 13 years old to register';
        }
        return null;
      default:
        return null;
    }
  };

  const isFormValid = (): boolean => {
    return Object.entries(formData).every(([key, value]) => 
      value.trim() !== '' && isFieldValid(key, value)
    );
  };

  const shouldShowValidationMessage = (fieldName: string): boolean => {
    // Show message if field is currently focused OR if field has been touched and has an error
    return currentFocusedField === fieldName || 
           (fieldsTouched.has(fieldName) && !isFieldValid(fieldName, formData[fieldName as keyof typeof formData]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId) return;

    // Only proceed if all fields are completed and valid
    if (!isFormValid()) {
      // Don't submit - validation warnings will be shown in the UI
      return;
    }

    try {
      const result = await apiService.completeSession(sessionId, {
        completion_status: 'success',
        user_group_data: {
          outcome: 'success',
          success_notes: 'Form completed successfully'
        }
      });
      
      console.log('Session completed successfully:', result);

      // Navigate to dashboard with session ID
      navigate(`/dashboard?session=${sessionId}`);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleInputChange = (fieldName: string, value: string) => {
    let processedValue = value;
    
    // Auto-format date of birth with slashes
    if (fieldName === 'dateOfBirth') {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      
      // Format with slashes: DD/MM/YYYY
      if (digitsOnly.length >= 5) {
        processedValue = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2, 4) + '/' + digitsOnly.slice(4, 8);
      } else if (digitsOnly.length >= 3) {
        processedValue = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2);
      } else {
        processedValue = digitsOnly;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: processedValue
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
        <div className="test-container">
          <div className="start-content">
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
                  className={shouldShowValidationMessage('firstName') && getFieldValidationMessage('firstName', formData.firstName) ? 'error' : ''}
                />
                {shouldShowValidationMessage('firstName') && getFieldValidationMessage('firstName', formData.firstName) && (
                  <span className="validation-warning">{getFieldValidationMessage('firstName', formData.firstName)}</span>
                )}
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
                  className={shouldShowValidationMessage('lastName') && getFieldValidationMessage('lastName', formData.lastName) ? 'error' : ''}
                />
                {shouldShowValidationMessage('lastName') && getFieldValidationMessage('lastName', formData.lastName) && (
                  <span className="validation-warning">{getFieldValidationMessage('lastName', formData.lastName)}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="text"
                  id="dateOfBirth"
                  placeholder="dd/mm/yyyy"
                  maxLength={10}
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  onFocus={() => handleFieldFocus('dateOfBirth')}
                  onBlur={() => handleFieldBlur('dateOfBirth')}
                  onClick={() => handleClick('dateOfBirth')}
                  className={shouldShowValidationMessage('dateOfBirth') && getFieldValidationMessage('dateOfBirth', formData.dateOfBirth) ? 'error' : ''}
                />
                {shouldShowValidationMessage('dateOfBirth') && getFieldValidationMessage('dateOfBirth', formData.dateOfBirth) && (
                  <span className="validation-warning">{getFieldValidationMessage('dateOfBirth', formData.dateOfBirth)}</span>
                )}
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
                  className={shouldShowValidationMessage('email') && getFieldValidationMessage('email', formData.email) ? 'error' : ''}
                />
                {shouldShowValidationMessage('email') && getFieldValidationMessage('email', formData.email) && (
                  <span className="validation-warning">{getFieldValidationMessage('email', formData.email)}</span>
                )}
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
                  className={shouldShowValidationMessage('password') && getFieldValidationMessage('password', formData.password) ? 'error' : ''}
                />
                {shouldShowValidationMessage('password') && getFieldValidationMessage('password', formData.password) && (
                  <span className="validation-warning">{getFieldValidationMessage('password', formData.password)}</span>
                )}
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
                  className={shouldShowValidationMessage('confirmPassword') && getFieldValidationMessage('confirmPassword', formData.confirmPassword) ? 'error' : ''}
                />
                {shouldShowValidationMessage('confirmPassword') && getFieldValidationMessage('confirmPassword', formData.confirmPassword) && (
                  <span className="validation-warning">{getFieldValidationMessage('confirmPassword', formData.confirmPassword)}</span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button">Cancel</button>
                <button 
                  type="submit" 
                  className={`register-button ${!isFormValid() ? 'disabled' : ''}`}
                  disabled={!isFormValid()}
                >
                  Register
                </button>
              </div>
            </form>
          </div>

          {/* Activity Monitor */}
          <div className="activity-monitor">
            <h3>Activity monitor</h3>
            

            
            <div className="current-step">
              <span className="label">Starting point:</span>
              <span className="value">{activityMetrics.startingPoint || 'Not started'}</span>
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
              <div className="metric-item">
                <span className="metric-label">Extra clicks:</span>
                <span className="metric-value">{extraClicks}</span>
              </div>
            </div>

            <button onClick={seeDetails} className="see-details-button">
              See details
            </button>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
