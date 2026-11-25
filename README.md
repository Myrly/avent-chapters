# Livrent 
Livre de l'avent. 

## Build and serve

Livrent builds static pages with EJS at build time. Node.js built-in HTTP serves the generated output locally; no application server framework is required.

```sh
npm install
npm run build
npm run serve
```

The site is available at `http://localhost:4173` by default. Set `PORT` to choose another port. Run unit tests with `npm test`.

The generated `dist/` directory can also be deployed directly to a static hosting provider; Node.js is only required to run the included local HTTP server.

The interface defaults to French. Use the language selector to switch to English; the preference is stored in a one-year browser cookie.

## Concept 
Vous aimez le concept des livres de l'avent ? Un chapitre par jour, une progression au fil du mois de noël. Sauf que, les livres en question ne vous intéressent pas vraiment ? 
Ce site est la solution pour vous : 
Rentrez quelques informations sur le livre (nombre de pages totales à diviser, ainsi que numéro de pages des chapitres, si l'epub est envoyé, alors il n'est pas nécessaire de fournir ces informations), et le découpage se fait pour vous. 
Bonus : uploadez un fichier epub et celui-ci se verra ajouter les marqueurs de découpage automatiquement.
