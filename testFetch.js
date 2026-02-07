// testFetch.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

(async () => {
  try {
    const res = await fetch('https://eliteprotech-apis.zone.id/yt?url=https://youtube.com/watch?v=HhjHYkPQ8F0');
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error("❌ Error fetching API:", err);
  }
})();
