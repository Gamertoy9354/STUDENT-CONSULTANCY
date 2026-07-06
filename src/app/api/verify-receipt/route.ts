import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions"

export async function POST(req: Request) {
  try {
    const { receiptDataUrl } = await req.json()

    if (!receiptDataUrl) {
      return NextResponse.json({ error: 'No receipt provided.' }, { status: 400 })
    }

    // Load reference PDF if possible, but vision models handle comparing visual forms better when they are directly guided.
    // LLaMa vision will assess if the uploaded image has a signature.
    // We send base64 data URL.

    const contentArray: any[] = [
      {
        "type": "text", 
        "text": "Analyze the attached admission fee receipt. \nCRITICAL: Check if there is a visible handwritten signature on the document (e.g. near the bottom for Accountant Signature).\nIf you clearly see a handwritten signature, you MUST reply with exactly the word PASSED. If there is no handwritten signature, reply with FAILED." 
      },
      {
        "type": "image_url",
        "image_url": { "url": receiptDataUrl }
      }
    ]

    const payload = {
      "model": "meta/llama-3.2-11b-vision-instruct",
      "messages": [
        {
          "role": "user",
          "content": contentArray
        }
      ],
      "max_tokens": 512,
      "temperature": 0.1,
      "top_p": 1.00,
      "stream": false
    }

    const headers = {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    }

    const response = await fetch(invokeUrl, { 
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: `NVIDIA API Error [${response.status}]: ${JSON.stringify(data)}` 
      })
    }

    const text = data?.choices?.[0]?.message?.content || ''
    console.log("NVIDIA NIM Response:", text)

    if (text.includes('PASSED')) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ 
        error: `AI Response: "${text}"` 
      })
    }

  } catch (err: any) {
    console.error('Verification Error:', err?.response?.data || err.message)
    return NextResponse.json({ error: 'NVIDIA AI API failure: Could not verify receipt. ' + (err?.response?.data?.detail || '') }, { status: 500 })
  }
}
