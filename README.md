# Site Renaissance Roleplay — version 2 (24/10/2026)

Deuxième maquette, plus sobre que la première (`../site-renaissance`, laissée telle quelle) :
typographie Inter Tight / Inter / JetBrains Mono, fond noir, un seul accent violet, visuels = **vraies captures
en jeu** des cristaux du Chiliad (interface du jeu retirée), aucune planche de BD.

Effets du haut de page (tous dans `app.js`, rien en vidéo) :
- **pluie en profondeur** : trois couches (loin fine et lente, milieu, près longue et floue), vent avec rafales ;
- **orage** : éclair fractal ramifié (cœur blanc + halo), courbe d'intensité d'un vrai coup de foudre
  (traceur, arc principal, réamorçages), la scène entière s'éclaire (image surexposée en fondu), éclairs de nuage
  sans trait visible ; un éclair tous les 7 à 17 s, jamais derrière le texte sur grand écran ;
- **son** (bouton « Son », coupé par défaut) : pluie et tonnerre synthétisés, délai et grave selon la distance ;
- brume qui dérive, grain de pellicule léger. Tout s'arrête si le visiteur a demandé « moins d'animations ».

Liens : objet `LIENS` en haut de `app.js` (Discord : https://discord.gg/K6rYRdWQD).

À publier : `index.html`, `style.css`, `app.js`, `images/`. Pas `outils/`.

Prévisualiser : config « site-renaissance-v2 » de `.claude/launch.json` → http://localhost:8788/
Modes de test : `?orage` (éclairs toutes les 1,8 s), `?orage=fige` (image arrêtée au pic d'un éclair),
`?capture` (page entière figée pour une capture d'écran).

Images : `outils/recadrer.py` (Blender, sans fenêtre) recadre une capture et l'enregistre en WebP.
