# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development
- `pnpm dev` - Start Next.js development server with Turbopack
- `pnpm build` - Build application for production
- `pnpm start` - Start production server

### Code Quality
- `pnpm format` - Format and lint code with Biome (includes auto-fixing)
- `pnpm type:check` - Run TypeScript type checking without file output

### Testing
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run all tests once
- `pnpm test:ui` - Run tests with Vitest UI interface

### Supabase Database
- `pnpm supabase:start` - Start local Supabase instance
- `pnpm supabase:stop` - Stop local Supabase instance
- `pnpm supabase:reset` - Reset local database to latest migrations
- `pnpm supabase:type` - Generate TypeScript types from Supabase schema
- `pnpm supabase:test` - Run Supabase database tests
- `pnpm supabase:sample` - Populate database with sample data

## Architecture Overview

### Database & Authentication
This is a Supabase-driven application with Row Level Security (RLS) as the core security model:

- **Profiles table**: Main user data table with soft delete support (`deleted_at` column)
- **RLS policies**: Users can only access their own data based on `auth.uid()` matching `user_id`
- **Soft delete logic**: RLS policies exclude records where `deleted_at` IS NOT NULL
- **Role-based access**: Admin and user roles with middleware-based route protection

### Supabase Client Management
- `lib/supabaseClient.ts` - Main client for browser/app usage
- `lib/supabaseClientServer.ts` - Server-side client for server actions and middleware
- Service role client bypasses RLS for administrative operations

### Authentication & Authorization
- **Middleware**: `middleware.ts` handles route protection and role-based redirections
- **Admin routes**: `/admin/*` - restricted to users with `role = "admin"`
- **User routes**: `/home/*`, `/profile/*` - for authenticated users
- **Registration flow**: New users must complete profile registration

### Testing Strategy
- **Unit testing**: Vitest with jsdom environment for utilities and components
- **Database testing**: SQL-based tests using pgTAP framework in `supabase/tests/database/`
- **RLS testing**: Comprehensive tests for data isolation and soft delete behavior
- **Test environment**: Suppresses Supabase GoTrueClient multiple instance warnings

### Component Structure
- App Router architecture with layout-based routing
- Components in `app/_components/` for reusable UI elements
- Authentication handling with development login buttons
- Type-safe database operations using generated types in `types/database.types.ts`

### Key Configuration Files
- `biome.json` - Code formatting and linting (double quotes, sorted classes)
- `vitest.config.ts` - Test environment setup with jsdom and global utilities
- `test/setup.ts` - Test environment setup with Next.js env loading
- `middleware.ts` - Route protection and role-based access control

### Development Workflow
1. Start local Supabase: `pnpm supabase:start`
2. Generate types after schema changes: `pnpm supabase:type`
3. Run type checking before commits: `pnpm type:check`
4. Verify RLS policies with integration tests after database changes
5. Auto-format code: `pnpm format`

### Security Considerations
- All database operations must respect RLS policies
- Service role key required for test user management and admin operations
- Authentication state managed by Supabase Auth with user_id foreign keys
- Soft delete implementation prevents accidental data exposure