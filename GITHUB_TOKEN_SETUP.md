# GitHub Personal Access Token erstellen

GitHub erlaubt keine Passwort-Authentifizierung mehr. Du brauchst einen Personal Access Token.

## Schritt 1: Token erstellen (1 Minute)

1. Gehe zu https://github.com/settings/tokens/new
2. **Note**: `domain-bulk-check-gmb` (oder ein anderer Name)
3. **Expiration**: 90 days (oder länger)
4. **Scopes**: Wähle nur **`repo`** (das reicht)
5. Scrolle runter und klicke **Generate token**
6. **WICHTIG**: Kopiere den Token sofort (er wird nur einmal angezeigt!)
   - Sieht aus wie: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Schritt 2: Repository URL aktualisieren

```bash
# Alte URL entfernen
git remote remove origin

# Neue URL mit deinem Username hinzufügen
git remote add origin https://github.com/henningnet/domain-bulk-check-gmb.git
```

## Schritt 3: Push mit Token

```bash
git push -u origin main
```

Wenn nach Username gefragt wird:
- **Username**: `henningnet` (oder dein GitHub Username)
- **Password**: FÜGE HIER DEN TOKEN EIN (nicht dein Passwort!)

## Token für zukünftige Pushes speichern

### macOS (Keychain):
```bash
git config --global credential.helper osxkeychain
```

Beim nächsten Push wird der Token automatisch gespeichert.

### Alternative: Token in der URL speichern (nicht empfohlen)
```bash
git remote set-url origin https://henningnet:DEIN_TOKEN@github.com/henningnet/domain-bulk-check-gmb.git
```

⚠️ **Vorsicht**: Token nicht in Dateien speichern oder mit anderen teilen!

## Fertig!

Nach dem ersten erfolgreichen Push mit Token:
- Zukünftige Pushes funktionieren automatisch
- Token wird sicher in deiner Keychain gespeichert

---

## Alternative: SSH Setup (Fortgeschritten)

Falls du lieber SSH verwenden möchtest:

### 1. SSH Key erstellen
```bash
ssh-keygen -t ed25519 -C "henningnet@googlemail.com"
# Enter drücken für Standardpfad
# Optional: Passphrase eingeben
```

### 2. SSH Key zu GitHub hinzufügen
```bash
# Key in Zwischenablage kopieren
pbcopy < ~/.ssh/id_ed25519.pub

# Oder manuell anzeigen:
cat ~/.ssh/id_ed25519.pub
```

1. Gehe zu https://github.com/settings/ssh/new
2. Title: `MacBook` (oder anderer Name)
3. Füge den Key ein
4. Klicke **Add SSH key**

### 3. Repository URL auf SSH ändern
```bash
git remote set-url origin git@github.com:henningnet/domain-bulk-check-gmb.git
git push -u origin main
```

---

## Troubleshooting

### "Repository not found"
- Stelle sicher, dass du das Repository auf GitHub erstellt hast
- Prüfe den Repository-Namen (Groß-/Kleinschreibung beachten)

### "Permission denied"
- Token hat nicht die richtigen Rechte → Erstelle neuen Token mit `repo` Scope
- Bei SSH: Stelle sicher, dass der Key zu GitHub hinzugefügt wurde

### Token vergessen?
- Erstelle einfach einen neuen Token: https://github.com/settings/tokens/new
