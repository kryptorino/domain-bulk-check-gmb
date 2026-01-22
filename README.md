# Domain Bulk Check Tool - Google My Business

Ein leistungsstarkes Tool zur Überprüfung mehrerer Domains auf Google My Business Einträge mittels der DataForSEO API.

🌐 **[Live Demo auf Vercel](https://deine-app.vercel.app)** (Nach Deployment)

## Features

- **Bulk Domain Check**: Überprüfe mehrere Domains gleichzeitig
- **DataForSEO API Integration**: Nutzt die professionelle DataForSEO Business Data API
- **Google My Business Daten**: Findet GMB-Einträge mit detaillierten Informationen
- **Übersichtliche Ergebnisse**: Zeigt Name, Adresse, Bewertungen, Telefon und weitere Details
- **Export Funktionen**: Exportiere Ergebnisse als CSV oder JSON
- **Benutzerfreundlich**: Modernes, intuitives Interface
- **Lokale Speicherung**: API-Credentials werden sicher lokal gespeichert
- **Cloud-Ready**: Deploybar auf Vercel (Serverless)

## Quick Start

### Option 1: Online nutzen (Vercel)

1. Besuche die [Live Demo](https://deine-app.vercel.app)
2. Gib deine DataForSEO API Credentials ein
3. Domains eingeben und Check starten

### Option 2: Lokal ausführen

#### Voraussetzungen

- Node.js (Version 14 oder höher)
- DataForSEO API Account ([Registrierung](https://app.dataforseo.com/register))
- API Credits für Business Data API

## Installation

1. Installiere die Abhängigkeiten:

```bash
npm install
```

2. Hole dir deine DataForSEO API Credentials:
   - Gehe zu [DataForSEO Dashboard](https://app.dataforseo.com/)
   - Navigiere zu API Access
   - Kopiere Login und Password

## Verwendung

1. Starte den Server:

```bash
npm start
```

2. Öffne deinen Browser und navigiere zu:

```
http://localhost:3000
```

3. Gib deine DataForSEO API Credentials ein

4. Füge deine Domains ein (eine pro Zeile), zum Beispiel:

```
example.com
google.com
amazon.de
```

5. Klicke auf "Check starten"

6. Warte auf die Ergebnisse und exportiere sie bei Bedarf

## API Endpunkte

### POST /api/check-domains

Überprüft mehrere Domains auf GMB-Einträge.

**Request Body:**
```json
{
  "domains": ["example.com", "google.com"],
  "credentials": {
    "login": "your-login",
    "password": "your-password"
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "domain": "example.com",
      "status": "found",
      "gmbName": "Example Company",
      "address": "123 Main St, City",
      "rating": 4.5,
      "reviewsCount": 120,
      "phone": "+1234567890",
      "website": "https://example.com",
      "category": "Business"
    }
  ],
  "total": 2,
  "found": 1,
  "notFound": 0,
  "errors": 1
}
```

### POST /api/check-domain

Überprüft eine einzelne Domain (für Tests).

**Request Body:**
```json
{
  "domain": "example.com",
  "credentials": {
    "login": "your-login",
    "password": "your-password"
  }
}
```

### GET /api/health

Health Check Endpunkt.

## DataForSEO API

Dieses Tool nutzt die **Business Data API - Google My Business Info** von DataForSEO:

- Endpoint: `/v3/business_data/google/my_business_info/live`
- Dokumentation: [DataForSEO Business Data API](https://docs.dataforseo.com/v3/business_data/google/my_business_info/live/)

### API Kosten

Die Kosten variieren je nach DataForSEO Tarif. Typischerweise:
- ~$0.01 - $0.02 pro Anfrage für GMB Info
- Prüfe aktuelle Preise im [DataForSEO Dashboard](https://app.dataforseo.com/)

### Rate Limiting

Das Tool fügt automatisch eine 1-Sekunden-Verzögerung zwischen Anfragen ein, um Rate Limits zu vermeiden. Dies kann in `server.js` angepasst werden:

```javascript
// In server.js, Zeile ~125
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 Sekunde
```

## Projektstruktur

```
app/
├── index.html          # Frontend UI
├── app.js             # Frontend Logik
├── server.js          # Backend API Server
├── package.json       # Node.js Abhängigkeiten
└── README.md          # Diese Datei
```

## Erweiterungsmöglichkeiten

Das Tool kann leicht erweitert werden für zusätzliche Checks:

1. **SEO Metrics**: Domain Authority, Backlinks, Rankings
2. **SERP Analysis**: Keyword Rankings, Featured Snippets
3. **Competitor Analysis**: Vergleich mit Mitbewerbern
4. **Social Media**: Facebook, Instagram, LinkedIn Präsenz
5. **Technical SEO**: Page Speed, Mobile Friendly, SSL

Beispiel für weitere DataForSEO Endpoints:
- `/v3/serp/google/organic/live` - SERP Daten
- `/v3/backlinks/summary/live` - Backlink Daten
- `/v3/on_page/summary` - On-Page SEO

## Fehlerbehebung

### "API credentials are required"
- Stelle sicher, dass du Login und Password eingegeben hast
- Überprüfe, ob die Credentials korrekt sind

### "API request failed"
- Prüfe deine API Credits im DataForSEO Dashboard
- Stelle sicher, dass du Zugriff auf die Business Data API hast
- Prüfe die Console für detaillierte Fehlermeldungen

### Server startet nicht
- Stelle sicher, dass Port 3000 nicht bereits verwendet wird
- Führe `npm install` erneut aus

### "Kein Google My Business Eintrag gefunden"
- Nicht alle Domains haben GMB-Einträge
- Versuche verschiedene Schreibweisen (mit/ohne www)
- Einige Unternehmen haben möglicherweise den Eintrag unter anderem Namen

## Sicherheit

- API Credentials werden nur lokal im Browser gespeichert (localStorage)
- Credentials werden nicht an Dritte weitergegeben
- Alle API-Anfragen gehen direkt an DataForSEO
- HTTPS wird empfohlen für Produktionsumgebungen

## Development

Für Development mit Auto-Reload:

```bash
npm run dev
```

## Deployment

### Auf Vercel deployen

Das Tool ist optimiert für Vercel Serverless Functions. Siehe [DEPLOYMENT.md](DEPLOYMENT.md) für eine detaillierte Schritt-für-Schritt-Anleitung.

**Kurzversion:**

1. Repository auf GitHub pushen
2. Vercel Account erstellen
3. Repository mit Vercel verbinden
4. Deploy starten (automatisch)

Alle Dateien sind bereits vorbereitet (`vercel.json`, Serverless Functions in `/api`).

### Vercel CLI

```bash
# Vercel CLI installieren
npm install -g vercel

# Deployen
vercel

# Production Deployment
vercel --prod
```

## Projektstruktur

```
app/
├── index.html          # Frontend UI
├── app.js             # Frontend Logik
├── server.js          # Local Development Server (optional)
├── api/               # Vercel Serverless Functions
│   ├── check-domains.js
│   ├── check-domain.js
│   └── health.js
├── vercel.json        # Vercel Konfiguration
├── package.json       # Dependencies
├── README.md          # Diese Datei
└── DEPLOYMENT.md      # Deployment Anleitung
```

## Support

Bei Fragen zur DataForSEO API:
- [DataForSEO Dokumentation](https://docs.dataforseo.com/)
- [DataForSEO Support](https://dataforseo.com/contact)

Bei Deployment-Fragen:
- [Vercel Dokumentation](https://vercel.com/docs)
- [GitHub Docs](https://docs.github.com)

## Lizenz

MIT License
