// server.js - backend
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/available-countries", async (req, res) => {
  try {
    const resp = await fetch("https://date.nager.at/api/v3/AvailableCountries");
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch countries" });
  }
});

app.get("/api/holidays", async (req, res) => {
  const { country, year } = req.query;
  if (!country || !year) return res.status(400).json({ error: "country and year required" });
  try {
    const resp = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch holidays" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
