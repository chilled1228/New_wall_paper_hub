require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const featuredWallpapers = [
  // Nature Category
  {
    title: "Mountain Sunrise Landscape",
    description: "Breathtaking mountain sunrise with golden hour lighting and misty valleys. Perfect for nature lovers who appreciate serene landscapes.",
    category: "Nature",
    tags: ["mountain", "sunrise", "landscape", "golden hour", "misty", "serene", "peaceful"],
    image_url: "/mountain-sunrise-landscape-mobile-wallpaper.png"
  },
  {
    title: "Serene Lake Reflection",
    description: "Crystal clear lake reflecting surrounding mountains and sky. A perfect minimalist nature wallpaper for meditation and calm.",
    category: "Nature",
    tags: ["lake", "reflection", "mountains", "calm", "peaceful", "water", "minimalist"],
    image_url: "/serene-lake-reflection-mobile-wallpaper.png"
  },
  {
    title: "Deep Ocean Underwater",
    description: "Mysterious deep ocean scene with rays of sunlight penetrating the blue depths. Ideal for ocean and marine life enthusiasts.",
    category: "Nature",
    tags: ["ocean", "underwater", "deep sea", "blue", "sunlight", "marine", "mysterious"],
    image_url: "/deep-ocean-underwater-mobile-wallpaper.png"
  },

  // Abstract Category
  {
    title: "Abstract Colorful Waves",
    description: "Dynamic abstract waves in vibrant colors creating a fluid, energetic composition. Perfect for modern and artistic phone setups.",
    category: "Abstract",
    tags: ["abstract", "waves", "colorful", "vibrant", "fluid", "dynamic", "modern", "artistic"],
    image_url: "/abstract-colorful-waves-mobile-wallpaper.png"
  },
  {
    title: "Gradient Dreams Abstract",
    description: "Smooth gradient transitions in dreamy pastel colors. A soothing abstract wallpaper that's easy on the eyes.",
    category: "Abstract",
    tags: ["gradient", "abstract", "pastel", "dreamy", "smooth", "soothing", "soft colors"],
    image_url: "/gradient-dreams-abstract-mobile-wallpaper.png"
  },

  // Minimalist Category
  {
    title: "Minimalist Geometric Shapes",
    description: "Clean geometric shapes in neutral colors. Perfect for users who prefer simple, uncluttered designs.",
    category: "Minimalist",
    tags: ["minimalist", "geometric", "shapes", "clean", "neutral", "simple", "modern"],
    image_url: "/minimalist-geometric-shapes-mobile-wallpaper.png"
  },

  // Technology Category
  {
    title: "Neon City Nights Cyberpunk",
    description: "Futuristic cyberpunk cityscape with neon lights and digital aesthetics. Perfect for tech enthusiasts and gamers.",
    category: "Technology",
    tags: ["cyberpunk", "neon", "city", "futuristic", "technology", "digital", "gaming", "sci-fi"],
    image_url: "/neon-city-nights-cyberpunk-mobile-wallpaper.png"
  },

  // Space Category
  {
    title: "Galaxy Nebula Space",
    description: "Stunning galaxy nebula with colorful cosmic clouds and distant stars. Perfect for space and astronomy enthusiasts.",
    category: "Space",
    tags: ["galaxy", "nebula", "space", "cosmic", "stars", "astronomy", "universe", "colorful"],
    image_url: "/space-galaxy-category-wallpaper.png"
  },

  // Animals Category
  {
    title: "Cute Animals Wildlife",
    description: "Adorable wildlife animals in their natural habitat. Perfect for animal lovers and nature enthusiasts.",
    category: "Animals",
    tags: ["animals", "wildlife", "cute", "nature", "habitat", "adorable", "pets"],
    image_url: "/cute-animals-wildlife.png"
  },

  // Architecture Category
  {
    title: "Modern Architecture Design",
    description: "Contemporary architectural design with clean lines and geometric patterns. Perfect for design and architecture enthusiasts.",
    category: "Architecture",
    tags: ["architecture", "modern", "design", "geometric", "contemporary", "building", "structure"],
    image_url: "/modern-architecture-category-wallpaper.png"
  },

  // Cars Category
  {
    title: "Luxury Sports Car",
    description: "High-end luxury sports car with sleek design and premium finish. Perfect for automotive enthusiasts.",
    category: "Cars",
    tags: ["luxury", "sports car", "automotive", "sleek", "premium", "vehicle", "fast"],
    image_url: "/luxury-cars-category-wallpaper.png"
  },

  // Gaming Category
  {
    title: "Gaming Esports Arena",
    description: "Professional esports gaming setup with RGB lighting and high-tech equipment. Perfect for gamers and esports fans.",
    category: "Gaming",
    tags: ["gaming", "esports", "RGB", "technology", "professional", "setup", "competitive"],
    image_url: "/gaming-esports-category-wallpaper.png"
  }
];

async function seedWallpapers() {
  try {
    console.log('Starting wallpaper seeding...');
    
    // Check if wallpapers already exist
    const { data: existingWallpapers, error: checkError } = await supabase
      .from('wallpapers')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing wallpapers:', checkError);
      return;
    }

    if (existingWallpapers && existingWallpapers.length > 0) {
      console.log('Wallpapers already exist in database. Skipping seeding.');
      return;
    }

    // Insert wallpapers in batches
    const batchSize = 5;
    for (let i = 0; i < featuredWallpapers.length; i += batchSize) {
      const batch = featuredWallpapers.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('wallpapers')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        continue;
      }

      console.log(`Successfully inserted batch ${i / batchSize + 1} (${batch.length} wallpapers)`);
    }

    console.log('Wallpaper seeding completed successfully!');
    
    // Verify the count
    const { count, error: countError } = await supabase
      .from('wallpapers')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`Total wallpapers in database: ${count}`);
    }

  } catch (error) {
    console.error('Error during wallpaper seeding:', error);
  }
}

// Run the seeding function
seedWallpapers()
  .then(() => {
    console.log('Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding process failed:', error);
    process.exit(1);
  });
