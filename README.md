# MessageSync - Real-time Messaging Application

## Overview
MessageSync is a real-time messaging application that allows users to connect, chat, and share messages instantly. The application features user authentication, friend requests, and real-time messaging capabilities.

## Technology Stack

### Frontend
- Vite + React
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Framer Motion for animations
- React Router for navigation
- TanStack Query for data fetching

### Backend
- Node.js
- Express.js
- MySQL Database
- Socket.io for real-time communication
- JWT for authentication
- Bcrypt for password hashing
- Docker for containerization

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (or Docker for containerized setup)
- Git

### Backend Setup

1. Navigate to the server directory:
cd server


2. Install dependencies:
npm install
3. Set up environment variables:

Copy .env.example to .env
Update the values as needed (especially DB credentials and JWT secret)
4. Database Setup (Option 1 - Docker):
docker-compose up -d
5. Database Setup (Option 2 - Local MySQL):
   Create a database 
   
   Import the schema:
   command: Get-Content db\schema.sql | mysql -u root -p
6. Start the server:
   npm run dev
The server will run on http://localhost:5000

### Frontend Setup
1. Navigate to the client directory:
   cd client

2. Install dependencies:
   npm install

3. Start the development server:
   npm run dev

   The client will run on http://localhost:8080

Features
User authentication (register, login, logout)
User profiles with different roles (student, teacher, institute)
Friend request system
Real-time messaging
Online/offline status indicators
Message read receipts
API Endpoints
Authentication
POST /api/auth/register - Register a new user
POST /api/auth/login - Login a user
GET /api/auth/me - Get current user
POST /api/auth/logout - Logout user
Users
GET /api/users - Get all users
GET /api/users/:id - Get user by ID
PUT /api/users/:id - Update user
DELETE /api/users/:id - Delete user (admin only)
Friend Requests
POST /api/friend-requests - Send friend request
GET /api/friend-requests - Get all friend requests
PUT /api/friend-requests/:id - Accept/reject friend request
GET /api/friends - Get all friends
Messages
POST /api/messages - Send message
GET /api/messages/:userId - Get conversation with user
Database Access
You can access the database using Adminer:

Start Docker containers if not already running
Access Adminer at http://localhost:8081
Login with:
System: MySQL
Server: mysql
Username: you username
Password: your password
Database: your database name



