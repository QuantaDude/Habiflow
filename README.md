# HabiFlow

A mobile habit tracking app built with React + Tailwind CSS. Log good and bad habits, track streaks on a GitHub-style calendar heatmap, view stats, and optionally sync encrypted data across devices via Supabase.

---

## Getting Started

```bash
npm install
npm run dev
```

The app runs entirely in the browser with no backend required. All data is stored in `localStorage` by default.

---

## Cloud Sync (Optional)

Cloud sync is end-to-end encrypted using AES-256-GCM. Your password is used as the encryption key — the server never sees your plaintext data.
