// Test full lead data
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://etbodugymxmrmbqfjigz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0Ym9kdWd5bXhtcm1icWZqaWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTI4NzMsImV4cCI6MjA3NjU2ODg3M30.rXHsTPfZ8BwM_jEt_ERp7QVfBlYWgU8sFSbMvhWURAY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFullLead() {
  try {
    // Get ONE complete lead with ALL fields
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    console.log('=== FULL LEAD DATA ===')
    console.log(JSON.stringify(data, null, 2))
    console.log('\n=== AVAILABLE FIELDS ===')
    console.log(Object.keys(data).sort().join(', '))
    
  } catch (err) {
    console.error('Failed:', err)
  }
}

testFullLead()
