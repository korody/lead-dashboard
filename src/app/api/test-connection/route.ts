import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // First, let's see what tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names')
      .single()
    
    console.log('Tables error:', tablesError)
    console.log('Available tables:', tables)
    
    // Test basic connection
    const { count, error } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Quiz_leads error:', error)
      
      // Try a different approach - list all tables
      const { data, error: listError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      return NextResponse.json({
        success: false,
        error: error.message,
        listError: listError?.message,
        availableTables: data
      })
    }
    
    console.log('Connection successful! Count:', count)
    
    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('quiz_leads')
      .select('id, lead_score, is_hot_lead_vip, prioridade, elemento_principal, whatsapp_status')
      .limit(3)
    
    if (sampleError) {
      console.error('Sample data error:', sampleError)
    }
    
    return NextResponse.json({
      success: true,
      totalCount: count,
      sampleData: sampleData || [],
      sampleError: sampleError?.message
    })
    
  } catch (err: any) {
    console.error('Connection test failed:', err)
    return NextResponse.json({
      success: false,
      error: err?.message || 'Unknown error'
    })
  }
}