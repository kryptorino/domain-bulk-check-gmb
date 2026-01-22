# 🚀 Schnellanleitung: GitHub Upload & Vercel Deployment

## Schritt 1: GitHub Repository erstellen (2 Minuten)

1. Gehe zu https://github.com/new
2. Repository Name: `domain-bulk-check-gmb` (oder einen anderen Namen)
3. Wähle **Public** oder **Private**
4. **NICHT** "Add a README" anklicken (haben wir schon)
5. Klicke auf **Create repository**

## Schritt 2: Code hochladen (1 Minute)

Kopiere die Befehle von der GitHub-Seite, die jetzt angezeigt wird. Sie sehen ungefähr so aus:

```bash
git remote add origin https://github.com/DEIN-USERNAME/domain-bulk-check-gmb.git
git branch -M main
git push -u origin main
```

**Wichtig:** Ersetze `DEIN-USERNAME` mit deinem GitHub Username!

Führe diese Befehle im Terminal aus (im Ordner `/Users/nilshenning/Desktop/app`).

## Schritt 3: Auf Vercel deployen (3 Minuten)

### Via Vercel Website (Einfachste Methode)

1. Gehe zu https://vercel.com/signup
2. Klicke auf **Continue with GitHub**
3. Nach Login: Klicke auf **Add New...** → **Project**
4. Wähle dein Repository `domain-bulk-check-gmb`
5. Klicke auf **Import**
6. Lasse alle Einstellungen so wie sie sind
7. Klicke auf **Deploy**
8. Warte ~2 Minuten
9. ✅ Fertig! Du bekommst eine URL wie `https://domain-bulk-check-gmb.vercel.app`

### Via Vercel CLI (Alternative)

```bash
# Vercel CLI installieren
npm install -g vercel

# Im Projektordner ausführen
cd /Users/nilshenning/Desktop/app

# Deploy starten
vercel

# Fragen beantworten:
# - Set up and deploy? → Yes
# - Which scope? → (dein Account)
# - Link to existing project? → No
# - Project name? → domain-bulk-check-gmb
# - In which directory? → ./
# - Override settings? → No

# Für Production:
vercel --prod
```

## Das war's! 🎉

Deine App läuft jetzt online auf Vercel!

### Wichtig zu wissen:

- **Jeder Git Push** auf GitHub triggert automatisch ein neues Deployment auf Vercel
- Die **URL bleibt gleich**, nur der Code wird aktualisiert
- Du kannst die App jetzt mit anderen teilen

### Nächste Schritte:

1. Teste die App mit deinen DataForSEO Credentials
2. Teile die URL mit deinem Team
3. Erstelle einen Branch für neue Features

### Änderungen später pushen:

```bash
# Dateien ändern...

git add .
git commit -m "Beschreibung der Änderung"
git push

# Vercel deployt automatisch!
```

## Hilfe

Probleme? Siehe [DEPLOYMENT.md](DEPLOYMENT.md) für detaillierte Troubleshooting-Tipps.
