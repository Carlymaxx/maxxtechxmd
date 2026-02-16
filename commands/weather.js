const https = require("https");

module.exports = {
  name: "weather",
  alias: ["w"],
  description: "Get weather for a city",
  execute: async (sock, msg, args, from, settings) => {
    if (!args.length) {
      return await sock.sendMessage(from, {
        text: "🌤️ *Weather*\n\nUsage: .weather <city>\n\nExample: .weather Nairobi"
      }, { quoted: msg });
    }

    const city = args.join(" ");

    try {
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

      const data = await new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "curl/7.0" } }, (res) => {
          let body = "";
          res.on("data", chunk => body += chunk);
          res.on("end", () => {
            try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
          });
          res.on("error", reject);
        }).on("error", reject);
      });

      const current = data.current_condition[0];
      const area = data.nearest_area[0];
      const forecast = data.weather[0];

      const text = `🌤️ *Weather Report*

📍 *Location:* ${area.areaName[0].value}, ${area.country[0].value}
🌡️ *Temperature:* ${current.temp_C}°C / ${current.temp_F}°F
🤔 *Feels Like:* ${current.FeelsLikeC}°C
💨 *Wind:* ${current.windspeedKmph} km/h ${current.winddir16Point}
💧 *Humidity:* ${current.humidity}%
☁️ *Cloud Cover:* ${current.cloudcover}%
🌧️ *Precipitation:* ${current.precipMM}mm
👁️ *Visibility:* ${current.visibility} km
📝 *Condition:* ${current.weatherDesc[0].value}

📅 *Today's Forecast:*
🔺 Max: ${forecast.maxtempC}°C
🔻 Min: ${forecast.mintempC}°C
🌅 Sunrise: ${forecast.astronomy[0].sunrise}
🌇 Sunset: ${forecast.astronomy[0].sunset}

> _${settings.botName}_ ⛅`;

      await sock.sendMessage(from, { text }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Could not find weather for that location. Check the city name!" }, { quoted: msg });
    }
  }
};
