import { useState, useEffect } from 'react';
import './TestSave.css';

interface TestSaveProps {
  formData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  onSave: () => void;
}

const TestSave: React.FC<TestSaveProps> = ({ formData, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [formData]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save form data to localStorage as backup
      localStorage.setItem('test-form-backup', JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString()
      }));
      
      onSave();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    return lastSaved.toLocaleTimeString();
  };

  return (
    <div className="test-save">
      <button 
        onClick={handleSave} 
        disabled={isSaving}
        className="save-button"
        title="Save current progress"
      >
        {isSaving ? '💾 Saving...' : '💾 Test Save'}
      </button>
      {lastSaved && (
        <span className="last-saved">
          Last saved: {formatLastSaved()}
        </span>
      )}
    </div>
  );
};

export default TestSave;
