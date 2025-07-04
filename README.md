# Real-time Messaging App

A beautiful, modern real-time messaging application built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Authentication** - Secure email/password authentication
- 💬 **Real-time Messaging** - Instant message delivery with WebSocket connections
- 😊 **Mood Messages** - Express yourself with mood indicators (happy, sad, angry, anxious, neutral)
- 👤 **User Profiles** - Customizable profiles with avatars and status messages
- 🔍 **User Search** - Find and connect with other users
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- ⚡ **Optimistic Updates** - Instant UI feedback for better user experience
- 🎨 **Beautiful UI** - Modern design with smooth animations and transitions

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions, Authentication)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/realtime-messaging-app.git
cd realtime-messaging-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy your Project URL and Public anon key

4. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the database migrations:
   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Run the migration files from `supabase/migrations/` in order

6. Start the development server:
```bash
npm run dev
```

## Database Schema

The app uses the following main tables:

- **users** - User profiles and authentication data
- **chats** - Chat rooms and participants
- **messages** - Individual messages with mood indicators

## Features in Detail

### Authentication
- Email/password signup and signin
- Automatic profile creation with generated avatars
- Secure session management

### Real-time Messaging
- Instant message delivery using Supabase real-time subscriptions
- Typing indicators
- Message status (sending, sent, failed)
- Automatic retry for failed messages

### User Experience
- Optimistic UI updates for instant feedback
- Beautiful animations and micro-interactions
- Responsive design for all screen sizes
- Dark theme with gradient backgrounds

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Supabase](https://supabase.com) for the backend
- Icons by [Lucide](https://lucide.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com)