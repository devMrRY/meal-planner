// Mock recipe database
const mockRecipes = [
  {
    id: '1',
    title: 'Garlic Pasta',
    summary: 'Quick creamy garlic pasta ready in 15 minutes.',
    image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=800&q=80',
    description: 'A fast weeknight favorite with parmesan, garlic, and herbs.',
    ingredients: ['200g pasta', '3 cloves garlic', '2 tbsp butter', 'Parmesan cheese', 'Fresh parsley', 'Salt and pepper'],
    steps: [
      'Boil water and cook pasta according to package directions.',
      'In a pan, melt butter over medium heat.',
      'Add minced garlic and sauté for 1-2 minutes until fragrant.',
      'Reserve 1 cup of pasta water, then drain pasta.',
      'Toss hot pasta with garlic butter, add pasta water as needed for sauce.',
      'Top with grated Parmesan and fresh parsley. Season with salt and pepper.'
    ],
    createdBy: 'user',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'Mediterranean Salad',
    summary: 'Fresh salad with feta, cucumber, and tomatoes.',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80',
    description: 'A crisp, colorful dish that works as lunch or side.',
    ingredients: ['2 cucumbers', '3 tomatoes', '200g feta cheese', '1 cup olives', 'Red onion', 'Olive oil', 'Lemon juice', 'Oregano'],
    steps: [
      'Chop cucumbers and tomatoes into bite-sized pieces.',
      'Slice red onion thinly.',
      'Cube or crumble feta cheese.',
      'Combine vegetables and feta in a large bowl.',
      'Add olives.',
      'Drizzle with olive oil and lemon juice.',
      'Sprinkle oregano, salt, and pepper to taste.',
      'Toss gently and serve chilled.'
    ],
    createdBy: 'system',
    createdAt: new Date('2024-01-10')
  }
];

let recipes = [...mockRecipes];

export async function GET() {
  return new Response(JSON.stringify(recipes), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  const newRecipe = await request.json();
  const recipe = {
    ...newRecipe,
    id: String(recipes.length + 1),
    createdBy: 'user',
    createdAt: new Date()
  };
  recipes.push(recipe);
  return new Response(JSON.stringify(recipe), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function PUT({ request }) {
  const updated = await request.json();
  recipes = recipes.map(r => (r.id === updated.id ? { ...r, ...updated } : r));
  return new Response(JSON.stringify(updated), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function DELETE({ request }) {
  const { id } = await request.json();
  const recipe = recipes.find(r => r.id === id);
  recipes = recipes.filter(r => r.id !== id);
  return new Response(JSON.stringify(recipe), {
    headers: { 'Content-Type': 'application/json' }
  });
}
