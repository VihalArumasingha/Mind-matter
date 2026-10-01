# Project Documentation

## Project Structure
- **Backend**: Node.js/Express API with MongoDB
- **Frontend**: React Native mobile application

## Environment Setup

### Backend Environment Variables (.env in backend/)
```
MONGODB_URI=mongodb://localhost:27017/volunteer-app
JWT_SECRET=your-jwt-secret-here
ZOOM_ACCOUNT_ID=your-zoom-account-id
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
ZOOM_USER_ID=me
```

### Frontend Environment Variables
- API_BASE_URL is configured in `frontend/src/config/api.js`

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev  # Start with nodemon for auto-reload
npm start    # Start normally
```

### Frontend
```bash
cd frontend
npm install
npm start      # Start Metro bundler
npm run android # Run on Android
npm run ios     # Run on iOS (requires macOS)
```

## Zoom Integration

The application now includes Zoom meeting link generation for counseling sessions:

### Features:
1. Volunteers can generate Zoom meeting links for confirmed/accepted session requests
2. Zoom links are automatically sent to users via in-app notifications
3. Session cards change color (light blue) when Zoom link has been sent
4. Zoom meeting details are stored in the Booking model

### Implementation Details:

**Backend Changes:**
- Added `zoomMeetingLink` and `zoomLinkSent` fields to Booking model
- Created `backend/utils/zoomUtils.js` with Zoom API integration functions
- Added `sendZoomLink` controller function in `volunteerController.js`
- Added route `POST /api/volunteer/requests/:id/zoom` in `volunteerRoutes.js`
- Installed `axios` for Zoom API calls

**Frontend Changes:**
- Added `sendZoomLink` function in `volunteerService.js`
- Added "Send Zoom Link" button in `VolunteerRequestsScreen.jsx` for accepted sessions
- Added visual indicator (green badge) when Zoom link has been sent
- Session cards turn light blue when Zoom link is sent

### Zoom API Setup:
1. Create a Zoom account and get API credentials from [Zoom Marketplace](https://marketplace.zoom.us/)
2. Create a Server-to-Server OAuth app
3. Add the following environment variables to your backend `.env`:
   - `ZOOM_ACCOUNT_ID`: Your Zoom Account ID
   - `ZOOM_CLIENT_ID`: Your Zoom Client ID
   - `ZOOM_CLIENT_SECRET`: Your Zoom Client Secret
   - `ZOOM_USER_ID`: Your Zoom user ID or email (defaults to 'me')

### Testing the Zoom Integration:
1. Ensure backend is running with Zoom credentials configured
2. Navigate to Volunteer Requests screen in the app
3. Accept a pending session request
4. Click "Send Zoom Link" button on the accepted session
5. Verify the session card changes color
6. Check that the user receives a notification with the Zoom link

## Database Models

### Booking
- Stores session booking information between users and professionals
- Fields: zoomMeetingLink, zoomLinkSent (added for Zoom integration)

### Session
- Stores support circle session information
- Used for group sessions (different from individual bookings)

## API Endpoints

### Volunteer Routes
- `GET /api/volunteer/dashboard` - Get volunteer dashboard data
- `GET /api/volunteer/requests` - Get volunteer requests
- `POST /api/volunteer/requests/:id/accept` - Accept a request
- `POST /api/volunteer/requests/:id/decline` - Decline a request
- `POST /api/volunteer/requests/:id/zoom` - Send Zoom meeting link (NEW)
- `GET /api/volunteer/availability/schedule` - Get availability schedule
- `POST /api/volunteer/availability/schedule` - Save availability schedule
- `POST /api/volunteer/availability/slots` - Create availability slot
- `PUT /api/volunteer/availability/slots/:id` - Update availability slot
- `DELETE /api/volunteer/availability/slots/:id` - Delete availability slot
- `PUT /api/volunteer/availability` - Update availability status

## Troubleshooting

### Zoom Integration Issues:
- If Zoom link generation fails, check console logs for specific error messages
- Verify Zoom API credentials are correct in backend `.env`
- Ensure Zoom API key has necessary permissions (create meetings)
- Check network connectivity to Zoom API servers

### Backend Issues:
- Ensure MongoDB is running locally or update MONGODB_URI
- Check that all dependencies are installed with `npm install`
- Verify JWT_SECRET is set in .env

### Frontend Issues:
- Ensure Metro bundler is running (`npm start`)
- For iOS: run `bundle exec pod install` if native dependencies change
- Check API_BASE_URL in config/api.js matches backend URL
