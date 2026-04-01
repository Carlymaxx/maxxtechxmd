import { registerCommand } from "./types.js";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ─── Horoscope ───────────────────────────────────────────────────────────────
const horoscopeData: Record<string, { dates: string; traits: string[]; lucky: string; color: string; stone: string }> = {
  aries: { dates: "Mar 21 – Apr 19", traits: ["Courageous", "Energetic", "Confident"], lucky: "7", color: "Red", stone: "Diamond" },
  taurus: { dates: "Apr 20 – May 20", traits: ["Reliable", "Patient", "Devoted"], lucky: "6", color: "Green", stone: "Emerald" },
  gemini: { dates: "May 21 – Jun 20", traits: ["Adaptable", "Curious", "Witty"], lucky: "5", color: "Yellow", stone: "Pearl" },
  cancer: { dates: "Jun 21 – Jul 22", traits: ["Intuitive", "Loyal", "Caring"], lucky: "2", color: "White", stone: "Ruby" },
  leo: { dates: "Jul 23 – Aug 22", traits: ["Creative", "Passionate", "Generous"], lucky: "1", color: "Gold", stone: "Peridot" },
  virgo: { dates: "Aug 23 – Sep 22", traits: ["Analytical", "Practical", "Kind"], lucky: "3", color: "Brown", stone: "Sapphire" },
  libra: { dates: "Sep 23 – Oct 22", traits: ["Cooperative", "Diplomatic", "Fair"], lucky: "4", color: "Pink", stone: "Opal" },
  scorpio: { dates: "Oct 23 – Nov 21", traits: ["Brave", "Determined", "Resourceful"], lucky: "9", color: "Black", stone: "Topaz" },
  sagittarius: { dates: "Nov 22 – Dec 21", traits: ["Generous", "Idealistic", "Adventurous"], lucky: "3", color: "Purple", stone: "Turquoise" },
  capricorn: { dates: "Dec 22 – Jan 19", traits: ["Disciplined", "Responsible", "Self-control"], lucky: "8", color: "Brown", stone: "Garnet" },
  aquarius: { dates: "Jan 20 – Feb 18", traits: ["Progressive", "Original", "Independent"], lucky: "4", color: "Blue", stone: "Amethyst" },
  pisces: { dates: "Feb 19 – Mar 20", traits: ["Compassionate", "Artistic", "Intuitive"], lucky: "7", color: "Sea Green", stone: "Aquamarine" },
};

registerCommand({
  name: "horoscope",
  aliases: ["zodiac", "stars"],
  category: "Lifestyle",
  description: "Get daily horoscope for your star sign",
  usage: ".horoscope aries",
  handler: async ({ reply, args }) => {
    const sign = args[0]?.toLowerCase();
    if (!sign || !horoscopeData[sign]) {
      return reply(`♓ *Horoscope Signs*\n\n${Object.keys(horoscopeData).map(s => `• *${s.charAt(0).toUpperCase() + s.slice(1)}* — ${horoscopeData[s].dates}`).join("\n")}\n\nUsage: \`.horoscope aries\`` + FOOTER);
    }
    const h = horoscopeData[sign];
    const moods = ["✨ The stars align in your favor today!", "🌟 A day of new opportunities awaits!", "💫 Trust your instincts — they won't lead you astray.", "⭐ Focus on what truly matters to you today.", "🌙 Take time for reflection and self-care today.", "☀️ Your energy is magnetic today — use it wisely!"];
    const advice = ["Focus on clear communication.", "Trust the process, not just the outcome.", "Take a step back before making decisions.", "Show gratitude to those around you.", "New connections could bring great opportunities.", "Balance work and play for best results."];
    return reply(`♈ *${sign.charAt(0).toUpperCase() + sign.slice(1)} Horoscope*\n📅 ${h.dates}\n\n${moods[Math.floor(Math.random() * moods.length)]}\n\n💡 *Advice:* ${advice[Math.floor(Math.random() * advice.length)]}\n\n🔮 *Lucky Number:* ${h.lucky}\n🎨 *Lucky Color:* ${h.color}\n💎 *Lucky Stone:* ${h.stone}\n\n✨ *Traits:* ${h.traits.join(", ")}` + FOOTER);
  }
});

registerCommand({
  name: "compatibility",
  aliases: ["lovematch", "signmatch"],
  category: "Lifestyle",
  description: "Check zodiac compatibility between two signs",
  usage: ".compatibility aries scorpio",
  handler: async ({ reply, args }) => {
    const sign1 = args[0]?.toLowerCase();
    const sign2 = args[1]?.toLowerCase();
    if (!sign1 || !sign2 || !horoscopeData[sign1] || !horoscopeData[sign2])
      return reply("Usage: `.compatibility aries scorpio`" + FOOTER);
    const score = Math.floor(Math.random() * 40) + 60;
    const level = score > 85 ? "💯 Excellent Match!" : score > 75 ? "💚 Great Compatibility!" : score > 65 ? "💛 Good Compatibility" : "💙 Average Match";
    const aspects = ["Emotional connection", "Communication style", "Shared values", "Lifestyle compatibility", "Romantic chemistry"];
    return reply(`💞 *Zodiac Compatibility*\n\n♈ ${sign1.toUpperCase()} × ${sign2.toUpperCase()} ♈\n\n📊 Score: *${score}%*\n${level}\n\n${aspects.map(a => `• ${a}: ${"⭐".repeat(Math.ceil(Math.random() * 2) + 3)}`).join("\n")}` + FOOTER);
  }
});

// ─── Health & Fitness ────────────────────────────────────────────────────────
registerCommand({
  name: "bmi",
  category: "Lifestyle",
  description: "Calculate your Body Mass Index (BMI)",
  usage: ".bmi 70 175",
  handler: async ({ reply, args }) => {
    const weight = parseFloat(args[0]);
    const height = parseFloat(args[1]);
    if (isNaN(weight) || isNaN(height) || height < 1)
      return reply("Usage: `.bmi <weight_kg> <height_cm>`\nExample: `.bmi 70 175`" + FOOTER);
    const bmi = weight / ((height / 100) ** 2);
    let category = "", emoji = "";
    if (bmi < 18.5) { category = "Underweight"; emoji = "⬇️"; }
    else if (bmi < 25) { category = "Normal weight"; emoji = "✅"; }
    else if (bmi < 30) { category = "Overweight"; emoji = "⚠️"; }
    else { category = "Obese"; emoji = "🔴"; }
    return reply(`⚖️ *BMI Calculator*\n\n👤 Weight: ${weight} kg\n📏 Height: ${height} cm\n\n📊 *BMI: ${bmi.toFixed(1)}*\n${emoji} Category: *${category}*\n\n📋 BMI Chart:\n• < 18.5 = Underweight\n• 18.5–24.9 = Normal ✅\n• 25–29.9 = Overweight\n• ≥ 30 = Obese` + FOOTER);
  }
});

registerCommand({
  name: "calories",
  aliases: ["bmr", "caloriecount"],
  category: "Lifestyle",
  description: "Estimate daily calorie needs based on weight, height and age",
  usage: ".calories 70 175 25 male",
  handler: async ({ reply, args }) => {
    const weight = parseFloat(args[0]);
    const height = parseFloat(args[1]);
    const ageVal = parseInt(args[2]);
    const gender = args[3]?.toLowerCase();
    if (isNaN(weight) || isNaN(height) || isNaN(ageVal) || !gender)
      return reply("Usage: `.calories <weight_kg> <height_cm> <age> <male/female>`" + FOOTER);
    const bmr = gender === "female"
      ? 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * ageVal)
      : 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * ageVal);
    return reply(`🔥 *Daily Calorie Calculator*\n\n📊 Basal Metabolic Rate: *${Math.round(bmr)} kcal/day*\n\n🏃 Activity Levels:\n• Sedentary: *${Math.round(bmr * 1.2)}* kcal\n• Light exercise (1–3 days/wk): *${Math.round(bmr * 1.375)}* kcal\n• Moderate (3–5 days/wk): *${Math.round(bmr * 1.55)}* kcal\n• Heavy (6–7 days/wk): *${Math.round(bmr * 1.725)}* kcal\n• Athlete (2× training): *${Math.round(bmr * 1.9)}* kcal` + FOOTER);
  }
});

registerCommand({
  name: "workout",
  aliases: ["exercise", "gym"],
  category: "Lifestyle",
  description: "Get a quick workout plan (upper/lower/core/cardio/full)",
  usage: ".workout upper",
  handler: async ({ reply, args }) => {
    const type = args[0]?.toLowerCase() || "full";
    const workouts: Record<string, string[]> = {
      upper: ["💪 Push-ups — 3×15", "🏋️ Dumbbell rows — 3×12", "🤸 Shoulder press — 3×10", "💪 Bicep curls — 3×15", "🔄 Tricep dips — 3×12"],
      lower: ["🦵 Squats — 3×20", "🏃 Lunges — 3×15 each", "🦵 Calf raises — 3×25", "🏋️ Deadlifts — 3×12", "🦵 Glute bridges — 3×20"],
      core: ["🔥 Plank — 3×60s", "🔄 Russian twists — 3×20", "🏃 Mountain climbers — 3×30", "💫 Bicycle crunches — 3×20", "⬆️ Leg raises — 3×15"],
      cardio: ["🏃 Jumping jacks — 3×30", "⚡ Burpees — 3×10", "🔄 High knees — 3×30s", "💫 Jump rope — 3×60s", "🏃 Sprint intervals — 5×30s"],
      full: ["💪 Push-ups — 3×15", "🦵 Squats — 3×20", "🔥 Plank — 3×45s", "🏋️ Rows — 3×12", "🏃 Mountain climbers — 3×20"],
    };
    const plan = workouts[type] || workouts.full;
    return reply(`🏋️ *Workout Plan — ${type.toUpperCase()}*\n\n${plan.join("\n")}\n\n⏱️ Rest 60–90s between sets\n💧 Stay hydrated!\n🔥 Warm up 5 mins first` + FOOTER);
  }
});

registerCommand({
  name: "diet",
  aliases: ["mealplan", "dietplan"],
  category: "Lifestyle",
  description: "Get diet tips for weightloss, muscle, or balanced eating",
  usage: ".diet weightloss",
  handler: async ({ reply, args }) => {
    const goal = args[0]?.toLowerCase() || "balanced";
    const plans: Record<string, { title: string; tips: string[] }> = {
      weightloss: { title: "🔥 Weight Loss Diet", tips: ["✅ 500 calorie daily deficit", "🥗 High protein (1.6g/kg body weight)", "🥦 50% of plate = vegetables", "❌ Avoid processed sugars", "💧 3L water daily", "🍳 Eat 5 small meals instead of 3 large"] },
      muscle: { title: "💪 Muscle Building Diet", tips: ["✅ Calorie surplus of 300–500 kcal", "🥩 High protein (2g/kg body weight)", "🍚 Complex carbs post-workout", "🥚 Eat 5–6 meals per day", "🧈 Healthy fats (avocado, nuts)", "🥛 Whey protein post-workout"] },
      balanced: { title: "⚖️ Balanced Diet", tips: ["✅ 50% carbs, 30% protein, 20% fat", "🥗 5 servings of fruits & veggies daily", "🌾 Whole grains over refined", "💧 8 glasses of water daily", "🐟 Fish twice per week", "🌰 Nuts & seeds as snacks"] },
    };
    const plan = plans[goal] || plans.balanced;
    return reply(`🥗 *${plan.title}*\n\n${plan.tips.join("\n")}` + FOOTER);
  }
});

registerCommand({
  name: "waterreminder",
  aliases: ["water", "h2o"],
  category: "Lifestyle",
  description: "Calculate your daily water intake goal",
  usage: ".waterreminder 70",
  handler: async ({ reply, args }) => {
    const weight = parseFloat(args[0]);
    if (isNaN(weight)) return reply("Usage: `.waterreminder <weight_kg>`\nExample: `.waterreminder 70`" + FOOTER);
    const liters = (weight * 0.033).toFixed(1);
    const glasses = Math.round(parseFloat(liters) / 0.25);
    return reply(`💧 *Daily Water Intake*\n\n👤 Weight: ${weight} kg\n\n🎯 Goal: *${liters} liters/day*\n🥤 That's about *${glasses} glasses* of water\n\n⏰ Suggested Schedule:\n• 7am — 1 glass\n• 9am — 1 glass\n• 11am — 1 glass\n• 1pm — 1 glass (lunch)\n• 3pm — 1 glass\n• 5pm — 1 glass\n• 7pm — 1 glass (dinner)\n• 9pm — 1 glass\n\n💡 Cold water can boost your metabolism!` + FOOTER);
  }
});

// ─── Finance ─────────────────────────────────────────────────────────────────
registerCommand({
  name: "currency",
  aliases: ["convert", "fx"],
  category: "Lifestyle",
  description: "Convert between currencies using live rates",
  usage: ".currency 100 USD NGN",
  handler: async ({ reply, args }) => {
    const amount = parseFloat(args[0]);
    const fromCur = args[1]?.toUpperCase();
    const toCur = args[2]?.toUpperCase();
    if (isNaN(amount) || !fromCur || !toCur)
      return reply("Usage: `.currency <amount> <from> <to>`\nExample: `.currency 100 USD NGN`" + FOOTER);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${fromCur}`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json() as any;
      if (!data.rates?.[toCur]) return reply(`❌ Currency *${toCur}* not found. Use 3-letter codes: USD, EUR, GBP, NGN, GHS, KES, ZAR` + FOOTER);
      const rate = data.rates[toCur];
      const converted = (amount * rate).toFixed(2);
      return reply(`💱 *Currency Conversion*\n\n💵 ${amount} ${fromCur}\n↓\n💰 *${converted} ${toCur}*\n\n📊 Rate: 1 ${fromCur} = ${rate.toFixed(4)} ${toCur}\n🕐 Updated: ${new Date(data.time_last_update_utc).toDateString()}` + FOOTER);
    } catch {
      return reply("❌ Could not fetch exchange rates. Try again later." + FOOTER);
    }
  }
});

registerCommand({
  name: "loan",
  aliases: ["emi", "mortgage"],
  category: "Lifestyle",
  description: "Calculate monthly loan EMI and total interest",
  usage: ".loan 500000 10 5",
  handler: async ({ reply, args }) => {
    const principal = parseFloat(args[0]);
    const annualRate = parseFloat(args[1]);
    const years = parseFloat(args[2]);
    if (isNaN(principal) || isNaN(annualRate) || isNaN(years))
      return reply("Usage: `.loan <amount> <annual_rate_%> <years>`\nExample: `.loan 500000 10 5`" + FOOTER);
    const rate = annualRate / 100 / 12;
    const months = years * 12;
    const emi = principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
    const total = emi * months;
    const interest = total - principal;
    return reply(`💰 *Loan Calculator*\n\n🏦 Principal: ${principal.toLocaleString()}\n📊 Interest Rate: ${annualRate}% per year\n📅 Duration: ${years} years (${months} months)\n\n💳 Monthly EMI: *${emi.toFixed(2)}*\n💵 Total Payable: *${total.toFixed(2)}*\n📈 Total Interest: *${interest.toFixed(2)}*` + FOOTER);
  }
});

registerCommand({
  name: "tip",
  aliases: ["tipcalculator", "splittip"],
  category: "Lifestyle",
  description: "Calculate restaurant tip and split the bill",
  usage: ".tip 5000 15 4",
  handler: async ({ reply, args }) => {
    const bill = parseFloat(args[0]);
    const tipPct = parseFloat(args[1]) || 15;
    const people = parseInt(args[2]) || 1;
    if (isNaN(bill)) return reply("Usage: `.tip <bill_amount> [tip_%] [num_people]`\nExample: `.tip 5000 15 4`" + FOOTER);
    const tipAmount = bill * tipPct / 100;
    const total = bill + tipAmount;
    return reply(`🍽️ *Tip Calculator*\n\n💰 Bill: ${bill.toLocaleString()}\n💯 Tip: ${tipPct}% = ${tipAmount.toFixed(2)}\n\n💵 Total: *${total.toFixed(2)}*\n👥 Per Person (${people}): *${(total / people).toFixed(2)}*` + FOOTER);
  }
});

// ─── Food & Recipes ───────────────────────────────────────────────────────────
registerCommand({
  name: "recipe",
  aliases: ["cook", "cookidea"],
  category: "Lifestyle",
  description: "Find a recipe by ingredient or meal name",
  usage: ".recipe chicken",
  handler: async ({ reply, args }) => {
    const ingredient = args.join(" ") || "chicken";
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(ingredient)}`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json() as any;
      const meals = data.meals;
      if (!meals || meals.length === 0) return reply(`❌ No recipes found for *${ingredient}*. Try another ingredient!` + FOOTER);
      const meal = meals[Math.floor(Math.random() * meals.length)];
      const ingredients: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const meas = meal[`strMeasure${i}`];
        if (ing && ing.trim()) ingredients.push(`• ${meas?.trim() || ""} ${ing}`.trim());
      }
      const instructions = meal.strInstructions?.slice(0, 400) || "No instructions available.";
      return reply(`🍽️ *${meal.strMeal}*\n🌍 ${meal.strArea} | 📂 ${meal.strCategory}\n\n🛒 *Ingredients (${ingredients.length}):*\n${ingredients.slice(0, 8).join("\n")}${ingredients.length > 8 ? "\n...and more" : ""}\n\n📝 *Instructions:*\n${instructions}...` + FOOTER);
    } catch {
      return reply("❌ Could not fetch recipe. Try again later." + FOOTER);
    }
  }
});

registerCommand({
  name: "meal",
  aliases: ["randommeal", "foodidea"],
  category: "Lifestyle",
  description: "Get a random meal idea for today",
  usage: ".meal",
  handler: async ({ reply }) => {
    try {
      const res = await fetch("https://www.themealdb.com/api/json/v1/1/random.php", { signal: AbortSignal.timeout(8000) });
      const data = await res.json() as any;
      const mealData = data.meals?.[0];
      if (!mealData) throw new Error("no meal");
      return reply(`🍳 *Random Meal Idea*\n\n🍽️ *${mealData.strMeal}*\n🌍 Cuisine: ${mealData.strArea}\n📂 Category: ${mealData.strCategory}\n\n📝 ${mealData.strInstructions?.slice(0, 250)}...\n\n🎥 Video: ${mealData.strYoutube || "Not available"}` + FOOTER);
    } catch {
      const meals = ["Jollof Rice 🍚", "Fried Chicken 🍗", "Pasta Carbonara 🍝", "Beef Stew 🥩", "Veggie Stir-fry 🥦", "Grilled Salmon 🐟", "Chicken Curry 🍛", "Pizza Margherita 🍕"];
      return reply(`🍳 *Today's Meal Idea*\n\n🍽️ Try making: *${meals[Math.floor(Math.random() * meals.length)]}*\n\n💡 For a full recipe, type: \`.recipe chicken\`` + FOOTER);
    }
  }
});

// ─── Travel & Time ────────────────────────────────────────────────────────────
registerCommand({
  name: "worldclock",
  aliases: ["citytime", "localtime", "tzlookup"],
  category: "Lifestyle",
  description: "Get current time in any major city around the world",
  usage: ".timezone London",
  handler: async ({ reply, args }) => {
    const place = args.join(" ");
    if (!place) return reply("Usage: `.timezone <city>`\nExample: `.timezone London`" + FOOTER);
    const zones: Record<string, string> = {
      london: "Europe/London", "new york": "America/New_York", "los angeles": "America/Los_Angeles",
      tokyo: "Asia/Tokyo", dubai: "Asia/Dubai", paris: "Europe/Paris", sydney: "Australia/Sydney",
      berlin: "Europe/Berlin", lagos: "Africa/Lagos", nairobi: "Africa/Nairobi", cairo: "Africa/Cairo",
      moscow: "Europe/Moscow", beijing: "Asia/Shanghai", mumbai: "Asia/Kolkata", singapore: "Asia/Singapore",
      toronto: "America/Toronto", chicago: "America/Chicago", miami: "America/New_York",
      accra: "Africa/Accra", abuja: "Africa/Lagos", johannesburg: "Africa/Johannesburg",
      amsterdam: "Europe/Amsterdam", madrid: "Europe/Madrid", rome: "Europe/Rome",
    };
    const tz = zones[place.toLowerCase()];
    if (!tz) return reply(`❌ City *${place}* not found.\nAvailable: ${Object.keys(zones).join(", ")}` + FOOTER);
    const time = new Date().toLocaleString("en-US", { timeZone: tz, weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return reply(`🌍 *Time in ${place.charAt(0).toUpperCase() + place.slice(1)}*\n\n🕐 ${time}\n\n📍 Timezone: ${tz}` + FOOTER);
  }
});

registerCommand({
  name: "travel",
  aliases: ["travelguide", "visitinfo"],
  category: "Lifestyle",
  description: "Get travel info and tips for any country",
  usage: ".travel Japan",
  handler: async ({ reply, args }) => {
    const country = args.join(" ");
    if (!country) return reply("Usage: `.travel <country>`" + FOOTER);
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}`, { signal: AbortSignal.timeout(6000) });
      const data = await res.json() as any[];
      const c = data[0];
      const currency = Object.values(c.currencies as any)[0] as any;
      const lang = Object.values(c.languages as any)[0];
      const tips = ["📸 Visit local markets for authentic experiences", "🚌 Use public transport to save money", "🗣️ Learn a few local phrases", "💳 Always carry some local cash"];
      return reply(`✈️ *Travel Guide: ${c.name.common}*\n\n🏛️ Capital: ${c.capital?.[0]}\n🌍 Region: ${c.region}\n👥 Population: ${(c.population as number)?.toLocaleString()}\n💱 Currency: ${currency?.name} (${currency?.symbol})\n🗣️ Language: ${lang}\n\n💡 *Travel Tips:*\n${tips.join("\n")}` + FOOTER);
    } catch {
      return reply(`❌ Travel info for *${country}* not found. Check the spelling!` + FOOTER);
    }
  }
});

// ─── Productivity ──────────────────────────────────────────────────────────────
registerCommand({
  name: "todo",
  aliases: ["todolist", "tasks"],
  category: "Lifestyle",
  description: "Create a formatted daily to-do list",
  usage: ".todo Buy groceries|Call doctor|Exercise",
  handler: async ({ reply, args }) => {
    const text = args.join(" ");
    if (!text) return reply("Usage: `.todo task1|task2|task3`\nExample: `.todo Buy groceries|Call doctor|Exercise`" + FOOTER);
    const taskList = text.split("|").map((t, i) => `${i + 1}. ☐ ${t.trim()}`);
    const today = new Date().toDateString();
    return reply(`📋 *To-Do List*\n📅 ${today}\n\n${taskList.join("\n")}\n\n✅ Stay focused and productive! 💪` + FOOTER);
  }
});

registerCommand({
  name: "habit",
  aliases: ["habitplan", "30day"],
  category: "Lifestyle",
  description: "Get a 30-day habit building plan",
  usage: ".habit exercise",
  handler: async ({ reply, args }) => {
    const habit = args.join(" ") || "your new habit";
    const weeks = [
      `Week 1 (Days 1–7): Start small — just 5 minutes of ${habit} daily. Build the trigger.`,
      `Week 2 (Days 8–14): Increase to 10–15 minutes. Track your streak every day.`,
      `Week 3 (Days 15–21): Push to 20–30 minutes. Pair it with an existing routine.`,
      `Week 4 (Days 22–30): Full commitment — make it non-negotiable!`,
    ];
    return reply(`🎯 *30-Day Habit Plan: ${habit}*\n\n${weeks.join("\n\n")}\n\n💡 *Tips:*\n• Set a daily reminder at the same time\n• Reward yourself each week ✅\n• Don't break the chain!\n• Tell a friend for accountability` + FOOTER);
  }
});

registerCommand({
  name: "study",
  aliases: ["pomodoro", "studyplan"],
  category: "Lifestyle",
  description: "Generate a Pomodoro study schedule",
  usage: ".study 4",
  handler: async ({ reply, args }) => {
    const sessions = parseInt(args[0]) || 4;
    const schedule = Array.from({ length: sessions }, (_, i) =>
      `🍅 Session ${i + 1}: Study 25 min → Break ${i % 4 === 3 ? "15–20 min 🌿 (long break)" : "5 min ☕"}`
    );
    return reply(`📚 *Pomodoro Study Schedule (${sessions} sessions)*\n\n${schedule.join("\n")}\n\n⏱️ Total study time: ${sessions * 25} minutes\n\n💡 *Study Tips:*\n• One task per session\n• No distractions\n• Review notes after each break\n• Drink water! 💧` + FOOTER);
  }
});

registerCommand({
  name: "sleep",
  aliases: ["sleeptime", "bedtime"],
  category: "Lifestyle",
  description: "Calculate best sleep or wake up times",
  usage: ".sleep 6:30am",
  handler: async ({ reply, args }) => {
    if (!args[0]) {
      const now = new Date();
      const cycles = [5, 6, 7].map(c => {
        const wake = new Date(now.getTime() + c * 90 * 60000 + 14 * 60000);
        return `• ${c} cycles (${c * 1.5}hrs): Wake at *${wake.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}*`;
      });
      return reply(`💤 *Sleep Calculator*\n🛌 If you sleep NOW:\n\n${cycles.join("\n")}\n\n💡 Each cycle = 90 min + 14 min to fall asleep` + FOOTER);
    }
    const wakeTime = args[0].toLowerCase();
    const matchResult = wakeTime.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/i);
    if (!matchResult) return reply("Usage: `.sleep 6:30am` or `.sleep` for current time" + FOOTER);
    let hour = parseInt(matchResult[1]);
    const min = parseInt(matchResult[2] || "0");
    const period = matchResult[3]?.toLowerCase();
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    const bedtimes = [6, 5, 4].map(c => {
      const totalMins = c * 90 + 14;
      const wakeTotal = hour * 60 + min;
      let bedTotal = wakeTotal - totalMins;
      if (bedTotal < 0) bedTotal += 24 * 60;
      const bH = Math.floor(bedTotal / 60) % 24;
      const bM = bedTotal % 60;
      const p = bH < 12 ? "AM" : "PM";
      const h12 = bH % 12 || 12;
      return `• ${c} cycles (${c * 1.5}hrs): Sleep at *${h12}:${bM.toString().padStart(2, "0")} ${p}*`;
    });
    return reply(`💤 *Sleep Calculator*\n⏰ Wake up at: *${wakeTime}*\n\n🛌 Recommended bedtimes:\n${bedtimes.join("\n")}\n\n🌙 Aim for 5–6 cycles (7.5–9 hours)` + FOOTER);
  }
});

// ─── Fun & Personality ────────────────────────────────────────────────────────
registerCommand({
  name: "personality",
  aliases: ["mbti", "personalitytype"],
  category: "Lifestyle",
  description: "Look up MBTI personality type traits and careers",
  usage: ".personality INTJ",
  handler: async ({ reply, args }) => {
    const types: Record<string, { name: string; traits: string[]; careers: string[] }> = {
      INTJ: { name: "The Architect", traits: ["Strategic", "Independent", "Determined"], careers: ["Engineer", "Scientist", "Lawyer"] },
      INTP: { name: "The Thinker", traits: ["Analytical", "Creative", "Precise"], careers: ["Programmer", "Professor", "Analyst"] },
      ENTJ: { name: "The Commander", traits: ["Bold", "Strategic", "Charismatic"], careers: ["CEO", "Manager", "Politician"] },
      ENTP: { name: "The Debater", traits: ["Innovative", "Clever", "Energetic"], careers: ["Entrepreneur", "Lawyer", "Inventor"] },
      INFJ: { name: "The Advocate", traits: ["Insightful", "Principled", "Compassionate"], careers: ["Counselor", "Writer", "Doctor"] },
      INFP: { name: "The Mediator", traits: ["Empathetic", "Creative", "Idealistic"], careers: ["Artist", "Therapist", "Writer"] },
      ENFJ: { name: "The Protagonist", traits: ["Charismatic", "Empathetic", "Reliable"], careers: ["Teacher", "Coach", "Leader"] },
      ENFP: { name: "The Campaigner", traits: ["Enthusiastic", "Creative", "Sociable"], careers: ["Actor", "Journalist", "Coach"] },
      ISTJ: { name: "The Logistician", traits: ["Responsible", "Thorough", "Reliable"], careers: ["Accountant", "Police", "Military"] },
      ISFJ: { name: "The Defender", traits: ["Supportive", "Reliable", "Patient"], careers: ["Nurse", "Teacher", "Admin"] },
      ESTJ: { name: "The Executive", traits: ["Organized", "Loyal", "Traditional"], careers: ["Manager", "Judge", "Financial Officer"] },
      ESFJ: { name: "The Consul", traits: ["Caring", "Loyal", "Sociable"], careers: ["HR", "Teacher", "Nurse"] },
      ISTP: { name: "The Virtuoso", traits: ["Practical", "Observant", "Analytical"], careers: ["Engineer", "Mechanic", "Pilot"] },
      ISFP: { name: "The Adventurer", traits: ["Artistic", "Curious", "Flexible"], careers: ["Artist", "Chef", "Musician"] },
      ESTP: { name: "The Entrepreneur", traits: ["Bold", "Perceptive", "Direct"], careers: ["Entrepreneur", "Salesperson", "Paramedic"] },
      ESFP: { name: "The Entertainer", traits: ["Spontaneous", "Energetic", "Playful"], careers: ["Entertainer", "Actor", "Event Planner"] },
    };
    const type = args[0]?.toUpperCase();
    if (!type || !types[type])
      return reply(`🧠 *MBTI Personality Types*\n\nUsage: \`.personality INTJ\`\n\nAll types:\n${Object.entries(types).map(([t, p]) => `• *${t}* — ${p.name}`).join("\n")}` + FOOTER);
    const p = types[type];
    return reply(`🧠 *${type} — ${p.name}*\n\n✨ Traits: ${p.traits.join(", ")}\n💼 Best Careers: ${p.careers.join(", ")}\n\n📊 ~${Math.floor(Math.random() * 5) + 2}% of people are ${type}\n\n🔍 Full test: 16personalities.com` + FOOTER);
  }
});

registerCommand({
  name: "lovemeter",
  aliases: ["lovetest", "lovelevel"],
  category: "Lifestyle",
  description: "Fun love compatibility meter between two names",
  usage: ".lovemeter Alice Bob",
  handler: async ({ reply, args }) => {
    if (args.length < 2) return reply("Usage: `.lovemeter <name1> <name2>`" + FOOTER);
    const [n1, n2] = args;
    const combined = (n1 + n2).toLowerCase().split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = (combined % 40) + 60;
    const hearts = "❤️".repeat(Math.round(score / 20));
    const level = score > 90 ? "💯 Soulmates!" : score > 80 ? "💕 Very Compatible!" : score > 70 ? "💛 Pretty Good Match!" : "💙 Has Potential!";
    return reply(`💞 *Love Meter*\n\n👫 ${n1} ❤️ ${n2}\n\n${hearts}\n\n💯 Score: *${score}%*\n${level}\n\n_💡 Just for fun — real love takes more than numbers! 😊_` + FOOTER);
  }
});

registerCommand({
  name: "age",
  aliases: ["birthday", "howold"],
  category: "Lifestyle",
  description: "Calculate your exact age from date of birth",
  usage: ".age 2000-05-15",
  handler: async ({ reply, args }) => {
    const dob = new Date(args[0]);
    if (isNaN(dob.getTime())) return reply("Usage: `.age YYYY-MM-DD`\nExample: `.age 2000-05-15`" + FOOTER);
    const now = new Date();
    const diff = now.getTime() - dob.getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const nextBday = new Date(dob);
    nextBday.setFullYear(now.getFullYear() + (nextBday < now ? 1 : 0));
    const daysToNext = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return reply(`🎂 *Age Calculator*\n\n📅 Born: ${dob.toDateString()}\n\n🎉 Age: *${years} years, ${months} months, ${days} days*\n📊 Total Days Lived: *${totalDays.toLocaleString()}*\n\n🎈 Next Birthday in: *${daysToNext} days*` + FOOTER);
  }
});

registerCommand({
  name: "numerology",
  aliases: ["lifepath", "lifepathnumber"],
  category: "Lifestyle",
  description: "Calculate your numerology life path number",
  usage: ".numerology 1990-05-15",
  handler: async ({ reply, args }) => {
    const dob = args[0];
    if (!dob) return reply("Usage: `.numerology YYYY-MM-DD`" + FOOTER);
    const digits = dob.replace(/\D/g, "").split("").map(Number);
    let sum = digits.reduce((a, b) => a + b, 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0);
    }
    const meanings: Record<number, string> = {
      1: "The Leader — Independent, ambitious, a natural pioneer. You are meant to lead!",
      2: "The Diplomat — Cooperative, sensitive, a natural peacemaker.",
      3: "The Communicator — Creative, expressive, and socially vibrant.",
      4: "The Builder — Practical, disciplined, hardworking.",
      5: "The Freedom Seeker — Adventurous, dynamic, versatile.",
      6: "The Nurturer — Responsible, loving, community-focused.",
      7: "The Seeker — Analytical, introspective, spiritually aware.",
      8: "The Powerhouse — Ambitious, authoritative, success-driven.",
      9: "The Humanitarian — Compassionate, generous, globally-minded.",
      11: "Master Number 11 — Highly spiritual and intensely intuitive.",
      22: "Master Number 22 — The Master Builder. Visionary power.",
      33: "Master Number 33 — The Master Teacher. Greatest influence.",
    };
    return reply(`🔢 *Numerology Life Path*\n\n📅 Date: ${dob}\n\n⭐ *Life Path Number: ${sum}*\n\n💫 ${meanings[sum] || "A unique soul on a special journey."}` + FOOTER);
  }
});

registerCommand({
  name: "affirmation",
  aliases: ["affirm", "dailyaffirm"],
  category: "Lifestyle",
  description: "Get a positive daily affirmation",
  usage: ".affirmation",
  handler: async ({ reply }) => {
    const affirmations = [
      "I am capable of achieving everything I set my mind to. 💪",
      "I radiate positivity and attract good things into my life. ✨",
      "I am worthy of love, success, and abundance. 🌟",
      "Every challenge I face makes me stronger and wiser. 🔥",
      "I trust the process and know that everything happens for a reason. 🌙",
      "I am constantly growing, improving, and becoming my best self. 🚀",
      "My potential is unlimited. I believe in myself completely. 💫",
      "I am grateful for all the blessings in my life today. 🙏",
      "I attract opportunities and success effortlessly. 🎯",
      "I am at peace with my past and excited about my future. ☀️",
    ];
    return reply(`🌟 *Daily Affirmation*\n\n"${affirmations[Math.floor(Math.random() * affirmations.length)]}"\n\n✨ Repeat this 3 times with conviction! 💪` + FOOTER);
  }
});

registerCommand({
  name: "manifest",
  aliases: ["manifestation", "lawofattraction"],
  category: "Lifestyle",
  description: "Get a manifestation script for your goal",
  usage: ".manifest get a new job",
  handler: async ({ reply, args }) => {
    const goal = args.join(" ");
    if (!goal) return reply("Usage: `.manifest <your goal>`\nExample: `.manifest get a job`" + FOOTER);
    return reply(`✨ *Manifestation Script*\n\n🎯 Goal: *${goal}*\n\n📝 *Write this 3 times daily:*\n"I am so happy and grateful now that I have ${goal}. It came to me easily and naturally. I deserve it and I am ready to receive it."\n\n🔑 *Daily Steps:*\n1. Visualize having it for 5 minutes\n2. Feel the emotions of already having it\n3. Take one inspired action daily\n4. Trust the timing of the universe\n5. Let go of doubt and fear\n\n🌟 Believe it, act on it, receive it! ⚡` + FOOTER);
  }
});

registerCommand({
  name: "gratitude",
  aliases: ["thankful", "grateful"],
  category: "Lifestyle",
  description: "Get a daily gratitude journaling prompt",
  usage: ".gratitude",
  handler: async ({ reply }) => {
    const prompts = [
      "What made you smile today, even for just a moment?",
      "Name 3 people you are grateful to have in your life.",
      "What is one thing your body does for you that you take for granted?",
      "What challenge did you overcome that made you stronger?",
      "What is one simple pleasure you enjoy that others might overlook?",
    ];
    const things = ["your health 💪", "clean water 💧", "people who love you ❤️", "the sun rising today ☀️", "food to eat 🍽️", "your ability to read this 📱"];
    const shuffled = things.sort(() => 0.5 - Math.random()).slice(0, 3);
    return reply(`🙏 *Gratitude Journal*\n\n❓ *Today's prompt:*\n"${prompts[Math.floor(Math.random() * prompts.length)]}"\n\n💡 Today, be grateful for:\n• ${shuffled.join("\n• ")}\n\n✍️ Write your answers — gratitude rewires your brain for happiness! 🌟` + FOOTER);
  }
});
