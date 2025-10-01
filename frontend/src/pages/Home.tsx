import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleStartTest = () => {
    // Navigate to test page which will create a new session
    navigate('/test');
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Main Content Section */}
        <div className="content-section">
          {/* Left Side - Text Content */}
          <div className="text-content">
            <h1 className="main-title">
              <span className="title-highlight">Usability</span> Analytics Platform
            </h1>
            <p className="subtitle">
              Go beyond the numbers. TriVium gives you a complete view of how users interact with your 
              website forms, so you can build a more effective, efficient, and satisfying experience.
            </p>
            
            {/* Test Purpose Section */}
            <div className="purpose-section">
              <h2 className="purpose-title">Test Purpose</h2>
              <p className="purpose-text">
                This usability test evaluates how effectively users can complete a registration form. 
                We measure key metrics including task completion rates, efficiency, user satisfaction, 
                and overall usability to identify areas for improvement.
              </p>
            </div>

            {/* CTA Button */}
            <button 
              onClick={handleStartTest}
              className="cta-button"
            >
              Try now
            </button>
          </div>

          {/* Right Side - Image */}
          <div className="image-content">
            <img 
              src="/src/assets/landpagescreen.png" 
              alt="Usability Analytics Dashboard"
              className="hero-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
