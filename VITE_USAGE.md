# Vite Workflow

## Einmalig

```bash
npm install
npm run setup:vite-pages
```

## Entwicklung

```bash
npm run dev
```

## Build fuer Upload

```bash
npm run build
```

Die fertigen Dateien fuer den Webspace liegen danach im Ordner `dist/`.

## Struktur

- `src/pages`: Seitenquellen (mit Include-Tags)
- `src/partials/header.html`: gemeinsamer Header
- `src/partials/footer.html`: gemeinsamer Footer
- `dist`: fertige Build-Ausgabe
