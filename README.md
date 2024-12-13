# OKR Tracker App

## Description
The OKR Tracker App is a web-based application designed to help organizations manage, track, and achieve their Objectives and Key Results (OKRs). It provides a user-friendly interface for creating, editing, assigning, and monitoring OKRs across the organization, facilitating goal alignment and performance tracking.

## Project Directory Overview
- **client/**: Contains the frontend code, built with React and Vite.
- **server/**: Contains the backend code, built with Express and MongoDB.
- **client/src/api/**: Contains API utility functions for frontend-backend communication.
- **server/routes/**: Contains Express routes for handling API requests.
- **server/models/**: Contains Mongoose models for database interaction.

## Tech Stack
- **Frontend**: React, Vite
- **Backend**: Express, Node.js
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: JWT, bcrypt

## Installation Instructions
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd okr-app-emu
   ```
3. Install dependencies for both client and server:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

## Configuration Files
- **server/.env**: Contains environment variables like `PORT`, `DATABASE_URL`, `SESSION_SECRET`, and `JWT_SECRET`.
  ```env
  PORT=3000
  DATABASE_URL=mongodb://localhost:27017/okr-app
  SESSION_SECRET="your-session-secret"
  JWT_SECRET="your-jwt-secret"
  ```

  Create `SESSION_SECRET` and `JWT_SECRET` using this command:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Key Features
- User Management: Registration, authentication, and role-based access control.
- OKR Management: Create, edit, delete, and assign OKRs.
- Reporting: Generate and export OKR progress reports.
- Collaboration: Comment and share OKRs with team members.
- Notifications: Customizable alerts for OKR updates.

## Deployment Instructions
- Ensure all environment variables are set correctly in the `.env` file.
- Use a process manager like PM2 for running the server in production.
- Consider using Docker for containerized deployment.

## How to Build and Run the Application
1. Start the development server:
   ```bash
   npm run start
   ```
2. Access the application at `http://localhost:5173`.