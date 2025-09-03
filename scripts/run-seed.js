const { execSync } = require('child_process');
const path = require('path');

// Compile and run the TypeScript seeding script
try {
  console.log('Compiling and running wallpaper seeding script...');
  
  // Use ts-node to run the TypeScript file directly
  execSync('npx ts-node scripts/seed-wallpapers.ts', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('Seeding completed successfully!');
} catch (error) {
  console.error('Error running seeding script:', error.message);
  process.exit(1);
}
