
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import '../styles/pages/Test.css';

interface ActivityMetrics {
  currentStep: number;
  taskTime: string;
  steps: number;
  backtracks: number;
  errors: number;
}

const Test: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [showStartModal, setShowStartModal] = useState(true);
  
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
    steps: 0,
    backtracks: 0,
    errors: 0
  });

  // Tracking state
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<string | null>(null);
  const [fieldVisitOrder, setFieldVisitOrder] = useState<string[]>([]);
  const [extraClicks, setExtraClicks] = useState(0);
  const [currentFocusedField, setCurrentFocusedField] = useState<string | null>(null);
  const [fieldsTouched, setFieldsTouched] = useState<Set<string>>(new Set());
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  
  const timeIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const lastClickTimeRef = useRef<{[key: string]: number[]}>({});

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

  const updateTimer = () => {
    const referenceTime = startTimeRef.current;
    if (referenceTime) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - referenceTime.getTime()) / 1000);
      
      // Update seconds elapsed state
      setSecondsElapsed(diff);
      
      // Show warning when approaching 150 seconds (30 seconds before limit)
      if (diff >= 150 && !showTimeWarning) {
        setShowTimeWarning(true);
      }
      
      // Auto-redirect if time limit exceeded
      if (diff > 180) {
        alert('Time limit of 3 minutes exceeded. Session ended without saving.');
        navigate('/dashboard');
        return;
      }
      
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
      currentStep: Math.max(prev.currentStep, getFieldStep(fieldName))
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
    
    // Don't update metrics if session exceeds 180 seconds
    if (timeSpent > 180) {
      console.log('Session exceeded time limit, not updating metrics');
      return;
    }

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

  const handleCancel = async () => {
    if (!sessionId || !startTime) {
      // If no session started yet, just redirect to start window
      setShowStartModal(true);
      return;
    }

    // Count completed fields
    const fieldsCompleted = Object.values(formData).filter(value => value.trim() !== '').length;
    
    // Determine completion status based on fields completed
    const completionStatus = fieldsCompleted === 0 ? 'failure' : 'partial';

    try {
      // Update final session metrics before completion
      await updateSessionMetrics();
      
      // Complete session with appropriate status
      await apiService.completeSession(sessionId, {
        completion_status: completionStatus,
        user_group_data: {
          outcome: completionStatus,
          success_notes: `User cancelled after completing ${fieldsCompleted} field(s)`
        }
      });
      
      console.log(`Session cancelled with status: ${completionStatus}`);
    } catch (error) {
      console.error('Failed to save cancelled session:', error);
    }

    // Clear the session and show start modal
    setSessionId(null);
    setShowStartModal(true);
    
    // Clear timer
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
    
    // Reset all form data and metrics
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    
    setActivityMetrics({
      currentStep: 1,
      taskTime: '0s',
      steps: 0,
      backtracks: 0,
      errors: 0
    });
    
    // Reset tracking state
    setStartTime(null);
    setLastFocusedField(null);
    setFieldVisitOrder([]);
    setExtraClicks(0);
    setCurrentFocusedField(null);
    setFieldsTouched(new Set());
    setShowTimeWarning(false);
    setSecondsElapsed(0);
    startTimeRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId || !startTime) return;

    // Check if session exceeds 180 seconds (3 minutes)
    const timeSpent = (new Date().getTime() - startTime.getTime()) / 1000;
    if (timeSpent > 180) {
      alert('Session has exceeded the maximum time limit of 3 minutes. The session will not be saved.');
      // Navigate away without saving
      navigate('/dashboard');
      return;
    }

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

  const shouldShowSeeDetailsButton = (): boolean => {
    // Only show the button if at least one field is completed
    const fieldsCompleted = Object.values(formData).filter(value => value.trim() !== '').length;
    return fieldsCompleted > 0;
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
          <div className="start-content" role="dialog" aria-labelledby="test-title" aria-describedby="test-description">
            <h2 id="test-title">Usability Test</h2>
            <p id="test-description">Welcome to the usability test. You will be asked to complete a registration form while we track interaction patterns to improve user experience.</p>
            
            <div className="data-collection-notice">
              <h3>📊 Data Collection Notice</h3>
              <p><strong>What data the application collects:</strong></p>
              <ul>
                <li><strong>Interaction Metrics:</strong> Time spent, steps taken, field navigation patterns</li>
                <li><strong>Form Interactions:</strong> Field focus/blur events, input validation errors</li>
                <li><strong>Usability Indicators:</strong> Backtracking behavior, completion status</li>
                <li><strong>Performance Data:</strong> Task completion time, click patterns</li>
              </ul>
              
              <p><strong>What the application DO NOT collects:</strong></p>
              <ul>
                <li>No personal information (names, emails, passwords are not saved)</li>
                <li>No form content or input values</li>
                <li>No identifiable user data</li>
              </ul>
              
              <div className="compliance-info">
                <p><strong>Privacy & Compliance:</strong></p>
                <ul>
                  <li>Compliant with GDPR & data protection regulations</li>
                  <li>Anonymous session tracking only</li>
                  <li>Data used solely for usability analysis (ISO 9241-11)</li>
                  <li>You can cancel at any time without saving data</li>
                </ul>
              </div>
              
              <p className="consent-text">By clicking "Start Test", you consent to anonymous interaction tracking for usability research purposes.</p>
            </div>
            
            <div className="modal-buttons">
              <button 
                onClick={startNewTest} 
                className="start-button"
                aria-label="Start the usability test and consent to anonymous data collection"
              >
                I Understand - Start Test
              </button>
              <button 
                onClick={() => navigate('/')} 
                className="cancel-button"
                aria-label="Cancel and return to home page"
              >
                Cancel
              </button>
            </div>
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
            <form 
              onSubmit={handleSubmit} 
              className="registration-form"
              aria-label="Account registration form"
              noValidate
            >
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
                  aria-label="First Name"
                  aria-required="true"
                  aria-invalid={shouldShowValidationMessage('firstName') && getFieldValidationMessage('firstName', formData.firstName) ? 'true' : 'false'}
                  aria-describedby={shouldShowValidationMessage('firstName') && getFieldValidationMessage('firstName', formData.firstName) ? 'firstName-error' : undefined}
                />
                {shouldShowValidationMessage('firstName') && getFieldValidationMessage('firstName', formData.firstName) && (
                  <span className="validation-warning" id="firstName-error" role="alert" aria-live="polite">
                    {getFieldValidationMessage('firstName', formData.firstName)}
                  </span>
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
                  aria-label="Last Name"
                  aria-required="true"
                  aria-invalid={shouldShowValidationMessage('lastName') && getFieldValidationMessage('lastName', formData.lastName) ? 'true' : 'false'}
                  aria-describedby={shouldShowValidationMessage('lastName') && getFieldValidationMessage('lastName', formData.lastName) ? 'lastName-error' : undefined}
                />
                {shouldShowValidationMessage('lastName') && getFieldValidationMessage('lastName', formData.lastName) && (
                  <span className="validation-warning" id="lastName-error" role="alert" aria-live="polite">
                    {getFieldValidationMessage('lastName', formData.lastName)}
                  </span>
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
                  aria-label="Date of Birth in format day month year"
                  aria-required="true"
                  aria-invalid={shouldShowValidationMessage('dateOfBirth') && getFieldValidationMessage('dateOfBirth', formData.dateOfBirth) ? 'true' : 'false'}
                  aria-describedby={shouldShowValidationMessage('dateOfBirth') && getFieldValidationMessage('dateOfBirth', formData.dateOfBirth) ? 'dateOfBirth-error' : undefined}
                />
                {shouldShowValidationMessage('dateOfBirth') && getFieldValidationMessage('dateOfBirth', formData.dateOfBirth) && (
                  <span className="validation-warning" id="dateOfBirth-error" role="alert" aria-live="polite">
                    {getFieldValidationMessage('dateOfBirth', formData.dateOfBirth)}
                  </span>
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
                  aria-label="Email Address"
                  aria-required="true"
                  aria-invalid={shouldShowValidationMessage('email') && getFieldValidationMessage('email', formData.email) ? 'true' : 'false'}
                  aria-describedby={shouldShowValidationMessage('email') && getFieldValidationMessage('email', formData.email) ? 'email-error' : undefined}
                />
                {shouldShowValidationMessage('email') && getFieldValidationMessage('email', formData.email) && (
                  <span className="validation-warning" id="email-error" role="alert" aria-live="polite">
                    {getFieldValidationMessage('email', formData.email)}
                  </span>
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
                  aria-label="Password - must be at least 8 characters with uppercase, lowercase, and numbers"
                  aria-required="true"
                  aria-invalid={shouldShowValidationMessage('password') && getFieldValidationMessage('password', formData.password) ? 'true' : 'false'}
                  aria-describedby={shouldShowValidationMessage('password') && getFieldValidationMessage('password', formData.password) ? 'password-error' : undefined}
                />
                {shouldShowValidationMessage('password') && getFieldValidationMessage('password', formData.password) && (
                  <span className="validation-warning" id="password-error" role="alert" aria-live="polite">
                    {getFieldValidationMessage('password', formData.password)}
                  </span>
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
                  aria-label="Confirm Password - retype your password"
                  aria-required="true"
                  aria-invalid={shouldShowValidationMessage('confirmPassword') && getFieldValidationMessage('confirmPassword', formData.confirmPassword) ? 'true' : 'false'}
                  aria-describedby={shouldShowValidationMessage('confirmPassword') && getFieldValidationMessage('confirmPassword', formData.confirmPassword) ? 'confirmPassword-error' : undefined}
                />
                {shouldShowValidationMessage('confirmPassword') && getFieldValidationMessage('confirmPassword', formData.confirmPassword) && (
                  <span className="validation-warning" id="confirmPassword-error" role="alert" aria-live="polite">
                    {getFieldValidationMessage('confirmPassword', formData.confirmPassword)}
                  </span>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={handleCancel}
                  aria-label="Cancel registration and return to start"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`register-button ${!isFormValid() ? 'disabled' : ''}`}
                  disabled={!isFormValid()}
                  aria-label={!isFormValid() ? 'Register button disabled - please complete all fields correctly' : 'Register your account'}
                  aria-disabled={!isFormValid()}
                >
                  Register
                </button>
              </div>
            </form>
          </div>

          {/* Activity Monitor */}
          <div className="activity-monitor" role="complementary" aria-label="Activity tracking metrics">
            <h3>Activity monitor</h3>
            
            {/* Time Warning Display */}
            {secondsElapsed >= 150 && secondsElapsed < 180 && (
              <div 
                className="time-warning" 
                role="alert" 
                aria-live="assertive"
                style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '10px',
                  color: '#856404',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ⚠️ Warning: You have {180 - secondsElapsed} seconds remaining before the session times out!
              </div>
            )}

            <div className="metrics-grid" role="status" aria-live="polite">
              <div className="metric-item">
                <span className="metric-label">Task timer:</span>
                <span 
                  className="metric-value" 
                  aria-label={`Task time elapsed: ${activityMetrics.taskTime}`}
                  style={{
                    color: secondsElapsed >= 150 ? (secondsElapsed >= 180 ? '#dc3545' : '#fd7e14') : 'inherit'
                  }}
                >
                  {activityMetrics.taskTime}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Steps:</span>
                <span className="metric-value" aria-label={`Steps taken: ${activityMetrics.steps}`}>
                  {activityMetrics.steps}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Backtracks:</span>
                <span className="metric-value" aria-label={`Backtracks count: ${activityMetrics.backtracks}`}>
                  {activityMetrics.backtracks}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Errors:</span>
                <span className="metric-value" aria-label={`Errors count: ${activityMetrics.errors}`}>
                  {activityMetrics.errors}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Extra clicks:</span>
                <span className="metric-value" aria-label={`Extra clicks count: ${extraClicks}`}>
                  {extraClicks}
                </span>
              </div>
            </div>

            {shouldShowSeeDetailsButton() && (
              <button 
                onClick={seeDetails} 
                className="see-details-button"
                aria-label="View detailed analytics for this session"
              >
                See details
              </button>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
