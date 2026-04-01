import { registerCommand } from "./types";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";

// ── In-memory game state ───────────────────────────────────────────────────────

interface HangmanGame { word: string; guessed: string[]; wrong: number; }
interface WordleGame { word: string; attempts: string[]; maxAttempts: number; }
interface ScrambleGame { original: string; scrambled: string; }
interface MathGame { question: string; answer: number; }
interface RiddleGame { riddle: string; answer: string; }

const hangmanGames = new Map<string, HangmanGame>();
const wordleGames  = new Map<string, WordleGame>();
const scrambleGames = new Map<string, ScrambleGame>();
const mathGames    = new Map<string, MathGame>();
const riddleGames  = new Map<string, RiddleGame>();

const HANGMAN_WORDS = [
  "elephant","programming","university","keyboard","javascript","typescript","butterfly","sunflower","telescope","basketball",
  "adventure","psychology","philosophy","microphone","watermelon","strawberry","chocolate","constitution","transportation","environment",
  "refrigerator","communication","entertainment","relationship","infrastructure","democracy","photosynthesis","consciousness","phenomenon","mediterranean",
];

const WORDLE_WORDS = ["crane","stare","brave","flame","glare","blame","snare","share","flare","place","grace","trace","space","phase","chase","blaze","graze","praze","drape","grape"];

const SCRAMBLE_WORDS = [
  { w: "javascript", h: "Popular programming language" },
  { w: "elephant", h: "Largest land animal" },
  { w: "umbrella", h: "Used in rain" },
  { w: "keyboard", h: "You type on this" },
  { w: "butterfly", h: "Colorful insect" },
  { w: "chocolate", h: "Sweet treat" },
  { w: "computer", h: "Electronic device" },
  { w: "mountain", h: "Very high landform" },
  { w: "dolphins", h: "Intelligent sea mammals" },
  { w: "sunshine", h: "Light from the star" },
];

function hangmanDisplay(game: HangmanGame): string {
  const stages = ["  ","  O","  O\n  |","  O\n /|","  O\n /|\\","  O\n /|\\\n /","  O\n /|\\\n / \\"];
  const stage = stages[Math.min(game.wrong, 6)];
  const revealed = game.word.split("").map(c => game.guessed.includes(c) ? c : "_").join(" ");
  const wrong = game.guessed.filter(c => !game.word.includes(c)).join(", ");
  return `🎯 *HANGMAN*\n\n\`\`\`\n${stage}\n\`\`\`\n\n📝 *Word:* ${revealed}\n❌ *Wrong:* ${wrong || "none"} (${game.wrong}/6)\n\n_Reply *.guess <letter>_ to guess!_`;
}

// ── Hangman ───────────────────────────────────────────────────────────────────

registerCommand({
  name: "hangman",
  aliases: ["hm", "startha"],
  category: "Games",
  description: "Start a Hangman word game",
  handler: async ({ from, reply }) => {
    const word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
    const game: HangmanGame = { word, guessed: [], wrong: 0 };
    hangmanGames.set(from, game);
    await reply(`${hangmanDisplay(game)}\n\n_${word.length} letters_${FOOTER}`);
  },
});

registerCommand({
  name: "guess",
  aliases: ["gl", "letter"],
  category: "Games",
  description: "Guess a letter in Hangman (.guess a)",
  handler: async ({ from, args, reply }) => {
    const game = hangmanGames.get(from);
    if (!game) return reply(`❌ No active Hangman game! Start one with *.hangman*${FOOTER}`);
    const letter = args[0]?.toLowerCase();
    if (!letter || letter.length !== 1 || !/[a-z]/.test(letter)) return reply(`❓ Usage: .guess <single letter>`);
    if (game.guessed.includes(letter)) return reply(`ℹ️ You already guessed *"${letter}"*!${FOOTER}`);
    game.guessed.push(letter);
    if (!game.word.includes(letter)) game.wrong++;
    const revealed = game.word.split("").map(c => game.guessed.includes(c) ? c : "_").join(" ");
    const won = !revealed.includes("_");
    if (won) {
      hangmanGames.delete(from);
      return reply(`🎉 *YOU WIN!*\n\nThe word was: *${game.word}*\n\n_Start a new game with *.hangman*_${FOOTER}`);
    }
    if (game.wrong >= 6) {
      hangmanGames.delete(from);
      return reply(`💀 *GAME OVER!*\n\nThe word was: *${game.word}*\n\n_Start again with *.hangman*_${FOOTER}`);
    }
    await reply(hangmanDisplay(game) + FOOTER);
  },
});

// ── Wordle ─────────────────────────────────────────────────────────────────────

registerCommand({
  name: "wordle",
  aliases: ["startwordle", "wrd"],
  category: "Games",
  description: "Start a 5-letter Wordle game (6 guesses to find the word)",
  handler: async ({ from, reply }) => {
    const word = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
    wordleGames.set(from, { word, attempts: [], maxAttempts: 6 });
    await reply(`🟩 *WORDLE*\n\nGuess the 5-letter word in 6 tries!\n\n🟩 = correct spot\n🟨 = wrong spot\n⬜ = not in word\n\n_Use *.wordguess <5-letter-word>_ to guess!_${FOOTER}`);
  },
});

registerCommand({
  name: "wordguess",
  aliases: ["wguess", "wordleguess"],
  category: "Games",
  description: "Make a guess in Wordle (.wordguess crane)",
  handler: async ({ from, args, reply }) => {
    const game = wordleGames.get(from);
    if (!game) return reply(`❌ No active Wordle! Start one with *.wordle*${FOOTER}`);
    const guess = args[0]?.toLowerCase();
    if (!guess || guess.length !== 5 || !/^[a-z]+$/.test(guess)) return reply(`❓ Guess must be a 5-letter word!`);
    game.attempts.push(guess);
    const result = guess.split("").map((c, i) => {
      if (c === game.word[i]) return "🟩";
      if (game.word.includes(c)) return "🟨";
      return "⬜";
    }).join("");
    const history = game.attempts.map((a, i) => {
      const r = a.split("").map((c, j) => {
        if (c === game.word[j]) return "🟩";
        if (game.word.includes(c)) return "🟨";
        return "⬜";
      }).join("");
      return `${r} ${a.toUpperCase()}`;
    }).join("\n");
    if (guess === game.word) {
      wordleGames.delete(from);
      return reply(`🎉 *WORDLE WON!* in ${game.attempts.length} tries!\n\n${history}\n\nThe word was *${game.word.toUpperCase()}*${FOOTER}`);
    }
    if (game.attempts.length >= game.maxAttempts) {
      wordleGames.delete(from);
      return reply(`💀 *WORDLE LOST!*\n\n${history}\n\nThe word was *${game.word.toUpperCase()}*${FOOTER}`);
    }
    await reply(`🟩 *WORDLE* (${game.attempts.length}/${game.maxAttempts})\n\n${history}\n\n_${game.maxAttempts - game.attempts.length} guesses left_${FOOTER}`);
  },
});

// ── Word Scramble ─────────────────────────────────────────────────────────────

registerCommand({
  name: "scramble",
  aliases: ["unscramble", "wordscramble"],
  category: "Games",
  description: "Start a word scramble game",
  handler: async ({ from, reply }) => {
    const item = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
    const shuffled = item.w.split("").sort(() => Math.random() - 0.5).join("");
    scrambleGames.set(from, { original: item.w, scrambled: shuffled });
    await reply(`🔀 *Word Scramble!*\n\n🔤 *Scrambled:* *${shuffled.toUpperCase()}*\n💡 *Hint:* ${item.h}\n\n_Reply *.solve <word>_ to answer!_${FOOTER}`);
  },
});

registerCommand({
  name: "solve",
  aliases: ["answer2", "unscrambleans"],
  category: "Games",
  description: "Answer the scramble game (.solve butterfly)",
  handler: async ({ from, args, reply }) => {
    const game = scrambleGames.get(from);
    if (!game) return reply(`❌ No active scramble! Start with *.scramble*${FOOTER}`);
    const answer = args.join("").toLowerCase();
    if (answer === game.original) {
      scrambleGames.delete(from);
      return reply(`🎉 *CORRECT!*\n\nThe word was *${game.original.toUpperCase()}*\n\n_Play again with *.scramble*_${FOOTER}`);
    }
    await reply(`❌ *Wrong!* That's not it.\n\n🔤 Scrambled: *${game.scrambled.toUpperCase()}*\n_Try again or *.giveup* to quit_${FOOTER}`);
  },
});

registerCommand({
  name: "giveup",
  aliases: ["endgame2", "quitgame"],
  category: "Games",
  description: "Give up on the current game and reveal the answer",
  handler: async ({ from, reply }) => {
    const hm = hangmanGames.get(from);
    const sc = scrambleGames.get(from);
    const mt = mathGames.get(from);
    const wl = wordleGames.get(from);
    const rd = riddleGames.get(from);
    if (hm) { hangmanGames.delete(from); return reply(`🏳️ *Game Over!*\nHangman answer: *${hm.word}*${FOOTER}`); }
    if (sc) { scrambleGames.delete(from); return reply(`🏳️ *Game Over!*\nScramble answer: *${sc.original}*${FOOTER}`); }
    if (mt) { mathGames.delete(from); return reply(`🏳️ *Game Over!*\nMath answer: *${mt.answer}*${FOOTER}`); }
    if (wl) { wordleGames.delete(from); return reply(`🏳️ *Game Over!*\nWordle answer: *${wl.word}*${FOOTER}`); }
    if (rd) { riddleGames.delete(from); return reply(`🏳️ *Game Over!*\nRiddle answer: *${rd.answer}*${FOOTER}`); }
    await reply(`ℹ️ No active game to quit!${FOOTER}`);
  },
});

// ── Fast Math ─────────────────────────────────────────────────────────────────

registerCommand({
  name: "fastmath",
  aliases: ["mathgame", "speedmath"],
  category: "Games",
  description: "Quick math challenge — answer before time runs out!",
  handler: async ({ from, sock, reply }) => {
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, ans: number;
    if (op === "+") { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; ans = a + b; }
    else if (op === "-") { a = Math.floor(Math.random() * 50) + 25; b = Math.floor(Math.random() * 25) + 1; ans = a - b; }
    else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; ans = a * b; }
    mathGames.set(from, { question: `${a} ${op} ${b}`, answer: ans });
    await reply(`⚡ *SPEED MATH!*\n\n🧮 What is *${a} ${op} ${b}*?\n\n_Reply *.mathans <number>_ — you have 30 seconds!_${FOOTER}`);
    setTimeout(async () => {
      if (mathGames.has(from)) {
        mathGames.delete(from);
        try { await sock.sendMessage(from, { text: `⏰ Time's up! The answer was *${ans}*${FOOTER}` }); } catch {}
      }
    }, 30000);
  },
});

registerCommand({
  name: "mathans",
  aliases: ["manswer", "mathanswer"],
  category: "Games",
  description: "Answer the speed math challenge (.mathans 42)",
  handler: async ({ from, args, reply }) => {
    const game = mathGames.get(from);
    if (!game) return reply(`❌ No active math game! Use *.fastmath* to start.${FOOTER}`);
    const answer = parseInt(args[0]);
    if (isNaN(answer)) return reply(`❓ Usage: .mathans <number>`);
    mathGames.delete(from);
    if (answer === game.answer) {
      await reply(`🎉 *CORRECT!* ${game.question} = *${game.answer}*\n\n_Lightning fast! Play again with *.fastmath*_${FOOTER}`);
    } else {
      await reply(`❌ *Wrong!* The answer was *${game.answer}*\n\n_Try again with *.fastmath*_${FOOTER}`);
    }
  },
});

// ── Riddle Game ───────────────────────────────────────────────────────────────

registerCommand({
  name: "riddle2",
  aliases: ["riddlegame", "askriddle"],
  category: "Games",
  description: "Get a riddle and try to answer it (.riddle2 then .riddleans <answer>)",
  handler: async ({ from, reply }) => {
    const riddles = [
      { r: "I speak without a mouth and hear without ears. I have no body but come alive with the wind. What am I?", a: "echo" },
      { r: "The more you take, the more you leave behind. What am I?", a: "footsteps" },
      { r: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "map" },
      { r: "What has hands but can't clap?", a: "clock" },
      { r: "What gets wetter as it dries?", a: "towel" },
      { r: "What has to be broken before you can use it?", a: "egg" },
      { r: "I'm not alive, but I grow; I don't have lungs, but I need air. What am I?", a: "fire" },
      { r: "What has a neck but no head?", a: "bottle" },
      { r: "What goes up but never comes down?", a: "age" },
      { r: "I have an eye but cannot see. What am I?", a: "needle" },
    ];
    const item = riddles[Math.floor(Math.random() * riddles.length)];
    riddleGames.set(from, { riddle: item.r, answer: item.a });
    await reply(`🎭 *Riddle Time!*\n\n❓ ${item.r}\n\n_Reply *.riddleans <answer>_ to solve!_${FOOTER}`);
  },
});

registerCommand({
  name: "riddleans",
  aliases: ["ranswer", "riddleanswer"],
  category: "Games",
  description: "Answer the current riddle (.riddleans echo)",
  handler: async ({ from, args, reply }) => {
    const game = riddleGames.get(from);
    if (!game) return reply(`❌ No active riddle! Start with *.riddle2*${FOOTER}`);
    const answer = args.join(" ").toLowerCase().trim();
    if (answer === game.answer || game.answer.includes(answer) || answer.includes(game.answer)) {
      riddleGames.delete(from);
      return reply(`🎉 *CORRECT!*\n\nThe answer was *${game.answer}*!\n\n_Play again with *.riddle2*_${FOOTER}`);
    }
    await reply(`❌ *Wrong!* Think harder!\n\n_Hint: It starts with "${game.answer[0]}" and has ${game.answer.length} letters_${FOOTER}`);
  },
});

// ── Number game ───────────────────────────────────────────────────────────────

registerCommand({
  name: "guessthenumber",
  aliases: ["numbergame", "gtn"],
  category: "Games",
  description: "Guess a number between 1 and 100 (.gtn then .numguess <n>)",
  handler: async ({ from, sock, reply }) => {
    const target = Math.floor(Math.random() * 100) + 1;
    mathGames.set(from, { question: "number", answer: target });
    await reply(`🔢 *Guess the Number!*\n\nI'm thinking of a number between *1 and 100*.\n\n_Use *.numguess <number>_ to guess!_\n_You have 5 chances!_${FOOTER}`);
    (mathGames.get(from) as any).chances = 5;
  },
});

registerCommand({
  name: "numguess",
  aliases: ["nguess", "guessnumber"],
  category: "Games",
  description: "Guess the number (.numguess 42)",
  handler: async ({ from, args, reply }) => {
    const game = mathGames.get(from) as any;
    if (!game || game.question !== "number") return reply(`❌ No number game active! Start with *.guessthenumber*${FOOTER}`);
    const guess = parseInt(args[0]);
    if (isNaN(guess)) return reply(`❓ Usage: .numguess <number>`);
    game.chances--;
    if (guess === game.answer) {
      mathGames.delete(from);
      return reply(`🎉 *CORRECT!* The number was *${game.answer}*!\n_${6 - game.chances} guess(es) used_${FOOTER}`);
    }
    if (game.chances <= 0) {
      mathGames.delete(from);
      return reply(`💀 *No more chances!* The number was *${game.answer}*${FOOTER}`);
    }
    const hint = guess < game.answer ? "📈 Go *higher*!" : "📉 Go *lower*!";
    await reply(`${hint} You have *${game.chances} chance(s)* left.${FOOTER}`);
  },
});

// ── Truth or Dare ─────────────────────────────────────────────────────────────

registerCommand({
  name: "tod",
  aliases: ["truthordare2", "truthdare"],
  category: "Games",
  description: "Random Truth or Dare (.tod truth or .tod dare)",
  handler: async ({ args, reply }) => {
    const mode = args[0]?.toLowerCase();
    const truths = [
      "What's the most embarrassing thing you've done?",
      "Who was your first crush?",
      "Have you ever lied to your best friend?",
      "What's your biggest fear?",
      "What's the weirdest dream you've had?",
      "Have you ever cheated on a test?",
      "What's your most embarrassing moment at school/work?",
      "What's a secret you've never told anyone?",
    ];
    const dares = [
      "Send a voice note singing your favorite song!",
      "Change your WhatsApp bio to 'I love embarrassing myself' for 1 hour.",
      "Send a selfie making your ugliest face.",
      "Text your crush 'Hey, I've been thinking about you'.",
      "Do 20 push-ups and send proof.",
      "Call someone in the group and sing Happy Birthday.",
      "Send your most recent camera roll photo.",
      "Write a love poem about the last person you talked to.",
    ];
    if (mode === "truth") return reply(`🎭 *TRUTH*\n\n❓ ${truths[Math.floor(Math.random() * truths.length)]}${FOOTER}`);
    if (mode === "dare")  return reply(`🎭 *DARE*\n\n😈 ${dares[Math.floor(Math.random() * dares.length)]}${FOOTER}`);
    const isTruth = Math.random() < 0.5;
    const items = isTruth ? truths : dares;
    const item  = items[Math.floor(Math.random() * items.length)];
    await reply(`🎭 *${isTruth ? "TRUTH" : "DARE"}*\n\n${isTruth ? "❓" : "😈"} ${item}${FOOTER}`);
  },
});

// ── Emoji test ────────────────────────────────────────────────────────────────

registerCommand({
  name: "emojitest",
  aliases: ["emojiquiz", "whatemoji"],
  category: "Games",
  description: "Guess the word from emoji clues",
  handler: async ({ from, sock, reply }) => {
    const challenges = [
      { emojis: "🦁👑", answer: "lion king" },
      { emojis: "🕷️👨", answer: "spider man" },
      { emojis: "🦇👨", answer: "batman" },
      { emojis: "🍎📱", answer: "apple" },
      { emojis: "🌍🌊", answer: "ocean" },
      { emojis: "🎵🎤🌟", answer: "music star" },
      { emojis: "🏔️❄️", answer: "frozen mountain" },
      { emojis: "🌹❤️", answer: "rose love" },
      { emojis: "🎓📚", answer: "graduation" },
      { emojis: "🚀🌙", answer: "moon rocket" },
    ];
    const c = challenges[Math.floor(Math.random() * challenges.length)];
    mathGames.set(from, { question: "emoji_" + c.emojis, answer: c.answer });
    await reply(`🤔 *Emoji Quiz!*\n\n${c.emojis}\n\n_What does this represent? Use *.mathans <answer>*_${FOOTER}`);
    setTimeout(async () => {
      if (mathGames.get(from)?.question === "emoji_" + c.emojis) {
        mathGames.delete(from);
        try { await sock.sendMessage(from, { text: `⏰ Time's up! Answer: *${c.answer}*${FOOTER}` }); } catch {}
      }
    }, 30000);
  },
});

// ── Word chain ─────────────────────────────────────────────────────────────────

const wordChains = new Map<string, { lastWord: string; usedWords: string[] }>();

registerCommand({
  name: "wordchain",
  aliases: ["lastletter", "chainwords"],
  category: "Games",
  description: "Group word chain game — each word must start with the last letter of the previous (.wordchain start)",
  handler: async ({ from, args, reply }) => {
    if (args[0]?.toLowerCase() === "start") {
      wordChains.set(from, { lastWord: "apple", usedWords: ["apple"] });
      return reply(`🔗 *Word Chain Started!*\n\n📝 Starting word: *APPLE*\nNext must start with *E*\n\n_Use *.chain <word>_ to continue!_${FOOTER}`);
    }
    const chain = wordChains.get(from);
    if (!chain) return reply(`❌ No active chain! Use *.wordchain start*${FOOTER}`);
    const word = args[0]?.toLowerCase();
    if (!word) return reply(`❓ Usage: .wordchain start OR .chain <word>`);
    const lastLetter = chain.lastWord.slice(-1);
    if (word[0] !== lastLetter) return reply(`❌ Word must start with *"${lastLetter.toUpperCase()}"*!\nLast word: *${chain.lastWord}*${FOOTER}`);
    if (chain.usedWords.includes(word)) return reply(`❌ *"${word}"* was already used!${FOOTER}`);
    chain.lastWord = word;
    chain.usedWords.push(word);
    wordChains.set(from, chain);
    await reply(`✅ *${word.toUpperCase()}* — next starts with *${word.slice(-1).toUpperCase()}*\nChain length: ${chain.usedWords.length}${FOOTER}`);
  },
});

registerCommand({
  name: "chain",
  aliases: ["nextword"],
  category: "Games",
  description: "Continue the word chain (.chain elephant)",
  handler: async ({ from, args, reply }) => {
    const chain = wordChains.get(from);
    if (!chain) return reply(`❌ No active chain! Use *.wordchain start*${FOOTER}`);
    const word = args[0]?.toLowerCase();
    if (!word) return reply(`❓ Usage: .chain <word>`);
    const lastLetter = chain.lastWord.slice(-1);
    if (word[0] !== lastLetter) return reply(`❌ Must start with *"${lastLetter.toUpperCase()}"*!\nLast: *${chain.lastWord}*${FOOTER}`);
    if (chain.usedWords.includes(word)) return reply(`❌ Already used!${FOOTER}`);
    chain.lastWord = word;
    chain.usedWords.push(word);
    await reply(`✅ *${word.toUpperCase()}* ✓\nNext letter: *${word.slice(-1).toUpperCase()}*\nChain: ${chain.usedWords.length} words${FOOTER}`);
  },
});

// ── Typing speed test ─────────────────────────────────────────────────────────

const typingTests = new Map<string, { sentence: string; startTime: number }>();
const SENTENCES = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "The five boxing wizards jump quickly",
  "Sphinx of black quartz judge my vow",
];

registerCommand({
  name: "typingtest",
  aliases: ["typetest", "wpm"],
  category: "Games",
  description: "Test your typing speed in WPM",
  handler: async ({ from, sock, reply }) => {
    const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    typingTests.set(from, { sentence, startTime: Date.now() });
    await reply(`⌨️ *Typing Speed Test!*\n\nType this sentence as fast as you can:\n\n*"${sentence}"*\n\n_Use *.type <sentence>_ to submit!_${FOOTER}`);
    setTimeout(async () => {
      if (typingTests.has(from)) {
        typingTests.delete(from);
        try { await sock.sendMessage(from, { text: `⏰ Time's up! Use *.typingtest* to try again.${FOOTER}` }); } catch {}
      }
    }, 60000);
  },
});

registerCommand({
  name: "type",
  aliases: ["typesubmit", "typeans"],
  category: "Games",
  description: "Submit your typing test answer (.type The quick brown fox...)",
  handler: async ({ from, args, reply }) => {
    const test = typingTests.get(from);
    if (!test) return reply(`❌ No active test! Use *.typingtest* to start.${FOOTER}`);
    const elapsed = (Date.now() - test.startTime) / 1000;
    const userText = args.join(" ");
    typingTests.delete(from);
    const correct = userText.toLowerCase().trim() === test.sentence.toLowerCase();
    const words = test.sentence.split(" ").length;
    const wpm = Math.round((words / elapsed) * 60);
    const accuracy = Math.round((userText.split("").filter((c, i) => c === test.sentence[i]).length / test.sentence.length) * 100);
    await reply(
      `⌨️ *Typing Test Result*\n\n` +
      `⏱️ *Time:* ${elapsed.toFixed(2)}s\n` +
      `💨 *Speed:* ${wpm} WPM\n` +
      `🎯 *Accuracy:* ${accuracy}%\n` +
      `${correct ? "✅ *Perfect!*" : "❌ *Errors found*"}\n\n` +
      `${wpm > 80 ? "🔥 Blazing fast!" : wpm > 50 ? "💪 Good typing!" : wpm > 30 ? "👍 Average" : "🐌 Keep practicing!"}${FOOTER}`
    );
  },
});
