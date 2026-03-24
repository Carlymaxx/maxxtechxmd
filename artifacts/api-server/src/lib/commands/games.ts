import { registerCommand } from "./types";

const TRUTHS = [
  "What's your biggest fear in life?",
  "What's the most embarrassing thing you've ever done?",
  "Have you ever lied to your best friend?",
  "What's the worst thing you've ever said to someone?",
  "Who is your secret crush right now?",
  "What's a bad habit you have that nobody knows about?",
  "Have you ever cheated on a test or exam?",
  "What's the most childish thing you still do?",
  "Have you ever stolen something, even small?",
  "What's your biggest regret in life?",
  "Have you ever blamed someone else for something you did?",
  "What's the strangest dream you've ever had?",
  "Have you ever read someone's messages without them knowing?",
  "Have you ever pretended to be sick to skip something?",
  "What's something you're too embarrassed to tell your parents?",
  "Have you ever talked badly about someone in this group?",
  "What's the longest you've gone without showering?",
  "Have you ever sent a message to the wrong person?",
  "What's the dumbest thing you've ever done?",
  "Have you ever ghosted someone?",
  "What's a lie you told that got seriously out of control?",
  "Do you have feelings for anyone in this group?",
  "Have you ever been caught snooping through someone's things?",
  "What's the most trouble you've ever been in?",
  "Have you ever faked being busy to avoid someone?",
  "What's one thing you would change about yourself?",
  "Have you ever cried watching a movie? Which one?",
  "What's the most embarrassing photo on your phone?",
  "Have you ever lied about your age?",
  "What's a secret talent nobody knows you have?",
];

const DARES = [
  "Change your profile picture to something funny for 1 hour.",
  "Write 'I am a potato 🥔' as your status for 30 minutes.",
  "Send a voice note singing happy birthday to the group.",
  "Let the last person who messaged you choose your next status.",
  "Send a genuine compliment to every person in this group.",
  "Post a funny selfie in the group right now.",
  "Text someone you haven't spoken to in over a year.",
  "Put your phone away completely for the next 30 minutes.",
  "Send a screenshot of your most used emoji.",
  "Call someone in your contacts and say 'I miss you' then hang up.",
  "Send a voice note saying 'MAXX XMD is the best WhatsApp bot!'",
  "Share your current lock screen wallpaper.",
  "Write a 3-line poem about the person above you.",
  "Do 20 push-ups and send proof via voice note.",
  "Change your name to 'MAXX XMD Fan' for 1 hour.",
  "Send the 5th photo in your gallery right now.",
  "Share your last WhatsApp status story.",
  "Tell the funniest joke you know to the group.",
  "Speak only in emojis for the next 5 minutes.",
  "Send 'You are amazing!' to 3 people in your contacts.",
  "Share the most recent meme you saved on your phone.",
  "Describe your whole day using only 3 emojis.",
  "Do a 30-second voice note impression of a celebrity.",
  "Send your honest review of someone in the group.",
  "Let someone else send one message from your phone.",
  "Share your Spotify/YouTube most played song.",
  "Try to make someone laugh using only text — 60 seconds.",
  "Send a message to your mom saying 'I need to tell you something'.",
  "Post a throwback photo right now.",
  "Share the last video you watched on YouTube.",
];

registerCommand({
  name: "truth",
  aliases: [],
  category: "Games",
  description: "Get a random truth question",
  handler: async ({ reply }) => {
    const q = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    await reply(`🙋 *TRUTH*\n\n❓ ${q}\n\n_Dare to be honest!_`);
  },
});

registerCommand({
  name: "dare",
  aliases: [],
  category: "Games",
  description: "Get a random dare challenge",
  handler: async ({ reply }) => {
    const d = DARES[Math.floor(Math.random() * DARES.length)];
    await reply(`😈 *DARE*\n\n🎯 ${d}\n\n_Do it or face the consequences!_`);
  },
});

registerCommand({
  name: "truthordare",
  aliases: ["tod"],
  category: "Games",
  description: "Get a random truth or dare",
  handler: async ({ reply }) => {
    const isTruth = Math.random() > 0.5;
    if (isTruth) {
      const q = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
      await reply(`🎮 *TRUTH OR DARE → TRUTH!*\n\n🙋 ❓ ${q}\n\n_You got truth! Be honest!_`);
    } else {
      const d = DARES[Math.floor(Math.random() * DARES.length)];
      await reply(`🎮 *TRUTH OR DARE → DARE!*\n\n😈 🎯 ${d}\n\n_You got dare! Do it!_`);
    }
  },
});
