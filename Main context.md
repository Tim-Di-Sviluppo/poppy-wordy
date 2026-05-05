Ruolo: Agisci come un Senior Game Developer esperto in TypeScript e Phaser.js.
Progetto: Poppy Wordy – Un word-shooter minimalista 2D.


1. Struttura della Griglia
Implementa una griglia esagonale invisibile (honeycomb) in tutto lo schermo tranne la parte inferiore dove ci sarà il lanciatore. 8x16 esagoni (ma rendi parametrico per trovare la dimensione perfetta)

Le bolle devono "snappare" (agganciarsi) perfettamente ai centri degli esagoni quando entrano in collisione con la massa esistente o con il soffitto. 

2. Sistema di Lancio "Flick & Curve"
Input: Gestisci il lancio tramite swipe (flick). Calcola il vettore di velocità iniziale in base alla lunghezza e rapidità dello swipe. 

Fisica del Rimbalzo: La bolla rimbalza sui muri laterali restituendo un effetto elastico ma fisicamente soddisfacente. 

3. Sistema di Lettere e Proposizione
Ogni bolla contiene una lettera.

Genera lettere casuali pesate sulla frequenza della lingua italiana (più vocali, meno lettere rare come Z, Q, H).

Mostra nel lanciatore la bolla attuale e un'anteprima della successiva. 

4. Logica Linguistica e Check delle Parole
Dizionario: Dizionario italiano completo (fonte: Aspell-it) caricato in modo asincrono all'avvio tramite un file binario compatto (public/dictionaries/it.dawg). Il file è generato una tantum con lo script Node.js scripts/build-dawg.mjs. Il formato è prefix-delta encoding su lista ordinata. In caso di mancato caricamento, il sistema fa fallback su una mini-lista di parole di emergenza.

Algoritmo di Ricerca: All'impatto di ogni bolla, esegui una ricerca DFS tra le bolle adiacenti (6 vicini) per identificare parole di senso compiuto. Il DFS è potato tramite hasPrefix() (binary search O(log N)) per eliminare precocemente i rami senza soluzioni.

Vincoli: * Lunghezza minima: 3 lettere. * Lunghezza massima: 15 lettere (configurabile in gameConfig.ts → WORD_RULES.maxLength). * Case-insensitive.

Le parole possono snodarsi in qualsiasi direzione nella griglia.

5. Sistema di Eliminazione e Pulizia
Se viene rilevata una parola valida:

Rimuovi le bolle coinvolte con un'animazione di "fade out" o "scale down" pulita.

Gestione Bolle Isolate: le bolle che non fanno parte della parola esplosa scivolano verso l'alto fino a raggiungere la parete. 

Requisiti del Codice:
Codice pulito, commentato e modulare.

Ben evidenzia nel codice le parti la logica della fisica per il fine tuning. 

Le impostazioni relative al dizionario, alla frequenza delle lettere, ecc. devono essere facilmente modificabili e raggruppate in un unico file di configurazione per la lingua giocata

Fornisci una struttura base per gestire il punteggio (senza UI complessa per ora).