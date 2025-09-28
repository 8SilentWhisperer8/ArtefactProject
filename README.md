# Vium - Usability Analytics Platform

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

## Current Status ✅
- [x] Django models and API backend
- [x] React routing and navigation
- [x] Header component with logo and navigation
- [x] Home page with landing content
- [x] API service layer for backend communication
- [ ] Test page with form tracking (next step)
- [ ] Dashboard with analytics visualization (next step)

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

## Next Steps
1. Implement Test page with registration form and real-time tracking
2. Implement Dashboard with analytics tiles and session management
3. Add comprehensive event tracking and activity monitoring
