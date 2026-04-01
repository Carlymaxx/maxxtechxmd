import { registerCommand } from "./types";
const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

async function ai(prompt: string): Promise<string> {
  // Primary: eliteprotech chatgpt API
  try {
    const res = await fetch(`https://eliteprotech-apis.zone.id/chatgpt?prompt=${encodeURIComponent(prompt)}`, {
      signal: AbortSignal.timeout(20000),
    });
    const d = await res.json() as any;
    const text = d.response || d.answer || d.text || d.message || "";
    if (text) return text;
  } catch {}
  // Fallback: pollinations text API
  const res = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "openai", seed: Math.floor(Math.random() * 9999) }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error("AI unavailable");
  const text = (await res.text()).trim();
  if (!text) throw new Error("empty");
  return text;
}

// ── Writing & Content ─────────────────────────────────────────────────────────

registerCommand({ name: "essay", aliases: ["writeessay","essayai"], category: "AI", description: "Write an essay on any topic (.essay climate change)", handler: async ({ args, reply }) => { const t = args.join(" "); if (!t) return reply(`❓ .essay <topic>`); try { await reply(await ai(`Write a well-structured 300-word essay about: ${t}. Include introduction, 3 body paragraphs, and conclusion.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "blog", aliases: ["blogpost","writeblog"], category: "AI", description: "Write a blog post (.blog 10 tips for productivity)", handler: async ({ args, reply }) => { const t = args.join(" "); if (!t) return reply(`❓ .blog <topic>`); try { await reply(await ai(`Write a catchy blog post about: ${t}. Include a title, engaging introduction, 5 key points with short explanations, and a call-to-action conclusion.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "haiku", aliases: ["haikupoem","writehaiku"], category: "AI", description: "Generate a haiku poem (.haiku ocean sunset)", handler: async ({ args, reply }) => { const t = args.join(" ") || "nature"; try { await reply(`🎋 *Haiku: ${t}*\n\n` + await ai(`Write a beautiful haiku poem about: ${t}. Follow 5-7-5 syllable structure. Then briefly explain the imagery.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "acrostic", aliases: ["acrosticpoem","namepoem"], category: "AI", description: "Write an acrostic poem from a word (.acrostic MAXX)", handler: async ({ args, reply }) => { const word = args[0]?.toUpperCase(); if (!word) return reply(`❓ .acrostic <word>`); try { await reply(`📝 *Acrostic: ${word}*\n\n` + await ai(`Write an acrostic poem using the word "${word}". Each line should start with each letter of the word and be meaningful.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "limerick", aliases: ["limerickpoem","funpoem"], category: "AI", description: "Write a funny limerick (.limerick a programmer)", handler: async ({ args, reply }) => { const t = args.join(" ") || "a coder"; try { await reply(`😄 *Limerick: ${t}*\n\n` + await ai(`Write a funny 5-line limerick about ${t}. Follow AABBA rhyme scheme. Make it witty!`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "speech", aliases: ["writespeech","publicspeech"], category: "AI", description: "Write a speech on any topic (.speech graduation day)", handler: async ({ args, reply }) => { const t = args.join(" "); if (!t) return reply(`❓ .speech <topic>`); try { await reply(await ai(`Write a compelling 2-minute speech about: ${t}. Include a strong opening hook, 3 main points with transitions, and an inspiring close.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "coverlet", aliases: ["coverletter","jobletter"], category: "AI", description: "Write a job cover letter (.coverlet software engineer at Google)", handler: async ({ args, reply }) => { const t = args.join(" "); if (!t) return reply(`❓ .coverlet <job/company>`); try { await reply(await ai(`Write a professional cover letter for applying as a ${t}. Include strong opening, 2 body paragraphs highlighting skills, and professional closing. Keep it under 250 words.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "resumetips", aliases: ["cvtips","resumehelp"], category: "AI", description: "Get resume tips for a specific role (.resumetips data scientist)", handler: async ({ args, reply }) => { const role = args.join(" ") || "software developer"; try { await reply(`📋 *Resume Tips: ${role}*\n\n` + await ai(`Give 8 specific resume tips for a ${role} role. Include what to highlight, what to avoid, and keywords to include. Be direct and actionable.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "interviewq", aliases: ["interviewquestions","iqprep"], category: "AI", description: "Get interview questions for a job (.interviewq product manager)", handler: async ({ args, reply }) => { const role = args.join(" ") || "software developer"; try { await reply(`🎤 *Interview Questions: ${role}*\n\n` + await ai(`Generate 10 common interview questions for a ${role} position. Include a mix of behavioral, technical, and situational questions. Number them.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "interviewans", aliases: ["answerhow","interviewtip"], category: "AI", description: "Get tips on how to answer an interview question (.interviewans tell me about yourself)", handler: async ({ args, reply }) => { const q = args.join(" "); if (!q) return reply(`❓ .interviewans <question>`); try { await reply(`🎤 *How to Answer:*\n_"${q}"_\n\n` + await ai(`How should I answer this interview question: "${q}"? Give a framework and a sample answer using the STAR method where applicable.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "slogan", aliases: ["brandslogan","tagline2"], category: "AI", description: "Generate brand slogans (.slogan eco-friendly water bottle)", handler: async ({ args, reply }) => { const product = args.join(" "); if (!product) return reply(`❓ .slogan <product>`); try { await reply(`🏷️ *Slogans: ${product}*\n\n` + await ai(`Generate 5 creative and catchy slogans for: ${product}. Make them memorable, emotional, and punchy. Number them.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "adcopy", aliases: ["ad","advertisement"], category: "AI", description: "Write ad copy for a product (.adcopy wireless earbuds)", handler: async ({ args, reply }) => { const product = args.join(" "); if (!product) return reply(`❓ .adcopy <product>`); try { await reply(await ai(`Write persuasive ad copy for: ${product}. Include: attention-grabbing headline, 3 key benefits, social proof statement, and strong call-to-action. Format clearly.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "productdesc", aliases: ["pdesc","proddesc"], category: "AI", description: "Write a product description (.productdesc leather wallet minimalist)", handler: async ({ args, reply }) => { const product = args.join(" "); if (!product) return reply(`❓ .productdesc <product>`); try { await reply(await ai(`Write a compelling product description for: ${product}. Include features, benefits, ideal customer, and a purchase incentive. Keep under 150 words.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "lovemsg", aliases: ["loveletter","romantic"], category: "AI", description: "Write a romantic message (.lovemsg for Sarah who loves sunsets)", handler: async ({ args, reply }) => { const t = args.join(" ") || "someone special"; try { await reply(await ai(`Write a heartfelt, romantic love message for ${t}. Make it poetic, sincere, and touching. Keep it 4-5 sentences.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "apology", aliases: ["sorrytext","apologytext"], category: "AI", description: "Write an apology message (.apology I forgot our anniversary)", handler: async ({ args, reply }) => { const reason = args.join(" ") || "something wrong"; try { await reply(await ai(`Write a sincere apology message for: ${reason}. Include acknowledgment of the mistake, taking responsibility, and a commitment to do better. Keep it genuine.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "thankyoumsg", aliases: ["thankyou2","gratitudmsg"], category: "AI", description: "Write a thank you message (.thankyoumsg for helping me move houses)", handler: async ({ args, reply }) => { const reason = args.join(" ") || "your kindness"; try { await reply(await ai(`Write a warm and genuine thank you message for: ${reason}. Make it personal, specific, and heartfelt. 3-4 sentences.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "wishmsg", aliases: ["birthdaywish","wish"], category: "AI", description: "Write a wish message (.wishmsg happy birthday for John)", handler: async ({ args, reply }) => { const t = args.join(" ") || "a special occasion"; try { await reply(await ai(`Write a warm and creative wish message for: ${t}. Make it unique, joyful, and memorable.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "toast", aliases: ["toastspeech","drinktoast"], category: "AI", description: "Write a toast speech (.toast for Sarah's wedding)", handler: async ({ args, reply }) => { const t = args.join(" ") || "a celebration"; try { await reply(`🥂 *Toast: ${t}*\n\n` + await ai(`Write a short, heartfelt toast speech for: ${t}. Include warmth, a touch of humor, and an inspiring end. Under 100 words.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "complaint", aliases: ["complaintletter","fileletter"], category: "AI", description: "Write a formal complaint letter (.complaint slow internet service)", handler: async ({ args, reply }) => { const t = args.join(" "); if (!t) return reply(`❓ .complaint <issue>`); try { await reply(await ai(`Write a polite but firm formal complaint letter about: ${t}. Include date, clear description of issue, impact, expected resolution, and professional closing.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "bizplan", aliases: ["businessplan","startupplan"], category: "AI", description: "Write a simple business plan (.bizplan food delivery app for students)", handler: async ({ args, reply }) => { const t = args.join(" "); if (!t) return reply(`❓ .bizplan <your business idea>`); try { await reply(await ai(`Write a brief business plan for: ${t}. Include: Executive Summary, Problem & Solution, Target Market, Revenue Model, and Marketing Strategy. Keep concise.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "pun", aliases: ["punsai","makepun"], category: "AI", description: "Generate puns on any topic (.pun cats)", handler: async ({ args, reply }) => { const t = args.join(" ") || "technology"; try { await reply(`😄 *Puns: ${t}*\n\n` + await ai(`Generate 5 clever and funny puns about: ${t}. Number them and make them genuinely witty.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "joke", aliases: ["telljoke","funnyjoke"], category: "Fun", description: "Get a funny joke (.joke programming / .joke random)", handler: async ({ args, reply }) => { const t = args.join(" ") || "life"; try { const res = await fetch("https://icanhazdadjoke.com/", { headers: { Accept: "application/json" } }); const data = await res.json() as any; if (data.joke) return reply(`😂 *Joke*\n\n${data.joke}${FOOTER}`); } catch {} try { await reply(`😂 *Joke: ${t}*\n\n` + await ai(`Tell me one really funny joke about ${t}. Make it clean, clever, and with a good punchline.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "roastbattle", aliases: ["rapbattle","roastlines"], category: "Fun", description: "Generate roast battle lines (.roastbattle for programmers)", handler: async ({ args, reply }) => { const t = args.join(" ") || "someone"; try { await reply(`🔥 *Roast Battle Lines*\n\n` + await ai(`Generate 5 savage but funny roast battle lines about ${t}. Keep them clever and humorous, not offensive.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "funnyquote", aliases: ["fquote","humourquote"], category: "Fun", description: "Get a funny quote about a topic (.funnyquote mondays)", handler: async ({ args, reply }) => { const t = args.join(" ") || "life"; try { await reply(`😂 *Funny Quote: ${t}*\n\n` + await ai(`Give me one genuinely funny and witty quote about: ${t}. Then attribute it to a made-up funny name.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "hotquote", aliases: ["fieryquote","boldquote"], category: "Fun", description: "Get a bold/motivational fire quote", handler: async ({ args, reply }) => { const t = args.join(" ") || "success"; try { await reply(`🔥 *Fire Quote*\n\n` + await ai(`Give me one extremely bold, fierce, and motivational quote about: ${t}. Make it feel powerful and shareable.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "affirmation2", aliases: ["affirm","selfaffirm"], category: "Fun", description: "Get a daily affirmation for a specific theme (.affirmation2 confidence)", handler: async ({ args, reply }) => { const t = args.join(" ") || "self-love"; try { await reply(`✨ *Daily Affirmation: ${t}*\n\n` + await ai(`Write 3 powerful daily affirmations about: ${t}. Each should be in first person (I am, I have, I can) and genuinely uplifting.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "mindset", aliases: ["growthmind","mindshift"], category: "AI", description: "Get a mindset shift message (.mindset imposter syndrome)", handler: async ({ args, reply }) => { const t = args.join(" ") || "self-doubt"; try { await reply(`🧠 *Mindset Shift: ${t}*\n\n` + await ai(`Write a powerful, insightful reframe for someone dealing with: ${t}. Include a new perspective, a practical action, and an encouraging close. Under 150 words.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "lifeadvice", aliases: ["lifetip","advice3"], category: "AI", description: "Get life advice on any situation (.lifeadvice how to handle rejection)", handler: async ({ args, reply }) => { const t = args.join(" ") || "life challenges"; try { await reply(`💡 *Life Advice: ${t}*\n\n` + await ai(`Give thoughtful, practical life advice for: ${t}. Be like a wise mentor — direct, empathetic, and actionable. Under 150 words.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "challenge", aliases: ["weeklychallenge","dailychallenge"], category: "Fun", description: "Get a fun personal growth challenge", handler: async ({ args, reply }) => { const t = args.join(" ") || "productivity"; try { await reply(`💪 *Challenge: ${t}*\n\n` + await ai(`Create a fun 7-day personal challenge focused on: ${t}. List each day with a specific, doable task. Make it exciting and progressive.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "habitplan", aliases: ["habits","buildhabit"], category: "AI", description: "Get a habit-building plan (.habitplan exercise daily)", handler: async ({ args, reply }) => { const habit = args.join(" ") || "reading"; try { await reply(`📅 *Habit Plan: ${habit}*\n\n` + await ai(`Create a practical 30-day habit formation plan for: ${habit}. Include week-by-week progression, obstacles to expect, and tips to stay consistent.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "goalplan", aliases: ["goalsetting","setgoal"], category: "AI", description: "Create a SMART goal plan (.goalplan lose 10kg in 3 months)", handler: async ({ args, reply }) => { const goal = args.join(" "); if (!goal) return reply(`❓ .goalplan <your goal>`); try { await reply(`🎯 *SMART Goal Plan*\n\n` + await ai(`Create a SMART goal plan for: ${goal}. Break it into Specific, Measurable, Achievable, Relevant, Time-bound components. Include 5 concrete action steps.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "productivitytips", aliases: ["protips","worktips"], category: "AI", description: "Get productivity tips for a task (.productivitytips studying for exams)", handler: async ({ args, reply }) => { const task = args.join(" ") || "work"; try { await reply(`⚡ *Productivity Tips: ${task}*\n\n` + await ai(`Give 7 highly actionable productivity tips specifically for: ${task}. Include time management, focus strategies, and energy management.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "scriptwrite", aliases: ["videoscript","youtubescript"], category: "AI", description: "Write a YouTube video script (.scriptwrite 5 habits of successful people)", handler: async ({ args, reply }) => { const topic = args.join(" "); if (!topic) return reply(`❓ .scriptwrite <topic>`); try { await reply(await ai(`Write a compelling 2-minute YouTube script about: ${topic}. Include hook (15s), intro, 3-4 main points with transitions, and outro with CTA. Mark each section.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });

registerCommand({ name: "threadwrite", aliases: ["twitterthread","writethread"], category: "AI", description: "Write a Twitter/X thread (.threadwrite how AI will change the world)", handler: async ({ args, reply }) => { const topic = args.join(" "); if (!topic) return reply(`❓ .threadwrite <topic>`); try { await reply(`🧵 *Thread: ${topic}*\n\n` + await ai(`Write a 8-tweet Twitter/X thread about: ${topic}. Each tweet under 280 chars. Start with a hook tweet, number them 1/8 through 8/8. End with CTA.`) + FOOTER); } catch { await reply(`❌ Failed.${FOOTER}`); } } });
