# Recipe Planner Consumer

A SvelteKit application for discovering, saving, and organizing recipes using a Supabase-backed data layer and reusable StencilJS web components.

## Live Application

- Netlify deployment: https://meal-planner-nagp.netlify.app/
- SvelteKit repository: https://github.com/devMrRY/meal-planner
- Default branch: main
- Stencil component package: https://www.npmjs.com/package/@reticentrahul/recipe-planner
- Stencil package version: 1.0.7
- Stencil library repository: https://github.com/devMrRY/recipe_planner
- Stencil library default branch: master

## Architecture Overview

This project uses:

- SvelteKit for the application shell and routing
- Supabase for storing recipe data, favorites, and weekly meal plans
- StencilJS for reusable web components packaged as a published npm library
- Netlify for deployment from the main branch

## Assumptions

- Recipe data is managed in Supabase rather than a public third-party recipe API.
- Favorites and meal plans are stored per user in the same Supabase project.
- User identity is represented by a local storage key (`rp_user`) for demo purposes.
- This project is intended for a demo or portfolio implementation, not a production-grade multi-user auth system.

## Features

- Search and filter recipes
- Browse recipe listings
- View full recipe details
- Create, edit, and delete recipes created by the current user
- Validate recipe form inputs before saving
- Add and remove favorites
- View all favorite recipes
- Create and update a weekly meal plan
- Use Stencil web components across the app experience

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy your **Project URL** and **Anon Public Key** from project settings.

### 2. Set Up Database Tables

Use the SQL migration file:

- In the Supabase dashboard, open **SQL Editor**
- Paste the contents of `supabase.sql`
- Run the migration

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Then update `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Development Server

```bash
npm run dev
```

The app will run at:

```text
http://localhost:5173
```

## Stencil Package Usage

The SvelteKit app consumes the published Stencil package as an npm dependency:

```bash
npm install @reticentrahul/recipe-planner
```

The app dynamically loads the custom elements in the client runtime and uses them in the UI through Svelte components.

## Deployment

This application is deployed on Netlify.

Deployment workflow:

- code is merged into the `main` branch
- Netlify automatically starts a build and deploy
- direct merge to `main` is restricted
- changes must be merged via a pull request before deployment begins

## Database Schema

### recipes
- `id` (uuid, primary key)
- `title` (text, required)
- `summary` (text)
- `image` (text)
- `description` (text)
- `ingredients` (text array)
- `steps` (text array)
- `created_by` (text)
- `created_at` (timestamptz)

### favorites
- `id` (uuid, primary key)
- `user_id` (text)
- `recipe_id` (uuid, foreign key to recipes)

### meal_plans
- `user_id` (text)
- `plan` (jsonb)

## Notes

- This project uses a simple `localStorage` key (`rp_user`) for user identification.
- RLS policies in the provided SQL are permissive for development and may need tightening for production.
- The anon key should be restricted in production to only allow authenticated or trusted access.

## Troubleshooting

### "500 error on page load"

Check the browser console for error messages. Common issues:

1. Missing Supabase tables
2. Incorrect environment variables
3. RLS policies blocking access

### "Tables don't exist"

Run the contents of `supabase.sql` in the Supabase SQL editor.

## Repository Links

- App repo: https://github.com/devMrRY/meal-planner
- Stencil repo: https://github.com/devMrRY/recipe_planner
- NPM package: https://www.npmjs.com/package/@reticentrahul/recipe-planner

