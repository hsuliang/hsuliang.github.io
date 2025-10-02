{\rtf1\ansi\ansicpg950\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import type \{ VercelRequest, VercelResponse \} from '@vercel/node';\
\
// \uc0\u24037 \u20855 \u65306 \u38627 \u24230 \u8594 \u31186 \u25976 \
function defaultTimeByDifficulty(d?: string) \{\
  if (d === '\uc0\u31777 \u21934 ') return 20;\
  if (d === '\uc0\u22256 \u38627 ') return 45;\
  return 30;\
\}\
\
// \uc0\u24037 \u20855 \u65306 \u27491 \u30906 \u31572 \u26696  \u8594  \u32034 \u24341 \u38499 \u21015 \
function toIndexArray(correctRaw: any, options: string[]) \{\
  const letters = ['A','B','C','D','E','F','G'];\
  const pushUniq = (arr: number[], v: number)=> \{ if(!arr.includes(v)) arr.push(v); \};\
\
  const normalizeOne = (v: any, acc: number[])=>\{\
    if (typeof v === 'number' && Number.isInteger(v)) \{\
      pushUniq(acc, v >= 1 ? v - 1 : v);\
    \} else if (typeof v === 'string') \{\
      const s = v.trim();\
      if (/[,\\uFF0C\\u3001]/.test(s)) \{\
        s.split(/[,\\uFF0C\\u3001]/).map(x=>x.trim()).filter(Boolean).forEach(x => normalizeOne(x, acc));\
      \} else \{\
        const L = letters.indexOf(s.toUpperCase());\
        if (L >= 0) pushUniq(acc, L);\
        else \{\
          const oi = options.findIndex(opt => String(opt).trim() === s);\
          if (oi >= 0) pushUniq(acc, oi);\
          const num = parseInt(s, 10);\
          if (Number.isInteger(num)) pushUniq(acc, num >= 1 ? num - 1 : num);\
        \}\
      \}\
    \}\
  \};\
\
  const out: number[] = [];\
  if (Array.isArray(correctRaw)) correctRaw.forEach(v => normalizeOne(v, out));\
  else normalizeOne(correctRaw, out);\
  return out.filter(i => i >= 0 && i < options.length);\
\}\
\
// \uc0\u27161 \u28310 \u21270 \u21040  MC \u32080 \u27083 \
function normalizeToMC(q: any, difficulty?: string) \{\
  // \uc0\u26159 \u38750 \u38988 \
  if (q && Object.prototype.hasOwnProperty.call(q, 'is_correct')) \{\
    return \{\
      text: q.text ?? q.question ?? q.title ?? q.prompt ?? q.stem ?? '',\
      options: ['\uc0\u26159 ','\u21542 '],\
      correct: [q.is_correct ? 0 : 1],\
      time: Number.isFinite(q.time) ? q.time : defaultTimeByDifficulty(difficulty),\
      explanation: q.explanation || q.reason || ''\
    \};\
  \}\
\
  const text = q?.text ?? q?.question ?? q?.title ?? q?.prompt ?? q?.stem ?? '';\
\
  let options: string[] = [];\
  if (Array.isArray(q?.options)) options = q.options.slice();\
  else if (Array.isArray(q?.choices)) options = q.choices.slice();\
  else if (Array.isArray(q?.answers)) options = q.answers.slice();\
  else if (q?.options && typeof q.options === 'object') options = Object.keys(q.options).sort().map(k => q.options[k]);\
  else if (q?.choices && typeof q.choices === 'object') options = Object.keys(q.choices).sort().map(k => q.choices[k]);\
\
  options = options.filter((v:any)=>v!==undefined && v!==null).map((v:any)=>String(v));\
  while (options.length < 4) options.push('');\
\
  let correct =\
    toIndexArray(q?.correct, options) ||\
    toIndexArray(q?.correct_index, options) ||\
    toIndexArray(q?.correct_indices, options) ||\
    toIndexArray(q?.correctOption, options) ||\
    toIndexArray(q?.correctOptions, options) ||\
    toIndexArray(q?.answer, options) ||\
    toIndexArray(q?.answers, options) ||\
    [];\
  if (correct.length === 0) correct = [0];\
\
  return \{\
    text,\
    options,\
    correct,\
    time: Number.isFinite(q?.time) ? q.time : defaultTimeByDifficulty(difficulty),\
    explanation: q?.explanation || q?.reason || ''\
  \};\
\}\
\
export default async function handler(req: VercelRequest, res: VercelResponse) \{\
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');\
\
  try \{\
    const \{\
      provider, questionType, difficulty,\
      selectedFormat, questionsInBatch, text, images\
    \} = req.body || \{\};\
\
    // \uc0\u22522 \u26412 \u39511 \u35657 \
    if (!provider || !questionsInBatch) \{\
      return res.status(400).json(\{ error: '\uc0\u32570 \u23569 \u24517 \u35201 \u21443 \u25976 \u65306 provider \u25110  questionsInBatch' \});\
    \}\
    if (!text && (!Array.isArray(images) || images.length === 0)) \{\
      return res.status(400).json(\{ error: '\uc0\u35531 \u25552 \u20379 \u25991 \u23383 \u20839 \u23481 \u25110 \u22294 \u29255 ' \});\
    \}\
    if (provider !== 'google' && Array.isArray(images) && images.length > 0) \{\
      return res.status(400).json(\{ error: 'OpenAI \uc0\u30446 \u21069 \u19981 \u25903 \u25588 \u22294 \u29255 \u29702 \u35299 \u65292 \u35531 \u25913 \u29992  Google Gemini \u25110 \u31227 \u38500 \u22294 \u29255 \u12290 ' \});\
    \}\
    if (questionsInBatch > 50) \{\
      return res.status(400).json(\{ error: '\uc0\u21934 \u25209 \u20986 \u38988 \u25976 \u37327 \u19981 \u21487 \u36229 \u36942  50 \u38988 ' \});\
    \}\
\
    // \uc0\u28310 \u20633 \u19978 \u28216 \u35531 \u27714 \
    let apiUrl = '', headers: any = \{\}, payload: any = \{\};\
    const typeText =\
      questionType === 'true_false' ? '\uc0\u12300 \u26159 \u38750 \u38988 \u12301 ' :\
      questionType === 'mixed' ? '\uc0\u12300 \u36984 \u25799 \u38988 \u12301 \u33287 \u12300 \u26159 \u38750 \u38988 \u12301 \u28151 \u21512 \u38988 \u32068 \u65288 \u26159 \u38750 \u38988 \u35531 \u20197  ["\u26159 ","\u21542 "] \u20841 \u36984 \u38917 \u21576 \u29694 \u65289 ' :\
      '\uc0\u12300 \u36984 \u25799 \u38988 \u12301 \u65288 \u27599 \u38988  4 \u20491 \u36984 \u38917 \u65289 ';\
\
    const needsExplanation = (selectedFormat === 'loilonote' || selectedFormat === 'wayground');\
\
    const systemStrict = `\uc0\u20320 \u26159 \u19968 \u20301 \u23560 \u38272 \u36664 \u20986  JSON \u30340 \u21161 \u25163 \u12290 \u35531 \u26681 \u25818 \u20351 \u29992 \u32773 \u25552 \u20379 \u30340 \u20839 \u23481 \u65292 \u29983 \u25104  $\{questionsInBatch\} \u38988  $\{difficulty||'\u20013 \u31561 '\} \u38627 \u24230 \u30340 $\{typeText\}\u12290 \
\uc0\u22238 \u25033 \u35215 \u21063 \u65306 \
1) \uc0\u20677 \u36664 \u20986 \u21934 \u19968  JSON \u29289 \u20214 \u65306 \{"questions":[...]\}\u12290 \
2) \uc0\u19981 \u21487 \u20986 \u29694 \u20219 \u20309 \u21069 \u24460 \u25991 \u12289 \u35498 \u26126 \u12289 \u35387 \u35299 \u25110  Markdown\u12290 \
3) \uc0\u32080 \u27083 \u24517 \u38920 \u31526 \u21512 \u31995 \u32113 \u25351 \u23450 \u30340  response schema\u12290 \
$\{needsExplanation?'4) \uc0\u27599 \u38988 \u38656 \u21253 \u21547  explanation \u35498 \u26126 \u25991 \u23383 \u12290 ':''\}`;\
\
    // schema\
    const jsonItemMC: any = \{\
      type:"OBJECT", properties:\{\
        text:\{type:"STRING"\},\
        options:\{type:"ARRAY",items:\{type:"STRING"\}\},\
        correct:\{type:"ARRAY",items:\{type:"INTEGER"\}\},\
        time:\{type:"INTEGER"\},\
        ...(needsExplanation?\{explanation:\{type:"STRING"\}\}:\{\})\
      \},\
      required:["text","options","correct","time"].concat(needsExplanation?["explanation"]:[])\
    \};\
    const jsonItemTF: any = \{\
      type:"OBJECT", properties:\{\
        text:\{type:"STRING"\},\
        is_correct:\{type:"BOOLEAN"\},\
        ...(needsExplanation?\{explanation:\{type:"STRING"\}\}:\{\})\
      \},\
      required:["text","is_correct"].concat(needsExplanation?["explanation"]:[])\
    \};\
    const itemSchema = (questionType==='true_false') ? jsonItemTF : jsonItemMC;\
    const jsonSchema = \{ type:"OBJECT", properties:\{ questions:\{type:"ARRAY", items:itemSchema\} \}, required:["questions"] \};\
\
    if (provider === 'openai') \{\
      apiUrl = 'https://api.openai.com/v1/chat/completions';\
      if (!process.env.OPENAI_API_KEY) return res.status(500).json(\{ error: '\uc0\u20282 \u26381 \u31471 \u26410 \u35373 \u23450  OPENAI_API_KEY' \});\
\
      headers = \{\
        'Authorization': `Bearer $\{process.env.OPENAI_API_KEY\}`,\
        'Content-Type': 'application/json'\
      \};\
\
      const userParts = [`\uc0\u35531 \u26681 \u25818 \u20197 \u19979 \u25552 \u20379 \u30340 \u25991 \u23383 \u21644 \u22294 \u29255 \u20839 \u23481 \u20986 \u38988 \u12290 `, text ? `\u25991 \u23383 \u20839 \u23481 :\\n$\{text\}` : ''].filter(Boolean).join('\\n\\n');\
\
      payload = \{\
        model: 'gpt-4o',\
        messages: [\
          \{ role:'system', content: `$\{systemStrict\}\\n\uc0\u65288 \u21209 \u24517 \u36664 \u20986 \u21934 \u19968  JSON \u29289 \u20214 \u65289 ` \},\
          \{ role:'user', content: userParts \}\
        ],\
        response_format: \{ type: 'json_object' \}\
      \};\
    \} else \{\
      // google\
      if (!process.env.GEMINI_API_KEY) return res.status(500).json(\{ error: '\uc0\u20282 \u26381 \u31471 \u26410 \u35373 \u23450  GEMINI_API_KEY' \});\
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=$\{process.env.GEMINI_API_KEY\}`;\
      headers = \{ 'Content-Type': 'application/json' \};\
\
      const parts: any[] = [\{ text: "\uc0\u35531 \u26681 \u25818 \u20197 \u19979 \u25552 \u20379 \u30340 \u25991 \u23383 \u21644 \u22294 \u29255 \u20839 \u23481 \u20986 \u38988 \u12290 " \}];\
      if (text) parts.push(\{ text: `\uc0\u25991 \u23383 \u20839 \u23481 :\\n$\{text\}` \});\
      if (Array.isArray(images)) \{\
        images.forEach((img:any)=> parts.push(\{ inlineData: \{ mimeType: img.type, data: img.data \} \}));\
      \}\
\
      payload = \{\
        contents: [\{ parts \}],\
        systemInstruction: \{ parts: [\{ text: systemStrict \}] \},\
        generationConfig: \{ responseMimeType: "application/json", responseSchema: jsonSchema \}\
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
    let rawQuestions: any[] = [];\
\
    if (provider === 'openai') \{\
      const content = result?.choices?.[0]?.message?.content || '\{\}';\
      try \{\
        const obj = JSON.parse(content);\
        rawQuestions = Array.isArray(obj?.questions) ? obj.questions : [];\
      \} catch (e) \{\
        console.error('OpenAI JSON parse error:', e, content);\
      \}\
    \} else \{\
      const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '\{\}';\
      try \{\
        const obj = JSON.parse(jsonText);\
        rawQuestions = Array.isArray(obj?.questions) ? obj.questions : [];\
      \} catch (e) \{\
        console.error('Gemini JSON parse error:', e, jsonText);\
      \}\
    \}\
\
    // \uc0\u27161 \u28310 \u21270 \u65292 \u36991 \u20813 \u38988 \u24185 \u31354 \u30333 \
    const normalized = rawQuestions.map(q => normalizeToMC(q, difficulty));\
\
    return res.status(200).json(\{ questions: normalized \});\
  \} catch (e: any) \{\
    console.error('generate-questions error:', e);\
    return res.status(500).json(\{ error: '\uc0\u29983 \u25104 \u22833 \u25943 \u65292 \u35531 \u31245 \u24460 \u20877 \u35430 \u12290 ' \});\
  \}\
\}\
}