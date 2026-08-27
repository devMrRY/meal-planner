-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  image TEXT,
  description TEXT,
  ingredients TEXT[] DEFAULT '{}',
  steps TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create favorites table (many-to-many)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  user_id TEXT PRIMARY KEY,
  plan JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed demo categories and subcategories using parent_id relationships
INSERT INTO categories (id, name, parent_id)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'Breakfast', NULL),
  ('22222222-2222-4222-8222-222222222222', 'Lunch', NULL),
  ('33333333-3333-4333-8333-333333333333', 'Dinner', NULL),
  ('44444444-4444-4444-8444-444444444444', 'Dessert', NULL),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Pancakes', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Eggs', '11111111-1111-4111-8111-111111111111'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Smoothies', '11111111-1111-4111-8111-111111111111'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Salads', '22222222-2222-4222-8222-222222222222'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Wraps', '22222222-2222-4222-8222-222222222222'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'Soups', '22222222-2222-4222-8222-222222222222'),
  ('12121212-1212-4121-8121-121212121212', 'Pasta', '33333333-3333-4333-8333-333333333333'),
  ('13131313-1313-4131-8131-131313131313', 'Rice Bowls', '33333333-3333-4333-8333-333333333333'),
  ('14141414-1414-4141-8141-141414141414', 'Curries', '33333333-3333-4333-8333-333333333333'),
  ('15151515-1515-4151-8151-151515151515', 'Cakes', '44444444-4444-4444-8444-444444444444'),
  ('16161616-1616-4161-8161-161616161616', 'Fruit', '44444444-4444-4444-8444-444444444444'),
  ('17171717-1717-4171-8171-171717171717', 'Ice Cream', '44444444-4444-4444-8444-444444444444')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_subcategory_id ON recipes(subcategory_id);

-- Enable RLS (Row Level Security)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Allow anon key to read/write for demo)
-- WARNING: These are permissive for development. Restrict in production!

-- Recipes: Allow anyone to read, anyone to insert/update/delete (for demo)
CREATE POLICY "allow_read_recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "allow_insert_recipes" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_recipes" ON recipes FOR UPDATE USING (true);
CREATE POLICY "allow_delete_recipes" ON recipes FOR DELETE USING (true);

-- Favorites: Allow anyone to read/insert/delete their own (using user_id)
CREATE POLICY "allow_read_favorites" ON favorites FOR SELECT USING (true);
CREATE POLICY "allow_insert_favorites" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_favorites" ON favorites FOR DELETE USING (true);

-- Meal Plans: Allow anyone to read/upsert their own
CREATE POLICY "allow_read_meal_plans" ON meal_plans FOR SELECT USING (true);
CREATE POLICY "allow_upsert_meal_plans" ON meal_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_meal_plans" ON meal_plans FOR UPDATE USING (true);

-- Categories: Allow anyone to read, insert/update/delete for demo
CREATE POLICY "allow_read_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "allow_insert_categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "allow_delete_categories" ON categories FOR DELETE USING (true);

export type DbRecipe = {
  id: string;
  title: string;
  summary?: string;
  image?: string;
  description?: string;
  ingredients?: string[];
  steps?: string[];
  category_id?: string | null;
  subcategory_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
};
