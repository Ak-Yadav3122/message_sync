
# MessageSync - Real-time Messaging Application

MessageSync is a real-time messaging application that allows students, teachers, and institutions to communicate effectively. The application includes user authentication, role-based access control, and real-time messaging with online/offline status indicators.

## Features

- Authentication (Register, Login, Logout)
- Role-based User Management (Student, Teacher, Institute)
- Real-time Messaging with WebSockets
- Online/Offline Status Indicators
- Clean, Minimalist UI Design
- Responsive Layout

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

## Setup Instructions

### Frontend

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
```
npm install
```
4. Install Shadcn UI components:
```
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add tabs
npx shadcn@latest add scroll-area
```
5. Start the development server:
```
npm run dev
```

### Backend

1. Navigate to the server directory
2. Install dependencies:
```
npm install express mysql2 bcryptjs jsonwebtoken cors dotenv socket.io morgan
```
3. Create a `.env` file (use `.env.example` as a template)
4. Set up MySQL database:
```
mysql -u root -p < db/schema.sql
```
5. Start the server:
```
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout a user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a user by ID
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user (admin only)

### Messages
- `GET /api/messages` - Get all messages for current user
- `POST /api/messages` - Send a message
- `GET /api/messages/:userId` - Get conversation with a user

## WebSocket Events

- `join` - Join a room with user ID
- `private-message` - Send a private message
- `update-status` - Update user status
- `status-change` - Receive status change
- `receive-message` - Receive a message

## Project Structure

```
├── client/               # Frontend code
│   ├── public/           # Public assets
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── App.tsx       # Main app component
│   ├── tailwind.config.ts # Tailwind configuration
│   └── package.json      # Frontend dependencies
├── server/               # Backend code
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── db/               # Database scripts
│   ├── middleware/       # Express middleware
│   ├── routes/           # Express routes
│   ├── server.js         # Express app
│   └── package.json      # Backend dependencies
└── README.md             # Project documentation
```

## License

MIT
