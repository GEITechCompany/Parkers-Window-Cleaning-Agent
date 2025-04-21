# Window Cleaning Scheduling System

A modular, breathing system for scheduling window cleaning jobs, handling estimates, and managing teams.

## Features

- **Estimate Entry**: Manual entry of customer estimates
- **Team Scheduling**: Assign jobs to cleaning teams
- **Notifications**: Send and receive system notifications
- **Human Override**: Manual control over automated processes
- **Email Parsing**: (Coming Soon) Automatically parse job requests from emails

## Architecture

The system is built with a modular "breathing" architecture:

- **Frontend**: Next.js with App Router and TypeScript
- **Database**: Supabase (PostgreSQL)
- **API**: RESTful endpoints for each module
- **Authentication**: Supabase Auth (ready for implementation)

## Folder Structure

```
scheduling-system/
├── app/
│   ├── api/                  # Backend API routes
│   │   ├── estimates/        # Estimates CRUD endpoints
│   │   ├── jobs/             # Jobs CRUD endpoints
│   │   ├── teams/            # Teams data endpoints
│   │   └── notifications/    # Notifications endpoints
│   ├── estimate-entry/       # Estimate entry module
│   ├── team-scheduling/      # Team scheduling module
│   ├── notifications/        # Notifications module
│   ├── human-override/       # Human override module
│   ├── email-parsing/        # Email parsing module (placeholder)
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── page.tsx              # Main dashboard
│   └── layout.tsx            # App layout
├── public/                   # Static assets
└── .env.local                # Environment variables
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up Supabase:
   - Create a Supabase project
   - Update `.env.local` with your Supabase URL and anon key

4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Gmail API Configuration
The email parsing feature requires Gmail API credentials. To set up:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials
5. Configure the consent screen and add the required scopes (gmail.readonly)
6. Generate a refresh token using the OAuth 2.0 Playground

Add these credentials to your `.env.local` file:
```
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
REDIRECT_URI=http://localhost:3000/auth/callback
```

### Google Calendar API Configuration
For job scheduling features, configure Google Calendar API:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

## Modular Expansion

The system is designed for easy expansion:

1. Each module is self-contained
2. API endpoints follow a consistent pattern
3. Types are centralized for cross-module use
4. Add new features by creating new modules

## Human Oversight & Control

Human override capabilities are built into the core design:

- Manual override dashboard
- Notification system for important events
- All automated actions can be manually adjusted

## Next Steps

- Integration with Gmail API for email parsing
- QuickBooks integration for billing
- Calendar integration for team scheduling
- Mobile notifications via Twilio/SendGrid

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
