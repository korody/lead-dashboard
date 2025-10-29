// Test Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://etbodugymxmrmbqfjigz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0Ym9kdWd5bXhtcm1icWZqaWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTI4NzMsImV4cCI6MjA3NjU2ODg3M30.rXHsTPfZ8BwM_jEt_ERp7QVfBlYWgU8sFSbMvhWURAY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test connection and get count
    const { count, error } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    console.log('Connection successful!')
    console.log('Total leads count:', count)
    
    // Get some sample data
    const { data, error: dataError } = await supabase
      .from('quiz_leads')
      .select('id, lead_score, is_hot_lead_vip, prioridade, elemento_principal, whatsapp_status')
      .limit(5)
    
    if (dataError) {
      console.error('Data error:', dataError)
      return
    }
    
    console.log('Sample data:', data)
    
  } catch (err) {
    console.error('Connection failed:', err)
  }
}

testConnection()