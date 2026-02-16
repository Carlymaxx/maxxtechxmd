const dares = [
  "Send a voice note singing your favorite song! 🎤",
  "Change your profile picture to a funny face for 1 hour! 😜",
  "Send 'I love you' to the 5th contact in your chat list! 💕",
  "Post a status saying 'I'm a chicken' and keep it for 2 hours! 🐔",
  "Text your crush and say 'Hey, thinking of you!' 💭",
  "Send a voice note doing your best animal impression! 🐮",
  "Let someone else send a message from your phone! 📱",
  "Send your most recent selfie to this chat! 🤳",
  "Type with your eyes closed for the next 3 messages! 👀",
  "Send a voice note laughing for 10 seconds straight! 😂",
  "Change your WhatsApp name to 'I lost a dare' for 1 hour! 📝",
  "Send a love poem to the last person who messaged you! 💝",
  "Record yourself doing 10 push-ups and send the video! 💪",
  "Send a message to your parents saying 'I need to talk, it's serious' then say 'I love you'! ❤️",
  "Speak in an accent for the next 5 voice notes! 🗣️",
  "Send your screen time to this chat! ⏰",
  "Make up a rap about the person above you! 🎵",
  "Send a selfie with the weirdest face you can make! 🤪",
  "Share the last YouTube video you watched! 📺",
  "Tell your funniest childhood story in a voice note! 👶"
];

module.exports = {
  name: "dare",
  description: "Get a random dare challenge",
  execute: async (sock, msg, args, from, settings) => {
    const dare = dares[Math.floor(Math.random() * dares.length)];
    await sock.sendMessage(from, {
      text: `🔥 *Dare Challenge:*\n\n${dare}\n\n> _No backing out!_ 😈`
    }, { quoted: msg });
  }
};
