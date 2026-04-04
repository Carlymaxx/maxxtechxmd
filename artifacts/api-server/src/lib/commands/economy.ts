import { registerCommand } from "./types";
import fs from "fs";
import path from "path";

const FOOTER = "\n\n> _MAXX-XMD_ ⚡";
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const ECO_FILE = path.join(DATA_DIR, "economy.json");

interface UserEco { coins: number; bank: number; lastDaily: number; lastWork: number; lastRob: number; inventory: string[]; xp: number; level: number; }
function loadEco(): Record<string, UserEco> { try { return JSON.parse(fs.readFileSync(ECO_FILE, "utf8")); } catch { return {}; } }
function saveEco(d: Record<string, UserEco>) { fs.writeFileSync(ECO_FILE, JSON.stringify(d, null, 2)); }
function getUser(jid: string): UserEco {
  const eco = loadEco();
  if (!eco[jid]) eco[jid] = { coins: 0, bank: 0, lastDaily: 0, lastWork: 0, lastRob: 0, inventory: [], xp: 0, level: 1 };
  return eco[jid];
}
function saveUser(jid: string, data: UserEco) { const eco = loadEco(); eco[jid] = data; saveEco(eco); }
function addXP(jid: string, amount: number) {
  const u = getUser(jid);
  u.xp += amount;
  const nextLevel = u.level * 100;
  if (u.xp >= nextLevel) { u.xp -= nextLevel; u.level++; }
  saveUser(jid, u);
  return u.level;
}
const COIN = "🪙";
const SHOP_ITEMS: Record<string, { price: number; desc: string }> = {
  vip: { price: 500, desc: "VIP badge for your profile" },
  shield: { price: 200, desc: "Rob protection for 24h" },
  boost: { price: 300, desc: "2x work earnings for 1h" },
  luckycharm: { price: 150, desc: "+10% slot wins for 24h" },
  pickaxe: { price: 100, desc: "Earn more from work" },
  fishingrod: { price: 120, desc: "Unlock .fish command" },
  sword: { price: 250, desc: "+20% rob success rate" },
  crown: { price: 1000, desc: "Exclusive crown emoji" },
};

registerCommand({
  name: "daily",
  aliases: ["claim", "dailycoins"],
  category: "Economy",
  description: "Claim your daily coins reward",
  handler: async ({ sender, reply }) => {
    const u = getUser(sender);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const remaining = cooldown - (now - u.lastDaily);
    if (remaining > 0) {
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      return reply(`⏰ You already claimed today!\n\n🕐 Come back in *${h}h ${m}m*${FOOTER}`);
    }
    const reward = 100 + Math.floor(Math.random() * 200);
    const streak = Math.floor((now - u.lastDaily) / cooldown) === 1 ? (u as any).streak + 1 || 1 : 1;
    const bonus = Math.floor(streak * 10);
    u.coins += reward + bonus;
    u.lastDaily = now;
    (u as any).streak = streak;
    saveUser(sender, u);
    addXP(sender, 10);
    await reply(`${COIN} *Daily Reward Claimed!*\n\n💵 *Coins:* +${reward}\n🔥 *Streak Bonus:* +${bonus} (day ${streak})\n\n💰 *Balance:* ${u.coins} coins${FOOTER}`);
  },
});

registerCommand({
  name: "balance",
  aliases: ["bal", "wallet", "coins"],
  category: "Economy",
  description: "Check your coin balance",
  handler: async ({ sender, senderName, msg, reply }) => {
    const u = getUser(sender);
    const name = senderName;
    await reply(`${COIN} *${name}'s Wallet*\n\n💵 *Cash:* ${u.coins} coins\n🏦 *Bank:* ${u.bank} coins\n💎 *Total:* ${u.coins + u.bank} coins\n⭐ *Level:* ${u.level} (${u.xp} XP)\n🎒 *Items:* ${u.inventory.length}${FOOTER}`);
  },
});

registerCommand({
  name: "work",
  aliases: ["job", "earn"],
  category: "Economy",
  description: "Work and earn coins (1h cooldown)",
  handler: async ({ sender, reply }) => {
    const u = getUser(sender);
    const cooldown = 60 * 60 * 1000;
    const remaining = cooldown - (Date.now() - u.lastWork);
    if (remaining > 0) {
      const m = Math.ceil(remaining / 60000);
      return reply(`⏰ You're tired! Rest for *${m} minutes* before working again.${FOOTER}`);
    }
    const jobs = [
      { job: "Programmer", min: 80, max: 200 },
      { job: "Driver", min: 50, max: 120 },
      { job: "Chef", min: 60, max: 150 },
      { job: "Designer", min: 90, max: 180 },
      { job: "Writer", min: 70, max: 160 },
      { job: "Mechanic", min: 55, max: 130 },
      { job: "Teacher", min: 65, max: 140 },
      { job: "Farmer", min: 40, max: 100 },
    ];
    const hasPick = u.inventory.includes("pickaxe");
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (job.max - job.min) + job.min) * (hasPick ? 1.5 : 1);
    u.coins += Math.floor(earned);
    u.lastWork = Date.now();
    saveUser(sender, u);
    addXP(sender, 5);
    await reply(`💼 *Work Complete!*\n\n👷 *Job:* ${job.job}\n${COIN} *Earned:* ${Math.floor(earned)} coins${hasPick ? " (pickaxe bonus!)" : ""}\n\n💰 *Balance:* ${u.coins} coins${FOOTER}`);
  },
});

registerCommand({
  name: "give",
  aliases: ["send2", "sendcoins"],
  category: "Economy",
  description: "Give coins to another user (.give @user 100)",
  handler: async ({ sender, msg, args, reply }) => {
    const mentioned = (msg as any).message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const amount = parseInt(args[args.length - 1]);
    if (!mentioned || isNaN(amount) || amount <= 0) return reply(`❓ Usage: .give @user <amount>\nExample: .give @someone 100${FOOTER}`);
    const giver = getUser(sender);
    if (giver.coins < amount) return reply(`❌ Insufficient funds! You only have *${giver.coins}* coins.${FOOTER}`);
    const receiver = getUser(mentioned);
    giver.coins -= amount;
    receiver.coins += amount;
    saveUser(sender, giver);
    saveUser(mentioned, receiver);
    await reply(`✅ *Transfer Complete!*\n\n${COIN} Sent *${amount} coins* to @${mentioned.split("@")[0]}\n💰 Your balance: *${giver.coins} coins*${FOOTER}`);
  },
});

registerCommand({
  name: "rob",
  aliases: ["steal2", "heist"],
  category: "Economy",
  description: "Try to rob coins from another user (.rob @user)",
  handler: async ({ sender, msg, reply }) => {
    const mentioned = (msg as any).message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned || mentioned === sender) return reply(`❓ Usage: .rob @user\nExample: .rob @someone${FOOTER}`);
    const u = getUser(sender);
    const cooldown = 2 * 60 * 60 * 1000;
    const remaining = cooldown - (Date.now() - u.lastRob);
    if (remaining > 0) {
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      return reply(`⏰ Rob cooldown! Try again in *${h}h ${m}m*${FOOTER}`);
    }
    const target = getUser(mentioned);
    if (target.coins < 10) return reply(`❌ @${mentioned.split("@")[0]} is broke! Nothing to rob.${FOOTER}`);
    const hasSword = u.inventory.includes("sword");
    const hasShield = target.inventory.includes("shield");
    const successRate = hasSword ? 0.65 : 0.45;
    const success = !hasShield && Math.random() < successRate;
    u.lastRob = Date.now();
    if (success) {
      const stolen = Math.floor(target.coins * (0.1 + Math.random() * 0.2));
      u.coins += stolen;
      target.coins -= stolen;
      saveUser(sender, u);
      saveUser(mentioned, target);
      addXP(sender, 8);
      await reply(`🦹 *Robbery Successful!*\n\nYou stole *${stolen} coins* from @${mentioned.split("@")[0]}!\n💰 Your balance: *${u.coins}*${FOOTER}`);
    } else {
      const fine = Math.floor(u.coins * 0.1);
      u.coins = Math.max(0, u.coins - fine);
      saveUser(sender, u);
      await reply(`🚨 *Robbery Failed!*\n\n${hasShield ? "Target had a shield 🛡️!" : "You got caught!"}\nFined *${fine} coins*\n💰 Your balance: *${u.coins}*${FOOTER}`);
    }
  },
});

registerCommand({
  name: "deposit",
  aliases: ["dep", "bankdep"],
  category: "Economy",
  description: "Deposit coins into your bank (.deposit 500 / .deposit all)",
  handler: async ({ sender, args, reply }) => {
    const u = getUser(sender);
    const amt = args[0]?.toLowerCase() === "all" ? u.coins : parseInt(args[0]);
    if (isNaN(amt) || amt <= 0) return reply(`❓ Usage: .deposit <amount/all>\nExample: .deposit 500${FOOTER}`);
    if (u.coins < amt) return reply(`❌ You only have *${u.coins} coins* in cash.${FOOTER}`);
    u.coins -= amt; u.bank += amt;
    saveUser(sender, u);
    await reply(`🏦 *Deposited ${amt} coins*\n\n💵 Cash: ${u.coins}\n🏦 Bank: ${u.bank}${FOOTER}`);
  },
});

registerCommand({
  name: "withdraw",
  aliases: ["with", "bankwith"],
  category: "Economy",
  description: "Withdraw coins from your bank (.withdraw 200 / .withdraw all)",
  handler: async ({ sender, args, reply }) => {
    const u = getUser(sender);
    const amt = args[0]?.toLowerCase() === "all" ? u.bank : parseInt(args[0]);
    if (isNaN(amt) || amt <= 0) return reply(`❓ Usage: .withdraw <amount/all>${FOOTER}`);
    if (u.bank < amt) return reply(`❌ Your bank only has *${u.bank} coins*.${FOOTER}`);
    u.bank -= amt; u.coins += amt;
    saveUser(sender, u);
    await reply(`💸 *Withdrew ${amt} coins*\n\n💵 Cash: ${u.coins}\n🏦 Bank: ${u.bank}${FOOTER}`);
  },
});

registerCommand({
  name: "leaderboard2",
  aliases: ["rich", "richlist", "toprich"],
  category: "Economy",
  description: "See the richest users in the economy",
  handler: async ({ reply }) => {
    const eco = loadEco();
    const sorted = Object.entries(eco)
      .map(([jid, u]) => ({ jid, total: u.coins + u.bank }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    if (!sorted.length) return reply(`❌ No economy data yet.${FOOTER}`);
    const medals = ["🥇", "🥈", "🥉"];
    const list = sorted.map((u, i) => `${medals[i] || `${i + 1}.`} @${u.jid.split("@")[0]} — *${u.total.toLocaleString()} ${COIN}*`).join("\n");
    await reply(`🏆 *Richest Users*\n\n${list}${FOOTER}`);
  },
});

registerCommand({
  name: "slots",
  aliases: ["slotmachine", "slot"],
  category: "Economy",
  description: "Play the slot machine (.slots 50) — bet some coins",
  handler: async ({ sender, args, reply }) => {
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet < 10) return reply(`❓ Usage: .slots <bet>\nMinimum bet: 10 coins${FOOTER}`);
    const u = getUser(sender);
    if (u.coins < bet) return reply(`❌ You only have *${u.coins} coins*. Not enough to bet ${bet}.${FOOTER}`);
    const symbols = ["🍎", "🍊", "🍋", "🍇", "💎", "7️⃣", "🎰", "⭐"];
    const reels = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
    const display = `| ${reels.join(" | ")} |`;
    let winnings = 0;
    let resultMsg = "";
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      const mult = reels[0] === "💎" ? 10 : reels[0] === "7️⃣" ? 7 : reels[0] === "🎰" ? 5 : 3;
      winnings = bet * mult;
      resultMsg = `🎉 *JACKPOT!* ${reels[0]}${reels[0]}${reels[0]} — Won *${winnings} coins* (${mult}x)!`;
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      winnings = Math.floor(bet * 0.5);
      resultMsg = `😊 *Small win!* — Won *${winnings} coins* (0.5x)`;
    } else {
      winnings = -bet;
      resultMsg = `😞 *No match* — Lost *${bet} coins*`;
    }
    u.coins += winnings;
    saveUser(sender, u);
    addXP(sender, 2);
    await reply(`🎰 *Slot Machine*\n\n${display}\n\n${resultMsg}\n\n💰 Balance: *${u.coins} coins*${FOOTER}`);
  },
});

registerCommand({
  name: "flip2",
  aliases: ["coinbet", "flipbet"],
  category: "Economy",
  description: "Flip a coin for double or nothing (.flip2 100 heads)",
  handler: async ({ sender, args, reply }) => {
    const bet = parseInt(args[0]);
    const choice = args[1]?.toLowerCase();
    if (isNaN(bet) || bet < 5 || !["heads", "tails", "h", "t"].includes(choice || "")) {
      return reply(`❓ Usage: .flip2 <bet> <heads/tails>\nExample: .flip2 100 heads${FOOTER}`);
    }
    const u = getUser(sender);
    if (u.coins < bet) return reply(`❌ Not enough coins. You have *${u.coins}*.${FOOTER}`);
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const playerChoice = choice === "h" ? "heads" : choice === "t" ? "tails" : choice!;
    const won = playerChoice === result;
    u.coins += won ? bet : -bet;
    saveUser(sender, u);
    await reply(`🪙 *Coin Flip*\n\nYour pick: *${playerChoice}*\nResult: *${result}*\n\n${won ? `🎉 YOU WIN! +${bet} coins!` : `😞 You lost! -${bet} coins`}\n\n💰 Balance: *${u.coins}*${FOOTER}`);
  },
});

registerCommand({
  name: "shop",
  aliases: ["store", "itemshop"],
  category: "Economy",
  description: "View the item shop (.shop)",
  handler: async ({ reply }) => {
    const items = Object.entries(SHOP_ITEMS).map(([name, item]) => `🛒 *${name}* — ${item.price} ${COIN}\n   _${item.desc}_`).join("\n\n");
    await reply(`🏪 *MAXX-XMD Item Shop*\n\n${items}\n\nUse *.buy <item>* to purchase!${FOOTER}`);
  },
});

registerCommand({
  name: "buy",
  aliases: ["purchase", "buyitem"],
  category: "Economy",
  description: "Buy an item from the shop (.buy vip)",
  handler: async ({ sender, args, reply }) => {
    const itemName = args[0]?.toLowerCase();
    const item = SHOP_ITEMS[itemName];
    if (!item) return reply(`❌ Item *${itemName}* not found. Use *.shop* to see available items.${FOOTER}`);
    const u = getUser(sender);
    if (u.coins < item.price) return reply(`❌ You need *${item.price}* coins. You have *${u.coins}*.${FOOTER}`);
    if (u.inventory.includes(itemName)) return reply(`ℹ️ You already own *${itemName}*.${FOOTER}`);
    u.coins -= item.price;
    u.inventory.push(itemName);
    saveUser(sender, u);
    await reply(`✅ *Purchased: ${itemName}!*\n\n💡 ${item.desc}\n💰 Remaining: *${u.coins} coins*${FOOTER}`);
  },
});

registerCommand({
  name: "inventory",
  aliases: ["inv", "items", "bag"],
  category: "Economy",
  description: "View your item inventory",
  handler: async ({ sender, senderName, msg, reply }) => {
    const u = getUser(sender);
    const name = senderName;
    if (!u.inventory.length) return reply(`🎒 *${name}'s Inventory*\n\n_Empty — visit *.shop* to buy items!_${FOOTER}`);
    const list = u.inventory.map((item, i) => `${i + 1}. *${item}* — ${SHOP_ITEMS[item]?.desc || "Unknown item"}`).join("\n");
    await reply(`🎒 *${name}'s Inventory* (${u.inventory.length} items)\n\n${list}${FOOTER}`);
  },
});

registerCommand({
  name: "level",
  aliases: ["xp", "rank"],
  category: "Economy",
  description: "Check your level and XP",
  handler: async ({ sender, senderName, msg, reply }) => {
    const u = getUser(sender);
    const name = senderName;
    const nextXP = u.level * 100;
    const pct = Math.round((u.xp / nextXP) * 100);
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    await reply(`⭐ *${name}'s Level*\n\n🎯 *Level:* ${u.level}\n📊 *XP:* ${u.xp}/${nextXP}\n${bar} ${pct}%\n\n_Earn XP by using commands!_${FOOTER}`);
  },
});

registerCommand({
  name: "toplevels",
  aliases: ["levelboard", "xpboard"],
  category: "Economy",
  description: "Leaderboard by level and XP",
  handler: async ({ reply }) => {
    const eco = loadEco();
    const sorted = Object.entries(eco)
      .sort(([, a], [, b]) => b.level !== a.level ? b.level - a.level : b.xp - a.xp)
      .slice(0, 10);
    if (!sorted.length) return reply(`❌ No data yet.${FOOTER}`);
    const list = sorted.map(([jid, u], i) => `${i + 1}. @${jid.split("@")[0]} — Lvl *${u.level}* (${u.xp} XP)`).join("\n");
    await reply(`📊 *Level Leaderboard*\n\n${list}${FOOTER}`);
  },
});

registerCommand({
  name: "reseteco",
  aliases: ["ecoreset", "cleareco"],
  category: "Economy",
  description: "Reset your own economy data",
  handler: async ({ sender, args, reply }) => {
    if (args[0] !== "confirm") return reply(`⚠️ This will reset ALL your coins, bank, and items!\nType *.reseteco confirm* to proceed.${FOOTER}`);
    saveUser(sender, { coins: 0, bank: 0, lastDaily: 0, lastWork: 0, lastRob: 0, inventory: [], xp: 0, level: 1 });
    await reply(`✅ Your economy data has been reset.${FOOTER}`);
  },
});

registerCommand({
  name: "ecoinfo",
  aliases: ["economyinfo", "ecohelp"],
  category: "Economy",
  description: "How the economy system works",
  handler: async ({ reply }) => {
    await reply(
      `${COIN} *Economy System Guide*\n\n` +
      `📋 *How to earn coins:*\n` +
      `• *.daily* — 100-300 coins/day\n` +
      `• *.work* — 40-200 coins/hour\n` +
      `• *.slots* — gamble to multiply\n` +
      `• *.flip2* — double or nothing\n` +
      `• *.rob* — steal from others\n\n` +
      `📋 *How to spend coins:*\n` +
      `• *.shop* — buy useful items\n` +
      `• *.give* — gift to friends\n` +
      `• *.deposit* — save in bank (safe from rob)\n\n` +
      `⭐ *Level up* by using commands!${FOOTER}`
    );
  },
});
