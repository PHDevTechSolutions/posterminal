// Simple test to check backup API
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('=== SIMPLE BACKUP TEST ===');
    
    const body = await request.text();
    console.log('Raw body received:', body);
    console.log('Body type:', typeof body);
    console.log('Body length:', body.length);
    
    // Try to parse as JSON
    let parsed;
    try {
      parsed = JSON.parse(body);
      console.log('✅ JSON parsed successfully:', parsed);
    } catch (error) {
      console.error('❌ JSON parse failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON',
        received: body
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test successful',
      received: body,
      parsed: parsed
    });
    
  } catch (error: any) {
    console.error('❌ Request processing failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    });
  }
}
