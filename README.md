# Recipe Planner

A SvelteKit application for discovering, searching, filtering, saving, and organizing recipes using Supabase as the data layer and reusable StencilJS web components for the UI.

## Live Demo

- Netlify app: https://meal-planner-nagp.netlify.app/
- SvelteKit repository: https://github.com/devMrRY/meal-planner
- Default branch: `main`
- Stencil component library: https://github.com/devMrRY/recipe_planner
- Stencil package: https://www.npmjs.com/package/@reticentrahul/recipe-planner
- Latest package version: `1.0.7`

## Project Overview

This project demonstrates a full-stack frontend architecture combining:

- SvelteKit for routing, page composition, and state-driven UI
- Supabase for persistent recipe, favorite, and meal-plan data
- StencilJS for reusable web components packaged as an npm library
- Netlify for automated deployment

The app supports both recipe browsing and personal recipe management, with all data stored in the project database instead of a public recipe API.

## Features

- Search recipes by title
- Filter by category and subcategory
- Browse recipes in a structured grid layout
- View full recipe details with ingredients and steps
- Create, edit, and delete user-created recipes
- Validate recipe form input before saving
- Add or remove recipes from favorites
- View all saved favorite recipes
- Create and manage a weekly meal plan
- Use Stencil web components throughout the experience

## Tech Stack

- Svelte 5
- SvelteKit
- Supabase
- StencilJS
- TypeScript
- Netlify

## Assumptions

- Recipe data is stored in Supabase rather than fetched from a public recipe API.
- Favorites and meal plans are stored per user in the same Supabase project.
- Demo user identity is represented by a `userId` stored in browser localStorage.
- This is a portfolio/demo project and not a production-grade authentication system.

## Setup

### 1. Create a Supabase project

1. Go to https://supabase.com
2. Create a new project
3. Copy the project URL and anon key from the project settings

### 2. Run the SQL schema

Open the Supabase SQL editor and execute the contents of `supabase.sql`.

### 3. Configure environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Then set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install dependencies

```bash
npm install
```

### 5. Start the app

```bash
npm run dev
```

The app runs locally at:

```text
http://localhost:5173
```

## Stencil Package

The app consumes the published Stencil library package:

```bash
npm install @reticentrahul/recipe-planner
```

The library exposes reusable custom elements such as:

- `recipe-card`
- `recipe-list`
- `recipe-detail`
- `recipe-form`
- `meal-planner`
- `app-modal`

## Database Schema

### `recipes`

- `id` (uuid, primary key)
- `title` (text, required)
- `image` (text)
- `description` (text)
- `ingredients` (text[])
- `steps` (text[])
- `category_id` (uuid, nullable)
- `subcategory_id` (uuid, nullable)
- `is_deleted` (boolean, default `false`)
- `created_by` (text, default `'system'`)
- `created_at` (timestamptz, default `now()`)
- `updated_by` (text, default `'system'`)
- `updated_at` (timestamptz, default `now()`)

### `favorites`

- `id` (uuid, primary key)
- `user_id` (text)
- `recipe_id` (uuid)
- `updated_by` (text, default `'system'`)
- `updated_at` (timestamptz, default `now()`)
- unique constraint on `(user_id, recipe_id)`

### `meal_plans`

- `id` (uuid, primary key)
- `user_id` (text)
- `meal_type` (text)
- `recipe_id` (uuid)
- `updated_by` (text, default `'system'`)
- `updated_at` (timestamptz, default `now()`)

### `categories`

- `id` (uuid, primary key)
- `name` (text)
- `parent_id` (uuid, nullable)
- `created_at` (timestamptz, default `now()`)
- `created_by` (text, default `'system'`)

## Deployment

The app is deployed on Netlify.

Deployment flow:

- code is merged into the `main` branch
- Netlify builds and deploys automatically
- direct merges to `main` are restricted
- pull requests are required before deployment begins

## Important Notes

- The app uses `localStorage` with a `userId` key for demo user tracking.
- Seed category data is included for breakfast, lunch, dinner, dessert, and related subcategories.
- Row Level Security is intentionally permissive for development use.
- Production deployments should tighten database access and authentication rules.

## Troubleshooting

### App fails to load

Common causes:

1. Missing Supabase environment variables
2. Tables were not created in Supabase
3. RLS policies are blocking access
4. Database schema is not up to date

### Missing tables

Run the SQL in `supabase.sql` in the Supabase SQL editor.

## Repository Links

- App repo: https://github.com/devMrRY/meal-planner
- Stencil repo: https://github.com/devMrRY/recipe_planner
- NPM package: https://www.npmjs.com/package/@reticentrahul/recipe-planner

