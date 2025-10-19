# TriVium - Usability Analytics Platform

A 3-page web application for measuring registration form usability with real-time analytics and comprehensive metrics.

## Project Structure

### Backend (Django)
- **Models**: FormOutput & UserGroup for tracking usability metrics
- **API Endpoints**: RESTful API for session management and analytics
- **Real-time Calculations**: Effectiveness, Efficiency, Satisfaction, and Usability Index

### Frontend (React + TypeScript)
- **Home**: Landing page with test purpose and consent information
- **Test**: Interactive form with real-time tracking (coming next)
- **Dashboard**: Analytics visualization with dual states (coming next)

## Architecture

### Backend API Endpoints
```
POST /api/sessions/create/           - Create new testing session
POST /api/sessions/{id}/update/      - Update session metrics (real-time)
POST /api/sessions/{id}/complete/    - Complete session
GET  /api/sessions/{id}/analytics/   - Get session analytics
GET  /api/dashboard/summary/         - Overall dashboard statistics
GET  /api/dashboard/recent/          - Recent sessions list
```

### Usability Metrics Formulas
- **Effectiveness**: Success=100, Failure=0, Partial=(completed/required)*100
- **Efficiency**: 100 * (RTE - Overhead) where RTE=Tbase/Ttaken, Overhead=(backtracks+extra_clicks+excess_steps)/planned_steps
- **Satisfaction**: Success=68, Failure=0, Partial=scaled based on completion
- **Usability Index**: 0.40*E + 0.30*F + 0.30*S

## Current Status ✅ COMPLETE
- [x] **Django Backend**: Complete API with models and real-time calculations
- [x] **React Frontend**: Full 3-page application with routing and navigation
- [x] **Header Component**: Logo, navigation, and responsive design
- [x] **Home Page**: Landing content, consent, and test purpose explanation
- [x] **API Service Layer**: Complete TypeScript integration with backend
- [x] **Test Page - Comprehensive Form Tracking**:
  - [x] Start test modal with session management
  - [x] Registration form with real-time validation
  - [x] Advanced interaction tracking (focus/blur, backtracks, frustration clicks)
  - [x] Real-time activity monitor with live metrics
  - [x] Usability metrics tiles (Effectiveness, Efficiency, Satisfaction, Usability Index)
  - [x] Auto-save functionality with TestSave component
  - [x] Session completion and routing to dashboard
- [x] **Dashboard - Dual State Analytics Visualization**:
  - [x] **First State**: Session-specific analytics with detailed metrics
  - [x] **Second State**: Overall dashboard with "No session data" handling
  - [x] Session selector with navigation between states
  - [x] Real-time metrics tiles matching the design specifications
  - [x] Performance summaries and analytics breakdown
  - [x] Responsive design with mobile optimization

## Development

### Backend
```bash
cd backend
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm run dev
```

### Test Page Features ✅
- **Session Management**: Create new sessions or continue existing ones
- **Form Validation**: Real-time field validation with error highlighting
- **Interaction Tracking**:
  - Field focus/blur detection for step counting
  - Backtrack detection (jumping to previous fields)
  - Frustration click detection (4+ clicks within 600ms)
  - Form completion tracking
- **Real-time Metrics**: Live calculation and display of:
  - Effectiveness (completion rate)
  - Efficiency (time + overhead formula)
  - Satisfaction (based on completion status)
  - Usability Index (weighted combination)
- **Activity Monitor**: Live dashboard showing current step, time, interactions
- **Auto-save**: Periodic saving and local backup of form progress

### Dashboard Features ✅
- **Dual State Management**:
  - **Session Analytics**: Individual session breakdowns with detailed metrics
  - **Overall Dashboard**: Aggregate statistics across all sessions
  - **No Data State**: Proper handling when no sessions exist
- **Analytics Visualization**:
  - Usability metrics tiles (E, F, S, UI) with clean layout
  - Performance summaries with icons and formatted data
  - Session success/failure statistics
- **Navigation & UX**:
  - Clean overview interface without branding
  - Session selector dropdown with state persistence
  - Refresh functionality for real-time data
  - Responsive design for all screen sizes
  - Seamless routing between Test and Dashboard

## Project Complete ✅
1. ✅ ~~Django backend with models and API endpoints~~
2. ✅ ~~React frontend with routing and components~~
3. ✅ ~~Test page with comprehensive form tracking~~
4. ✅ ~~Dashboard with dual-state analytics visualization~~

## Ready for Deployment 🚀
- All features implemented according to specifications
- Real-time usability tracking with comprehensive metrics
- Modern, responsive UI matching design requirements
- Full TypeScript type safety and error handling
