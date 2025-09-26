# Vacation Calendar — Full Stack App

Features:
- Fetches public holidays from Nager.Date (no holidays hard-coded).
- Supports multiple countries (select list is fetched).
- Monthly and Quarterly views.
- Highlights entire week:
  - Light green when **exactly one** holiday in that week.
  - Dark green when **more than one** holiday in that week.
- Shows holiday names and marks holiday days.

## Run locally

1. Install dependencies:
```bash
npm install
```

2. Start server:
```bash
npm start
```

3. Open `http://localhost:3000` in your browser.

## Notes
- The server proxies the Nager.Date API: https://date.nager.at
- If you deploy, ensure outgoing requests to that API are allowed.