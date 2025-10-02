{\rtf1\ansi\ansicpg950\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import type \{ VercelRequest, VercelResponse \} from '@vercel/node';\
\
export default async function handler(req: VercelRequest, res: VercelResponse) \{\
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');\
\
  try \{\
    const \{ provider, topic, studentLevel \} = req.body || \{\};\
    if (!provider || !topic) return res.status(400).json(\{ error: '\uc0\u32570 \u23569 \u24517 \u35201 \u21443 \u25976 \u65306 provider \u25110  topic' \});\
\
    const sys = `\uc0\u20320 \u26159 \u19968 \u20301 \u25945 \u26448 \u32232 \u23531 \u23560 \u23478 \u12290 \u35531 \u26681 \u25818 \u20027 \u38988 \u65292 \u28858 \u12300 $\{studentLevel||'K12'\}\u12301 \u23416 \u29983 \u29983 \u25104 \u19968 \u27573 \u21512 \u36969 \u30340 \u23416 \u32722 \u30701 \u25991 \u12290 \u20677 \u36664 \u20986 \u25991 \u31456 \u26412 \u36523 \u65292 \u19981 \u35201 \u38989 \u22806 \u35498 \u26126 \u12290 `;\
\
    let apiUrl = '', headers: any = \{\}, payload: any = \{\};\
\
    if (provider === 'openai') \{\
      if (!process.env.OPENAI_API_KEY) return res.status(500).json(\{ error: '\uc0\u20282 \u26381 \u31471 \u26410 \u35373 \u23450  OPENAI_API_KEY' \});\
      apiUrl = 'https://api.openai.com/v1/chat/completions';\
      headers = \{\
        'Authorization': `Bearer $\{process.env.OPENAI_API_KEY\}`,\
        'Content-Type': 'application/json'\
      \};\
      payload = \{\
        model: 'gpt-4o',\
        messages: [\
          \{ role: 'system', content: sys \},\
          \{ role: 'user', content: `\uc0\u20027 \u38988 /\u21934 \u23383 \u65306 $\{topic\}` \}\
        ]\
      \};\
    \} else \{\
      if (!process.env.GEMINI_API_KEY) return res.status(500).json(\{ error: '\uc0\u20282 \u26381 \u31471 \u26410 \u35373 \u23450  GEMINI_API_KEY' \});\
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=$\{process.env.GEMINI_API_KEY\}`;\
      headers = \{ 'Content-Type': 'application/json' \};\
      payload = \{\
        contents: [\{ parts: [\{ text: `\uc0\u20027 \u38988 /\u21934 \u23383 \u65306 $\{topic\}` \}] \}],\
        systemInstruction: \{ parts: [\{ text: sys \}] \}\
      \};\
    \}\
\
    const upstream = await fetch(apiUrl, \{ method: 'POST', headers, body: JSON.stringify(payload) \});\
    if (!upstream.ok) \{\
      const msg = `\uc0\u19978 \u28216 \u26381 \u21209 \u37679 \u35492 \u65288 $\{upstream.status\}\u65289 `;\
      console.error(msg, await upstream.text());\
      return res.status(502).json(\{ error: 'AI \uc0\u29983 \u25104 \u22833 \u25943 \u65292 \u35531 \u31245 \u24460 \u20877 \u35430 \u12290 ' \});\
    \}\
\
    const result = await upstream.json();\
    let textOut = '';\
\
    if (provider === 'openai') \{\
      textOut = result?.choices?.[0]?.message?.content || '';\
    \} else \{\
      textOut = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';\
    \}\
\
    return res.status(200).json(\{ text: textOut \});\
  \} catch (e: any) \{\
    console.error('generate-content error:', e);\
    return res.status(500).json(\{ error: '\uc0\u29983 \u25104 \u22833 \u25943 \u65292 \u35531 \u31245 \u24460 \u20877 \u35430 \u12290 ' \});\
  \}\
\}\
}