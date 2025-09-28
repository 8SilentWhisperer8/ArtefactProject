
import './Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <h1>Analytics Dashboard</h1>
        <p>This is the Dashboard page - Coming in the next step!</p>
        <div className="placeholder-content">
          <p>Here we will implement:</p>
          <ul>
            <li>Session selection interface</li>
            <li>Usability metrics tiles (E, F, S, UI)</li>
            <li>Overall analytics summary</li>
            <li>No session data state</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
