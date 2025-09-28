import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { FormOutputData } from '../services/api';

interface SessionSelectorProps {
  selectedSession: string;
  onSessionChange: (sessionId: string) => void;
  label?: string;
}

export const SessionSelector: React.FC<SessionSelectorProps> = ({ 
  selectedSession, 
  onSessionChange,
  label = "Session Selection:"
}) => {
  const [sessions, setSessions] = useState<FormOutputData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const recentSessions = await apiService.getRecentSessions();
        setSessions(recentSessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  if (loading) {
    return (
      <div className="session-selector">
        <span>Loading sessions...</span>
      </div>
    );
  }

  return (
    <div className="session-selector">
      <label htmlFor="session-select">{label}</label>
      <select
        id="session-select"
        value={selectedSession}
        onChange={(e) => onSessionChange(e.target.value)}
        className="session-dropdown"
      >
        <option value="all">All Sessions</option>
        {sessions.map((session) => (
          <option key={session.session_id} value={session.session_id}>
            Session {session.session_id} - {session.completion_status}
          </option>
        ))}
      </select>
      <span className="time-filter">All Time</span>
    </div>
  );
};

// Hook for managing session state
export const useSessionManagement = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>('all');

  const handleSessionChange = (sessionId: string, navigate?: (path: string) => void) => {
    setSelectedSession(sessionId);
    
    if (sessionId === 'all') {
      setCurrentSessionId(null);
      if (navigate) navigate('/dashboard');
    } else {
      setCurrentSessionId(sessionId);
      if (navigate) navigate(`/dashboard?session=${sessionId}`);
    }
  };

  return {
    currentSessionId,
    selectedSession,
    setCurrentSessionId,
    setSelectedSession,
    handleSessionChange
  };
};

export default SessionSelector;
