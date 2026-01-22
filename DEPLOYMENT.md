# Deployment Anleitung - GitHub & Vercel

Diese Anleitung zeigt dir Schritt für Schritt, wie du das Domain Bulk Check Tool auf GitHub hochlädst und auf Vercel hostest.

## Voraussetzungen

- GitHub Account ([Kostenlos registrieren](https://github.com/join))
- Vercel Account ([Kostenlos registrieren](https://vercel.com/signup))
- Git installiert auf deinem Computer

## Schritt 1: GitHub Repository erstellen

### Option A: Über GitHub Website (Einfacher)

1. Gehe zu [GitHub](https://github.com) und melde dich an
2. Klicke oben rechts auf das **+** Symbol → **New repository**
3. Gib dem Repository einen Namen, z.B. `domain-bulk-check-gmb`
4. Wähle **Public** oder **Private** (beides funktioniert)
5. **NICHT** "Initialize with README" anklicken (wir haben schon Dateien)
6. Klicke auf **Create repository**
7. Kopiere die URL deines neuen Repositories (z.B. `https://github.com/deinname/domain-bulk-check-gmb.git`)

### Option B: Über GitHub CLI (Fortgeschritten)

```bash
# GitHub CLI installieren falls noch nicht vorhanden
# macOS: brew install gh
# Windows: winget install GitHub.cli

# Einloggen
gh auth login

# Repository erstellen
gh repo create domain-bulk-check-gmb --public --source=. --remote=origin
```

## Schritt 2: Code auf GitHub pushen

Öffne dein Terminal im Projektordner (`/Users/nilshenning/Desktop/app`) und führe folgende Befehle aus:

```bash
# 1. Git initialisieren (falls noch nicht geschehen)
git init

# 2. Alle Dateien hinzufügen
git add .

# 3. Ersten Commit erstellen
git commit -m "Initial commit: Domain Bulk Check Tool mit DataForSEO API"

# 4. Hauptbranch auf 'main' setzen
git branch -M main

# 5. GitHub Repository als Remote hinzufügen (URL durch deine ersetzen!)
git remote add origin https://github.com/DEIN-USERNAME/domain-bulk-check-gmb.git

# 6. Code auf GitHub pushen
git push -u origin main
```

**Wichtig:** Ersetze `DEIN-USERNAME` und den Repository-Namen durch deine eigenen Werte!

## Schritt 3: Auf Vercel deployen

### Option A: Über Vercel Website (Empfohlen)

1. Gehe zu [vercel.com](https://vercel.com) und melde dich an
2. Klicke auf **Add New...** → **Project**
3. Wähle **Import Git Repository**
4. Verbinde dein GitHub Account (falls noch nicht geschehen)
5. Wähle dein Repository `domain-bulk-check-gmb` aus
6. Klicke auf **Import**
7. Die Standard-Einstellungen sollten passen:
   - **Framework Preset**: Other
   - **Build Command**: (leer lassen)
   - **Output Directory**: (leer lassen)
8. Klicke auf **Deploy**
9. Warte ca. 1-2 Minuten bis das Deployment fertig ist
10. Fertig! Deine App ist jetzt live unter einer URL wie `https://domain-bulk-check-gmb.vercel.app`

### Option B: Über Vercel CLI (Fortgeschritten)

```bash
# Vercel CLI installieren
npm install -g vercel

# Im Projektordner ausführen
vercel

# Befolge die Anweisungen:
# - Set up and deploy? Yes
# - Which scope? (wähle deinen Account)
# - Link to existing project? No
# - Project name: domain-bulk-check-gmb
# - In which directory is your code located? ./
# - Deploy? Yes

# Für Production Deployment:
vercel --prod
```

## Schritt 4: Testen

1. Öffne die Vercel URL in deinem Browser
2. Gib deine DataForSEO API Credentials ein
3. Füge ein paar Test-Domains ein
4. Klicke auf "Check starten"
5. Die Ergebnisse sollten nach kurzer Zeit erscheinen

## Schritt 5: Eigene Domain verbinden (Optional)

Falls du eine eigene Domain hast:

1. Gehe zu deinem Vercel Dashboard
2. Wähle dein Projekt aus
3. Gehe zu **Settings** → **Domains**
4. Klicke auf **Add**
5. Gib deine Domain ein (z.B. `domain-check.deine-domain.de`)
6. Folge den Anweisungen, um deine DNS-Einträge zu aktualisieren
7. Warte auf die Verifizierung (kann bis zu 24h dauern)

## Troubleshooting

### "Failed to load resource" oder API Fehler

- Prüfe die Browser-Konsole (F12) für detaillierte Fehlermeldungen
- Stelle sicher, dass deine DataForSEO Credentials korrekt sind
- Prüfe, ob du genug API Credits hast

### "This Serverless Function has crashed"

- Gehe zu Vercel Dashboard → dein Projekt → **Functions**
- Klicke auf die Funktion um Logs zu sehen
- Häufige Ursache: Axios nicht als Dependency installiert
- Lösung: Stelle sicher dass `package.json` korrekt ist

### Deployment schlägt fehl

- Prüfe ob alle Dateien korrekt committed wurden: `git status`
- Stelle sicher dass `package.json` und `vercel.json` vorhanden sind
- Prüfe Vercel Build Logs für detaillierte Fehlermeldungen

### Änderungen pushen

Wenn du später Änderungen machst:

```bash
# Änderungen hinzufügen
git add .

# Commit erstellen
git commit -m "Beschreibung der Änderung"

# Auf GitHub pushen
git push

# Vercel deployt automatisch bei jedem Push!
```

## Vercel Features

### Automatische Deployments

- Jeder Push zu GitHub triggert automatisch ein neues Deployment
- Pull Requests bekommen Preview URLs
- Production Branch (main) wird auf die Haupt-URL deployed

### Environment Variables (Falls benötigt)

Falls du API Keys als Umgebungsvariablen speichern möchtest:

1. Gehe zu Vercel Dashboard → Settings → Environment Variables
2. Füge Variable hinzu (z.B. `DATAFORSEO_LOGIN`)
3. Wähle Environment: Production, Preview, Development
4. Im Code abrufen: `process.env.DATAFORSEO_LOGIN`

### Analytics & Logs

- **Analytics**: Vercel Dashboard → dein Projekt → Analytics
- **Logs**: Vercel Dashboard → dein Projekt → Functions → Logs
- **Real-time Logs**: `vercel logs` (via CLI)

## Kosten

- **GitHub**: Kostenlos für Public und Private Repositories
- **Vercel Hobby Plan**: Kostenlos für persönliche Projekte
  - Unlimitierte Deployments
  - 100 GB Bandwidth/Monat
  - Serverless Function Executions: 100 GB-Stunden/Monat
  - Das sollte für normale Nutzung völlig ausreichen!

- **DataForSEO API**: Bezahlt nach Nutzung
  - ~$0.01-0.02 pro GMB Check
  - Credits müssen aufgeladen werden

## URLs

Nach dem Deployment hast du:

- **Production URL**: `https://domain-bulk-check-gmb.vercel.app`
- **GitHub Repo**: `https://github.com/DEIN-USERNAME/domain-bulk-check-gmb`
- **API Endpoints**:
  - `https://domain-bulk-check-gmb.vercel.app/api/check-domains`
  - `https://domain-bulk-check-gmb.vercel.app/api/check-domain`
  - `https://domain-bulk-check-gmb.vercel.app/api/health`

## Nächste Schritte

1. Teile die URL mit deinem Team
2. Füge das Projekt deinem Portfolio hinzu
3. Erweitere das Tool mit zusätzlichen Checks
4. Erstelle ein schönes README mit Screenshots

## Support

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Docs**: https://docs.github.com
- **DataForSEO Docs**: https://docs.dataforseo.com

Viel Erfolg mit deinem Deployment! 🚀
