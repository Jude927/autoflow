# AutoFlow — AI Workflow Generator
> Crafted by Wouassi Jude · CEO of Triple A — AI Automation Agency

## Stack
- **Frontend**: HTML/CSS/JS pur — hébergé sur Netlify
- **Functions**: Netlify Functions (Node.js serverless)
- **AI**: Claude API (claude-haiku) via fonction sécurisée
- **Paiement**: Stripe + Orange Money (validation manuelle)

---

## Déploiement sur Netlify (15 minutes)

### 1. Prépare le dépôt GitHub
```bash
git init
git add .
git commit -m "Initial AutoFlow deploy"
git remote add origin https://github.com/TON_USER/autoflow.git
git push -u origin main
```

### 2. Connecte Netlify
1. Va sur [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
2. Choisis ton dépôt GitHub
3. Build settings :
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
4. Clique **Deploy site**

### 3. Configure les variables d'environnement
Dans Netlify → Site settings → Environment variables, ajoute :

| Variable | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | Ta clé API depuis console.anthropic.com |
| `STRIPE_SECRET_KEY` | Ta clé secrète Stripe (sk_live_...) |
| `SITE_URL` | https://ton-site.netlify.app |
| `ALLOWED_ORIGIN` | https://ton-site.netlify.app |

### 4. Installe les dépendances Stripe
Dans le dossier `netlify/functions` :
```bash
npm init -y
npm install stripe
```

---

## Variables d'environnement locales (dev)
Crée un fichier `.env` à la racine :
```
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
SITE_URL=http://localhost:8888
ALLOWED_ORIGIN=http://localhost:8888
```

Pour tester en local :
```bash
npm install -g netlify-cli
netlify dev
```

---

## Connecter Supabase (auth & base de données)
1. Crée un projet sur [supabase.com](https://supabase.com)
2. Récupère `SUPABASE_URL` et `SUPABASE_ANON_KEY`
3. Ajoute-les en variables Netlify
4. Dans `generate.js`, décommente les lignes Supabase

---

## Structure
```
autoflow/
├── public/
│   └── index.html          ← Interface complète
├── netlify/
│   └── functions/
│       ├── generate.js     ← Proxy Claude API (sécurisé)
│       ├── checkout.js     ← Stripe checkout
│       └── orange-money.js ← OM validation manuelle
└── netlify.toml            ← Config déploiement + sécurité
```

---

## Sécurité implémentée
- Clé API Claude jamais exposée côté client
- Headers de sécurité (CSP, X-Frame-Options, etc.)
- Validation et sanitisation des inputs
- Token de session simple pour l'API
- CORS configuré

---

*AutoFlow — Triple A · AI Automation Agency*
