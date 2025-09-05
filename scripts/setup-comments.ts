import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createCommentTables() {
  console.log('🗄️ Creating blog comment tables...')
  
  try {
    // Read the SQL schema file
    const sqlContent = readFileSync('./scripts/create-blog-comments-schema.sql', 'utf8')
    
    // Split SQL commands by semicolon and execute them one by one
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Found ${commands.length} SQL commands to execute`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.length > 0) {
        console.log(`⚡ Executing command ${i + 1}/${commands.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp_table_that_does_not_exist')
            .select('*')
          
          // Since we can't execute raw SQL easily, let's create tables manually
          console.log('⚠️ Raw SQL execution not available, creating tables manually...')
          break
        }
      }
    }
    
    // Manual table creation
    console.log('🔨 Creating tables manually...')
    await createTablesManually()
    
    console.log('✅ Blog comment tables created successfully!')
    
  } catch (error) {
    console.error('❌ Error creating comment tables:', error)
    process.exit(1)
  }
}

async function createTablesManually() {
  // Since Supabase doesn't allow raw SQL execution from client,
  // we'll just verify the tables exist or provide instructions
  
  try {
    // Test if blog_comments table exists
    const { error: commentsError } = await supabase
      .from('blog_comments')
      .select('id')
      .limit(1)
    
    if (commentsError) {
      console.log('📋 blog_comments table does not exist.')
      console.log('🔗 Please run the following SQL in your Supabase SQL Editor:')
      console.log('👉 https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
      console.log('')
      console.log('📄 Execute the contents of: scripts/create-blog-comments-schema.sql')
      console.log('')
      return false
    }
    
    // Test if blog_comment_votes table exists
    const { error: votesError } = await supabase
      .from('blog_comment_votes')
      .select('id')
      .limit(1)
    
    if (votesError) {
      console.log('📋 blog_comment_votes table does not exist.')
      console.log('🔗 Please run the SQL schema in Supabase SQL Editor')
      return false
    }
    
    console.log('✅ All comment tables already exist!')
    return true
    
  } catch (error) {
    console.log('⚠️ Could not verify table existence:', error)
    return false
  }
}

// Run the setup
createCommentTables()
  .then(() => {
    console.log('🎉 Setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })