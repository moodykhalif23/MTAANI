# Mtaani - Local Community Platform

![Mtaani Logo](public/images/mtaani-logo.png)

Mtaani is a comprehensive local community platform that connects residents with businesses, events, and community resources in their neighborhood. This README provides technical documentation for developers who want to contribute to the project.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Key Features](#key-features)
- [Component Library](#component-library)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Contributing](#contributing)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Deployment](#deployment)

## Tech Stack

Mtaani is built with modern web technologies:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: (To be implemented)
- **Database**: (To be implemented)
- **Maps Integration**: (To be implemented)
- **Search**: (To be implemented)

## Project Structure

\`\`\`
mtaani/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin dashboard
│   ├── businesses/         # Business listings and details
│   ├── calendar/           # Event calendar
│   ├── community/          # Community features
│   ├── events/             # Event listings and details
│   ├── submit-business/    # Business submission form
│   ├── submit-event/       # Event submission form
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # Reusable components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Custom components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── public/                 # Static assets
│   └── images/             # Image assets
└── ...
\`\`\`

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/your-username/mtaani.git
   cd mtaani
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/feature-name`: For new features
- `bugfix/bug-name`: For bug fixes

### Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

\`\`\`
feat: add business search functionality
fix: resolve carousel navigation issue
docs: update README with API documentation
style: format code with prettier
refactor: restructure business card component
test: add tests for review system
\`\`\`

## Key Features

### Current Features

- Business directory with detailed business pages
- Event listings and calendar
- Community forum and local news
- Business and event submission forms
- Admin dashboard for content management
- Review system for businesses and events
- Category browsing with interactive carousel
- Featured businesses and events section

### Components and Pages

- **Business Components**: Business cards, detail pages, search, filters
- **Event Components**: Event cards, calendar, registration
- **Community Components**: Discussion forum, news feed, user profiles
- **Admin Components**: Dashboard, content moderation, analytics
- **Form Components**: Business submission, event creation, reviews

## Component Library

We use shadcn/ui components as building blocks. These are located in `components/ui/`. For custom components, follow these guidelines:

1. Create reusable components in the `components/` directory
2. Use TypeScript interfaces for props
3. Follow the component naming convention: `ComponentName.tsx`
4. Include proper JSDoc comments for complex components

Example component structure:

\`\`\`tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface MyComponentProps {
  /** Description of the prop */
  title: string
  /** Optional callback function */
  onAction?: () => void
}

/**
 * MyComponent - Description of what this component does
 */
export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false)
  
  return (
    <div>
      <h2>{title}</h2>
      <Button onClick={onAction}>Click me</Button>
    </div>
  )
}
\`\`\`

## State Management

For simple state, we use React's built-in hooks (`useState`, `useReducer`). For more complex state management, we plan to implement:

- React Context for theme, user authentication, and app-wide settings
- Server Components for data fetching where appropriate
- Client Components with hooks for interactive UI elements

## API Integration

(To be implemented)

We'll be building a REST API with the following endpoints:

- `/api/businesses` - Business CRUD operations
- `/api/events` - Event CRUD operations
- `/api/users` - User management
- `/api/reviews` - Review system
- `/api/search` - Search functionality

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Code Standards

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful comments and documentation
- Use semantic HTML and ensure accessibility
- Optimize for performance and SEO
- Write unit tests for critical functionality

## Testing

(To be implemented)

We plan to use:
- Jest for unit testing
- React Testing Library for component testing
- Cypress for end-to-end testing

## Deployment

(To be implemented)

We plan to deploy on Vercel with the following environments:
- Production: main branch
- Staging: develop branch
- Preview: PR deployments
