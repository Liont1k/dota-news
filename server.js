const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Раздаём статические файлы (index.html, CSS, JS)
app.use(express.static(path.join(__dirname)));

// === API: Reddit с правильным User-Agent ===
app.get('/api/reddit', async (req, res) => {
  try {
    const response = await fetch('https://www.reddit.com/r/Dota2/new.json?limit=10', {
      method: 'GET',
      headers: {
        'User-Agent': 'DotaNewsApp/1.0 (contact: youremail@example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit: HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Reddit API error:', err.message);
    res.status(500).json({ error: 'Reddit недоступен', details: err.message });
  }
});

// === API: Steam RSS ===
app.get('/api/steam', async (req, res) => {
  try {
    const response = await fetch('https://steamcommunity.com/games/570/news/rss/', {
      method: 'GET',
      headers: {
        'User-Agent': 'DotaNewsApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Steam: HTTP ${response.status}`);
    }

    const rss = await response.text();

    // Очень простой парсинг RSS
    const entries = [];
    const items = rss.match(/<item>([\s\S]*?)<\/item>/g) || [];

    items.forEach(item => {
      const titleMatch = item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        entries.push({
          title: { $t: titleMatch[1].replace(/&amp;/g, '&') },
          link: [{ $: { href: linkMatch[1] } }],
          published: { $t: dateMatch ? dateMatch[1] : '' }
        });
      }
    });

    res.json({ feed: { entry: entries.slice(0, 10) } });
  } catch (err) {
    console.error('Steam API error:', err.message);
    res.status(500).json({ error: 'Steam недоступен', details: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
  console.log(`➡️  Откройте в браузере: http://localhost:${PORT}`);
});
