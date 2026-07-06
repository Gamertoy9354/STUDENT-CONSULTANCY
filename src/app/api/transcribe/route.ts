import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY

  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    return NextResponse.json({ 
      error: 'GROQ_API_KEY not configured',
      text: '[Groq API key not configured - please add GROQ_API_KEY to .env.local]'
    }, { status: 200 })
  }

  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob | null
    const language = formData.get('language') as string || 'en'

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Map language names to codes
    const langCodeMap: Record<string, string> = {
      'English': 'en',
      'Hindi': 'hi',
      'Gujarati': 'gu',
    }
    const langCode = langCodeMap[language] || 'en'

    // Convert blob to file for Groq
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBytes = new Uint8Array(audioBuffer)
    const file = new File([audioBytes], 'recording.webm', { type: 'audio/webm' })

    const groqFormData = new FormData()
    groqFormData.append('file', file)
    groqFormData.append('model', 'whisper-large-v3')
    groqFormData.append('language', langCode)
    groqFormData.append('response_format', 'json')

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Groq API error:', errorData)
      return NextResponse.json({ 
        error: 'Transcription failed',
        text: null
      }, { status: 200 })
    }

    const data = await response.json()
    return NextResponse.json({ text: data.text || '' })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Internal server error', text: null }, { status: 500 })
  }
}
