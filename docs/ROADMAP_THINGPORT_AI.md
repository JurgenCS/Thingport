# Thingport AI — roadmap di implementazione e validazione

**Destinatario:** GPT-6.1 / Codex, eseguito sulla repository di lavoro.  
**Stato:** specifica di progetto, non resoconto di funzionalità già implementate.  
**Repository upstream:** https://github.com/TautvydasDerzinskas/Thingport  
**Approccio:** **upstream-first**, fork con `main` specchio dell’upstream e `develop` come ramo integrato del prodotto; estensioni additive e revisionabili; nessuna seconda applicazione web.  
**Regola di esecuzione:** procedere **una fase alla volta**, con gate di test e resoconto; non sviluppare in anticipo fasi successive.
**Versione di questa specifica:** 2.0 — 12 ottobre 2026; aggiunta strategia Git/upstream, audit dei fork, criteri anti-divergenza e avvio controllato per Codex.
**Priorità operativa immediata:** completare **solo la FASE 0**, in lettura e con aggiornamento del presente documento; nessuna implementazione funzionale.

---

## 0. Missione e principi non negoziabili

Realizzare una libreria personale intelligente di progetti e reference 3D, partendo da Thingport. Il flusso desiderato è: l'utente salva rapidamente un modello nella propria raccolta abituale su MakerWorld; Thingport lo acquisisce attraverso le capacità già esistenti, ne conserva file e metadati quando legittimamente accessibili, lo indicizza, lo classifica in modo non distruttivo e lo rende ricercabile per parole chiave, filtri e significato. L'utente deve poter correggere l'AI senza dover riorganizzare continuamente cartelle.

### Non obiettivi iniziali

- Non creare una nuova estensione Chrome, un nuovo frontend o un database separato: riutilizzare rispettivamente `extension/`, `frontend/`, PostgreSQL/Prisma e `backend/`.
- Non creare un motore di scraping parallelo; non dipendere da endpoint MakerWorld non ufficiali introdotti appositamente. Verificare conformità alle condizioni del servizio e rispettare rate limit, autenticazione e disponibilità.
- Non implementare all'inizio sincronizzazione **bidirezionale** né spostamento o cancellazione automatica di elementi su MakerWorld. La raccolta `Sorted` è un'eventuale funzione futura, da attivare solo dopo una verifica tecnica e legale autonoma.
- Non introdurre API AI a pagamento, chiavi OpenAI o dipendenza operativa da una sessione ChatGPT. GPT-6.1/Codex è usato per **sviluppare** l'applicazione, non è automaticamente il provider AI del prodotto finito.
- Non imporre una singola categoria esclusiva come unico mezzo di recupero; la struttura logica distingue categoria principale, caratteristiche, possibili utilizzi, note personali e collezioni virtuali.
- Non introdurre nuove directory, pacchetti, microservizi, cache, framework o indici se la necessità non è dimostrata.

### Principi di sviluppo

1. **Prima ispezionare, poi modificare.** Verificare codice, database, migration, test, flussi di import e AI già presenti: nessuna implementazione parallela di funzionalità equivalenti.
2. **Una modifica verticale piccola e completa alla volta.** Migrazione/schema (se necessaria), backend, UI minima, test e verifica del flusso.
3. **L'AI propone; il codice valida ed esegue.** L'output AI non è codice, SQL né comando browser: è un oggetto JSON tipizzato e controllato.
4. **Preservare le scelte manuali.** Note, tag e categorie impostate esplicitamente dall'utente prevalgono sempre sui suggerimenti automatici.
5. **Idempotenza e recuperabilità.** Import, classificazione, embedding, riconciliazione e job si possono ripetere dopo crash senza duplicazioni o perdita di dati.
6. **Locale per default.** Nessun contenuto dei modelli, foto o credenziali inviati a servizi AI remoti in assenza di consenso esplicito; Ollama locale è il provider iniziale.
7. **Nessuna cancellazione automatica.** Un modello acquisito rimane in Thingport anche se scompare dalla raccolta sorgente. La pulizia è una decisione esplicita dell'utente.
8. **Upstream-first e fork aggiornabile.** Prima di scrivere codice confrontare la capacità richiesta con quanto esiste in upstream; preferire estensioni e piccoli hook a modifiche invasive; nessuna riscrittura di interi moduli senza una prova di necessità.
9. **Una sola base applicativa.** Backend, frontend, extension, database, job e deployment di Thingport rimangono quelli di Thingport. Ollama è un runtime locale di inferenza, non una seconda libreria/catalogo.
10. **Misurare la divergenza.** Ogni fase esplicita quali file upstream tocca, quanto è invasiva e come resterà integrabile; miglioramenti generici candidati a PR upstream quando maturi.
11. **Nessuna operazione remota implicita.** Codex può analizzare e modificare il checkout locale nelle fasi autorizzate, ma non deve fare push, aprire PR, cambiare default branch su GitHub o accettare merge remoti senza richiesta esplicita.

### Vincoli di organizzazione del repository

- Usare le directory già presenti: `backend/`, `frontend/`, `extension/`, `regression/`, `docs/` e `bridge/` (quest'ultima da lasciare invariata salvo motivo concreto).
- Un solo documento di progetto vivo: `docs/AI_ROADMAP.md` (questo testo, se copiato nel fork). Aggiornare stato, decisioni e risultati **qui**, non in file separati `plan-v2.md`, `summary.md`, `notes.md`, `architecture-new.md`, ecc.
- Se utile all'agente, un unico `AGENTS.md` radice di massimo ~80 righe con istruzioni operative e un link a questa roadmap, solo se non esiste già.
- Nuovi file sorgente solo quando esiste una responsabilità distinta e riutilizzabile: preferire estendere moduli coerenti con quelli esistenti senza creare file monolitici.
- Prima di proporre un file nuovo cercare responsabilità equivalente nel codice upstream e scrivere nella fase: **perché questo file serve**. Non duplicare sistemi di job, servizi HTTP, DTO, config, moduli AI o componenti di ricerca.
- Evitare sia l'esplosione in microfile sia il grande `aiService.ts` con tutto dentro: organizzare per confini effettivi già adottati da upstream. Non imporre un numero arbitrario di file, ma segnalare ogni file nuovo a fine fase.
- Tenere README e documentazione originale dove sono. Aggiornare istruzioni pertinenti *in situ*; questo file è l'unica fonte per roadmap, audit, decisioni e avanzamento.
- Test accanto alla funzionalità, aderendo alle convenzioni del progetto. Riutilizzare fixture e utility esistenti; niente test duplicati per lo stesso comportamento.
- Nessun report di test o snapshot generato deve essere committato se è un artefatto di esecuzione; usare output CI o cartelle ignorate.
- Ogni dipendenza nuova deve avere motivazione nel riepilogo della fase; nessuna dipendenza solo per evitare 20 righe di codice chiaro.
- Eliminare codice morto, migrazioni sperimentali mai usate e file temporanei **solo se creati nel ramo di lavoro** e verificati non necessari; non ripulire indiscriminatamente il codice upstream.

---

## 0A. Contratto di manutenzione del fork (non negoziabile)

### Strategia di branch

Lo schema target è intenzionalmente minimale:

```text
TautvydasDerzinskas/Thingport   (upstream/main)
                │
                ▼
nostro-fork/main                (specchio pulito di upstream/main)
                │
                ▼
nostro-fork/develop             (Thingport + nostre funzionalità)
                ▲
                ├── feat/ai-classification  (temporaneo)
                ├── feat/semantic-search    (temporaneo)
                └── fix/...                 (temporaneo)
```

- `upstream` è il remote del progetto originale; `origin` è il fork dell'utente. Non assumere che siano già configurati: **verificare con `git remote -v`**.
- `main` del fork contiene esclusivamente commit dell'upstream, salvi eventuali interventi deliberati per mantenere il mirror. **Non mettere roadmap, nuove feature, migration o documentazione proprietaria in `main`.**
- `develop` è il ramo di integrazione del prodotto personalizzato, da cui buildare e distribuire il fork. Partire da `main`, quindi creare `develop` *soltanto se non esiste*, senza alterare un ramo di lavoro o modifiche locali preesistenti.
- Le modifiche applicative passano in rami `feat/*` o `fix/*` derivati da `develop`; integrare con PR o merge controllato dopo i gate. Per un singolo sviluppatore si può mantenere la procedura leggera, ma **non modificare direttamente `main`**.
- In caso di disallineamento del fork rispetto allo schema, **non eseguire reset/force push** per imporlo. Segnalare il problema e proporre la migrazione più sicura, richiedendo autorizzazione per operazioni remote.
- Nomi dei rami, workflow CI e branch predefinito effettivi si verificano durante audit; usare questi nomi come target e non come fatto già compiuto.

### Procedura di aggiornamento upstream

1. Su working tree pulito, registrare SHA corrente di `develop`, backup e stato di migrazioni in uso.
2. Consultare changelog, commit e modifiche tra la base upstream precedente e `upstream/main`, identificando cambi a Prisma, contratti API, import/sync, extension, sicurezza, dipendenze e Docker.
3. Eseguire l'aggiornamento **in un ramo locale dedicato**, mai direttamente sull'istanza deployata. Aggiornare `main` solo con fast-forward a `upstream/main` quando possibile; se non è possibile, fermarsi e diagnosticarne la causa.
4. Integrare il nuovo `main` in un ramo derivato da `develop` (preferire `merge` per non riscrivere la storia del fork condiviso), risolvere conflitti funzionali preservando sia i fix upstream sia le nostre estensioni.
5. Eseguire test unitari, integrazione, regression, migrazioni su DB di test, ricerca/classificazione e verifica manuale dei flussi critici MakerWorld prima di integrare in `develop`.
6. Fare rollout soltanto dopo backup DB+storage, verifica reversibilità e autorizzazione al deploy. Non usare `git pull`, `prisma migrate`, `docker compose up` o immagini `latest` sulla produzione alla cieca.

**Esempio diagnostico, non uno script da eseguire indiscriminatamente:**

```bash
git status --short --branch
git remote -v
git fetch upstream --prune
git log --oneline --left-right develop...upstream/main
# Differenza dei commit propri dal mirror: 
git log --oneline main..develop
# Superficie dei cambiamenti propri:
git diff --stat main...develop
git diff --name-only main...develop
```

Dopo un aggiornamento autorizzato, i passi concettuali sono `main` fast-forward a `upstream/main` e merge di `main` verso un ramo temporaneo basato su `develop`. `git push` è sempre un'azione esplicitamente approvata dall'utente, mai automatica.

### Budget di divergenza (qualitativo, verificabile)

Prima di implementare una feature, il piano deve indicare:

| Domanda | Risposta richiesta |
|---|---|
| Si può ottenere con codice upstream già presente? | Percorso/simbolo e motivo del sì/no |
| Possiamo aggiungere una feature senza cambiare i contratti centrali? | Sì/no e trade-off |
| Quali file upstream vanno toccati? | Elenco ristretto e motivazione |
| Servono migrazioni di dati? | Impatto, reversibilità, isolamento in test |
| Cosa succede quando upstream cambia quel modulo? | Strategia di merge/verifica concreta |
| È una correzione utile anche a upstream? | Valutazione per possibile PR, senza inviarla automaticamente |

Preferire integrazione adiacente a moduli originali, feature flag/config opzionali, migrazioni additive, API retrocompatibili e rollback possibile. Evitare grandi refactor di formato, rinomine massive, fork interni di componenti, vendor copy e cambiamenti cosmetici che rendano i diff illeggibili.

### Regole per i contributi upstream

- Bug fix generici, test di regressione e miglioramenti non specifici dell'AI vanno valutati come PR upstream **se separabili senza trascinare il nostro design**.
- Ogni PR upstream deve avere un cambiamento coerente e testato, essere compatibile con la licenza e non includere dati personali, segreti o log. La scelta di aprirla compete all'utente.
- Se un update upstream introduce una funzionalità equivalente alla nostra, analizzare se rimuovere/adattare il codice proprietario; **non mantenere due implementazioni solo perché la nostra esiste già**.

## 0B. Audit dei fork pubblici (ricognizione, non scelta automatica di una base diversa)

Lo scopo è **recuperare miglioramenti isolati**, non diventare dipendenti da un altro fork. Da svolgere nella FASE 0, con accesso in sola lettura.

1. Se `gh` è installato e autenticato, enumerare i fork tramite API GitHub: `gh api --paginate 'repos/TautvydasDerzinskas/Thingport/forks?per_page=100'`. Non supporre che il numero mostrato nella UI coincida con i risultati API accessibili; gestire permessi/rate limit.
2. Per ciascun fork acquisire almeno `full_name`, `default_branch`, `pushed_at` e commit HEAD. Controllare l'effettiva differenza dal parent, non soltanto numero totale di commit, stelle o descrizione README.
3. Per fork con commit distintivi, esaminare diff/patch e test limitatamente alle parti pertinenti (MakerWorld, import e sincronizzazione, file, categorie, AI, ricerca, UI, sicurezza). La sola presenza di un file diverso non prova che la funzione sia nuova o corretta.
4. Segnalare commit/PR/issue utili e comparare con upstream **alla data e SHA rilevati**. Controllare provenienza/licenza di ogni cambiamento prima di riutilizzarlo.
5. Tabella sintetica `fork → commit/delta → funzionalità → qualità/test → rischio merge → decisione (integrare / riferimento / ignorare)`, senza fare merge o cherry-pick durante la FASE 0.
6. Se API o fork non sono accessibili: segnare `NON VERIFICATO`, link ed eventuali limiti; **non inventare risultati, non fermare l'audit tecnico principale** solo per questa mancanza.

**Criterio di integrazione:** solo patch verificata, compatibile e con rapporto beneficio/manutenzione positivo. Preferire richiamare un commit esistente e riscrivere l'interfaccia minima compatibile, se e soltanto se ciò è lecito e realmente più economico da mantenere; non trasportare interi sottosistemi senza motivazione.

## 0C. Politica di compatibilità, qualità e distribuzione

- **Qualità baseline:** riportare sia lo stato upstream verificato, sia i test aggiunti dal fork, distinguendo regressioni preesistenti da errori nuovi. Il merge di una feature richiede test mirati e controlli di lint/typecheck/build pertinenti.
- **CI:** riutilizzare o estendere workflow GitHub Actions esistenti invece di crearne uno parallelo. Valutare guardrail per `develop` e PR `feat/* → develop`; `main` deve conservare il comportamento upstream. Nessun deploy automatico non richiesto.
- **Compatibilità DB:** migrazioni del fork separate e ordinate dopo quelle upstream, con prova su snapshot; eventuali conflitti migration/schema nei merge sono gate bloccanti. Evitare downgrade SQL automatici se distruttivi.
- **Compatibilità frontend/extension:** non cambiare contratti usati dalla versione distribuita dell'estensione senza gestire graceful degradation/versioning. Feature AI opzionali, non requisito per usare Thingport.
- **Tracciabilità:** associare ogni rilascio locale a commit di `develop`, SHA upstream incorporato, versione schema DB e modelli AI/embedding. Tag del fork distinguibili da tag upstream.
- **Manutenzione:** controllare gli aggiornamenti upstream prima di ogni nuova fase maggiore e in occasione delle release; nessun meccanismo che faccia merge non sorvegliati. Annotare solo i delta significativi in questo documento.

---

## 1. Modalità obbligatoria di lavoro per l'agente

### Protocollo per ogni fase

1. Leggere questo file, `README.md`, `CONTRIBUTING.md`, `docs/DEVELOPMENT.md` (se presenti nel checkout), il codice direttamente rilevante e lo stato Git; leggere **anche** la politica upstream dei §§ 0A–0C.
2. Scrivere nel resoconto iniziale: obiettivo, componente upstream riutilizzabile, alternativa a minor diff, file previsti da modificare, test, rischi e superficie di conflitto upstream. Non aprire nuove architetture senza una lacuna dimostrata.
3. Implementare un incremento che sia utilizzabile e verificabile **nella stessa fase**; evitare grandi refactor misti a nuove funzionalità.
4. Eseguire test mirati e controlli di qualità; riportare precisamente comandi, esito e ciò che non è stato testato. Non dichiarare superati test mai eseguiti.
5. Aggiornare la sezione **Registro avanzamento** di questa roadmap in modo conciso (massimo 10 righe per fase: decisioni, file principali, test, blocker e note upstream).
6. Preparare un commit coerente nel ramo feature o indicare esplicitamente perché non è possibile. **Nessun push, PR, deploy, cambio default branch, reset o force push senza autorizzazione**; non committare la FASE 0 salvo esplicito assenso.
7. Fermarsi al gate della fase; **non implementare la fase successiva nella stessa esecuzione**, anche se sembra immediata.

### Criterio di priorità in caso di conflitti

Sicurezza dei dati > rispetto delle condizioni d'uso e della licenza > compatibilità upstream > funzionamento verificato > semplicità architetturale > nuove funzionalità > ottimizzazione prematura.

### Reporting standard

A fine fase fornire: **esito del gate (PASS/FAIL/BLOCKED); cosa funziona concretamente; file creati/modificati; migrazioni e impatto sui dati; test eseguiti con esiti; limitazioni; esatto passo successivo**. Non scrivere relazioni prolisse.

---

## FASE 0 — Audit tecnico e perimetro reale (nessuna modifica funzionale)

**Obiettivo:** capire cosa Thingport implementa già, specialmente nelle parti AI, e quali fork presentano delta interessanti, senza inventare nomi di file o introdurre duplicati. L’audit è in sola lettura, salvo l’aggiornamento delle sezioni apposite di **questo** Markdown.

**Azioni**

- Registrare commit SHA, branch, remoti (`origin`/`upstream`), eventuali commit esclusivi del fork, versione e licenza effettiva del checkout (la pagina upstream consultata il 12/10/2026 dichiara AGPL-3.0); leggere README, documentazione di sviluppo e dell'estensione. Non modificare `.git`/branch senza necessità e permesso.
- Ispezionare struttura reale dei moduli, framework, autenticazione, configurazioni, migrations, gestione file e job schedulati.
- Tracciare il flusso end-to-end: MakerWorld collection → Thingport Grab → API/backend → `CollectionSync` e `ImportJob` → `Print`, `PrintFile`, immagini e `CollectionItem` → UI.
- Verificare la presenza e l'effettivo utilizzo dei campi Prisma già osservati: `CategorySource`, `Print.categorySource`, `Print.aiSuggestion`, `Print.aiRejectedCategoryIds`, `Print.tags`, `Collection.tags`, `CollectionSync`, `ImportJob`, `Print.searchVector`. Determinare se esiste già un provider AI, un classificatore, una configurazione o una revisione suggerimenti attiva.
- Mappare la semantica precisa di `Category` (campo `kind` = `category` o `folder`), `Collection` (molti-a-molti) e tag (array di stringhe): non assimilarli impropriamente.
- Controllare come `MakerWorld` espone effettivamente la raccolta usuale dell'utente (nome/URL/ID, visibilità, dati accessibili): **non presumere che `Default collection` sia una raccolta sincronizzabile**.
- Audit di sicurezza e privacy delle credenziali MakerWorld, dell'estensione e dei log; verificare cosa esegue già la sincronizzazione e le relative limitazioni; nessun tentativo di elusione di protezioni.
- Mappare comandi test, CI, regressioni Playwright e istruzioni per DB isolato. Analizzare se il modulo di ricerca esistente può essere esteso senza sostituirlo.
- Identificare le aree del fork che rischiano conflitti in futuri merge upstream; misurare lo scarto tra la base upstream e `develop` se già presente.
- Eseguire la ricognizione dei fork del § 0B tramite GitHub CLI/API quando disponibili; non importare codice e non cambiare il fork di base.
- Verificare il workflow Git desiderato `main`-mirror/`develop`-prodotto (§ 0A), individuare la via sicura di adozione nel checkout concreto; niente push, reset, checkout distruttivi, creazione/merge remoti.
- Identificare eventuali modifiche dell'upstream recenti che già risolvono parti del problema e decidere se eliminare funzionalità progettate ormai ridondanti.

**Deliverable:** sezione «Audit tecnico» qui sotto compilata con tabella **Esiste / Parziale / Manca** per acquisizione, sync, backup, categorie, AI, tag, ricerca, test, UI e proposta di delta minimo; tabella «Ricognizione fork»; stato Git e piano di sincronizzazione che **non richiede riscrivere `main`**; rischi di conflitto per moduli. Nessuna nuova applicazione o modifica funzionale.

**Gate 0:** sono identificati con percorsi e simboli reali il flusso attuale, il delta minimo e le aree a maggior rischio di merge, insieme a una strategia sicura per `main`/`develop`. La lista completa dei fork può essere `NON VERIFICATA` se il provider non è accessibile; non blocca da sola il gate. In caso contrario fermarsi, motivare il blocco.

---

## FASE 1 — Fork, baseline di sviluppo e sicurezza dei dati

**Obiettivo:** lavorare in un fork riproducibile e facilmente aggiornabile.

**Azioni**

- Usare il fork GitHub dell'upstream, configurare `origin` = fork, `upstream` = originale; verificare branch e stato non committato prima di ogni azione. Applicare esplicitamente il modello **`main` mirror pulito + `develop` prodotto + `feat/*` temporanei**, salvo incompatibilità tecnica reale da segnalare prima di cambiare strategia.
- Predisporre sul fork la protezione da push involontari su `main` e la verifica test/PR verso `develop` quando la configurazione GitHub lo consente. Modifiche a impostazioni remote solo dopo autorizzazione.
- Registrare baseline con `git diff main...develop`, `git log main..develop` e relativo SHA upstream. Alla partenza il delta dovrebbe contenere al più questo documento e infrastruttura minima autorizzata.
- Non creare un nuovo monorepo: la repository è già multi-component. Non trasformarla in npm workspace o turbo senza motivazione.
- Eseguire la procedura ufficiale di sviluppo. Verificare Node richiesto dal checkout, installare dipendenze con lockfile e generare Prisma Client.
- Avviare dev database locale isolato e **test database distinto**, con credenziali solo di sviluppo e cartella storage sacrificabile. Non applicare migration o test sul database personale di produzione.
- Eseguire e annotare build/lint/test baseline prima di fare modifiche.
- Verificare l'estensione come «Load unpacked», distinguendola dall'estensione distribuita sul Chrome Web Store. Mantenere eventuali versioni separate se necessario per non sovrascrivere una configurazione funzionante.
- Controllare secret, cookie, token, `.env`, origini CORS e porte; nessuna esposizione pubblica non necessaria dell'istanza locale o di Ollama.
- Predisporre procedura di backup e restore provata per PostgreSQL **e** file storage, insieme, prima di import massivi.
- Nelle distribuzioni compilare immagini dal fork o usare immagini costruite da quel commit: **non utilizzare `latest` upstream per eseguire schema e codice personalizzati**.
- Controllare che l'update upstream possa essere simulato su un ramo provvisorio con conflitti visibili e test successivi, senza toccare il deployment. Nessuna sincronizzazione automatica senza revisione.

**Baseline suggerita** (verificare i comandi sul checkout):

```bash
npm run format:check
npm --prefix backend run lint
npm --prefix backend run build
npm --prefix frontend run verify
npm --prefix extension run verify
# Backend tests: eseguirli SOLO con DATABASE_URL impostato
# esplicitamente verso un database di test sacrificabile,
# e FILE_STORAGE impostato verso uno storage di test.
# Eseguire regression/run.sh secondo docs/DEVELOPMENT.md.
```

**Gate 1:** istanza avviabile, account di test, extension locale collegata, suite baseline con esiti registrati; copia di sicurezza verificata e almeno un ripristino di prova; `main` verificabilmente pulito, `develop` utilizzato come ramo di lavoro e procedura di aggiornamento upstream ripetibile. Nessun cambiamento funzionale obbligatorio.

---

## FASE 2 — Acquisizione MakerWorld affidabile e non distruttiva

**Obiettivo:** confermare il percorso reale dell'utente, prima di investire nell'AI.

**Scenario:** «Salvo un modello nella raccolta abituale MakerWorld; in seguito lo ritrovo in Thingport con i relativi file e metadati».

**Azioni**

- Creare una piccola raccolta MakerWorld dedicata ai test contenente modelli che sia consentito importare, senza usare collezioni personali critiche.
- Con Thingport Grab, attivare `Keep this collection in sync` se supportato sulla raccolta testata; confermare che i nuovi elementi vengano importati automaticamente al successivo check. Verificare anche il comando manuale `Sync now`.
- Se `Default collection` non è supportata o non è una collection standard, registrarlo come differenza del prodotto e valutare un'alternativa **in ordine di semplicità**: raccolta Inbox esplicita; azione di import manuale dall'estensione già presente; integrazione con funzionalità ufficialmente supportate. Non costruire un rilevatore browser di salvataggi o nuove API private prima della verifica di compatibilità e conformità.
- Riutilizzare la deduplicazione `sourceProvider` + `sourceExternalId` presente in `Print`, verificando anche il caso di record già importato da altre raccolte. Evitare doppi file e doppia classificazione; preservare correttamente le membership di collezione.
- Distinguere **importazione del modello** da **disponibilità effettiva di tutti i print profile e file**. Tracciare per ciascun modello se metadati, immagini e file desiderati sono realmente presenti; non chiamare «archiviato» un link privo di file.
- Verificare rate limit, sessione scaduta, pagina rimossa, payload parziale, download fallito, riavvio del server, file grande, import interrotto e duplicati.
- Implementare solo le correzioni strettamente necessarie; privilegiare gli errori e la retry policy dei job esistenti.
- **Non modificare MakerWorld** in questa fase. Soprattutto non spostare modelli dalla Default a `Sorted`: l'archivio Thingport è indipendente e additivo.

**Test minimi**

1. Import singolo e sincronizzazione di un nuovo modello.
2. Due sync consecutive con stesso contenuto: nessuna duplicazione di record o membership.
3. Stesso modello nella sorgente e in un'altra collezione Thingport: preservazione delle associazioni.
4. Riavvio durante elaborazione: recupero coerente.
5. Autenticazione mancante/scaduta e provider indisponibile: errori leggibili, nessuna perdita locale.
6. Rimozione da raccolta sorgente: il modello locale rimane.
7. Il file recuperato è accessibile tramite Thingport anche se la sorgente non lo è più, per un caso di test controllato.

**Gate 2:** il flusso «salva → importa → conserva» funziona su un set di test realistico, ed è idempotente. Eventuali limitazioni su Default Collection documentate prima di procedere.

---

## FASE 3 — Semantica dei dati, governance della tassonomia e note personali

**Obiettivo:** separare la classificazione fisica dei modelli dai motivi per cui sono interessanti.

**Dimensioni richieste**

- **Identità:** provider, ID esterno, autore, URL, file disponibili, stato archivio.
- **Tipologia:** contenitore, supporto, componente meccanico, utensile, elemento decorativo, ecc.
- **Caratteristiche:** modulare, impilabile, snap-fit, print-in-place, parametricamente adattabile, ecc.
- **Contesto d'uso:** laboratorio, mercatini, organizzazione, elettronica, reference meccanica, ecc.
- **Motivazione personale:** testo inserito dall'utente su **perché** ha salvato quel design; non inventabile dall'AI.
- **Provenienza della classificazione:** manuale, regola, AI, eredità upstream; livello di revisione.

**Azioni**

- Audire le colonne già esistenti (`Print.tags`, `Print.notes`, `Print.categoryId`, `Print.categorySource`, `Print.aiSuggestion`, `CollectionItem`, ecc.) e usarle prima di aggiungere tabelle.
- Disegnare in massimo una pagina di questa roadmap una matrice «dato → tabella/campo attuale → eventuale estensione motivata».
- Preservare i tag manuali: se serve distinguere tag generati da tag dell'utente, utilizzare il più piccolo dato strutturato supplementare possibile; non sovrascrivere l'array senza provenienza.
- Definire una tassonomia iniziale **limitata** e modificabile: categoria principale e vocabolari controllati per tipologia/caratteristiche/contesto. Niente creazione autonoma di nuove categorie produttive nel MVP. Nuove etichette solo come suggerimento in review.
- Definire sinonimi (`incastro`, `snap-fit`, `clip`; termini inglesi/italiani) con un nome canonico per il filtro, ma mantenendo il testo originale per la ricerca.
- Definire precedence: classificazione manuale > correzione approvata > regola esplicita > predizione AI; `rejectedCategoryIds` e analoghi feedback devono essere rispettati.
- Aggiungere, solo se manca, una nota facoltativa «Perché mi interessa» in un campo dedicato o semanticamente non ambiguo. La sua assenza significa **sconosciuto**, non «nessun motivo».
- Conservare la distinzione tra tag multi-valore e `Category` single-value per evitare che una categoria fisica diventi requisito di tutte le ricerche.

**Test:** gerarchie e filtri esistenti invariati; conservazione tag manuali; note modificabili; sinonimi normalizzati; nessuna nuova categoria senza approvazione; migration up e ripristino verificati su backup del DB di test.

**Gate 3:** il sistema può rappresentare un progetto con più caratteristiche e usi senza duplicare il progetto o moltiplicare le categorie.

---

## FASE 4 — Pipeline deterministica, revisione e stato di elaborazione (senza AI)

**Obiettivo:** stabilizzare il comportamento prima di aggiungere inferenza non deterministica.

**Azioni**

- Definire evento di ingresso dal flusso import esistente e una pipeline con stati `pending`, `running`, `completed`, `needs_review`, `failed` (adattare alle convenzioni reali, non duplicare se già presenti).
- Identificare in maniera stabile `userId + printId + processorVersion + contentFingerprint`; una riesecuzione sullo stesso input e sulla stessa versione è no-op, salvo comando esplicito `reprocess`.
- Definire fingerprint solo sugli input significativi (titolo, descrizione, tag sorgente, eventuale nota, immagini secondo disponibilità); niente ri-elaborazione per cambiamenti irrilevanti come `viewCount`.
- Preparare un classificatore **deterministico** basato su regole esplicite e un `mock` AI provider che restituisce JSON fisso: entrambi passano attraverso la stessa validazione e lo stesso salvataggio dei suggerimenti.
- Separare chiaramente **suggerimento**, **approvazione**, **applicazione** e **rifiuto**. La prima iterazione deve essere `suggest-only` o dry-run; nessuna modifica permanente alla struttura dell'utente senza gate.
- Definire gestione retry con backoff limitato, timeout, riavvio, concorrenza controllata, errore persistente e operazione manuale `Retry`. Riutilizzare infrastruttura esistente dove appropriato, senza sovraccaricare semanticamente `ImportJob` se risulta inadatto.
- Validare `userId` in ogni lettura e scrittura, ed evitare che due elaborazioni contemporanee applichino risultati stantii dopo una correzione manuale (con versioning/controllo aggiornamento).
- Registrare dettagli diagnostici essenziali (stato, durata, causa errore, versione modello) senza loggare cookie, password, interi prompt sensibili né payload dei file.

**Test:** idempotenza, duplicati, restart worker, retry, 2 worker concorrenti, input malformato, aggiornamento manuale durante processing, segregazione fra utenti, riprocesso quando cambia il fingerprint, rollback/reject.

**Gate 4:** la pipeline funziona end-to-end con provider fittizio, è deterministica nelle transizioni e non modifica dati manuali.

---

## FASE 5 — AI locale per comprensione e classificazione

**Obiettivo:** far interpretare i progetti da un modello locale senza costi API per richiesta.

**Provider iniziale:** Ollama locale tramite protocollo HTTP ufficialmente supportato. Servizio di inferenza tecnicamente distinto dal backend, ma nessuna nuova UI/app di gestione, nessuna infrastruttura SaaS. La soluzione deve funzionare con AI disattivata.

**Azioni**

- Audire prima ogni classificatore AI già presente in Thingport: adattarlo o sostituirne **solo** il provider, preservando contratti e feedback esistenti.
- Configurazione essenziale: `enabled`, endpoint locale ammesso, modello, timeout, limite concorrenza, politica di reprocess. Default disattivato se non configurato. Non aprire Ollama su Internet.
- Introdurre un'interfaccia AI minima, ad esempio `analyzeModel(input) -> validatedSuggestion`; non costruire un framework astratto con più adapter inutilizzati.
- Costruire input da titolo, descrizione, tag sorgente, autore, eventuali dati print profile e nota personale. **Fase 5A: solo testo**. L'AI non deve pretendere di aver osservato forma/dimensioni/materiale se i dati non le forniscono.
- Valutare multimodale **solo in fase 5B**, su 20–30 esempi in cui il testo è insufficiente: usare una o poche immagini già presenti e un modello vision realmente supportato dall'ambiente locale; evitare copie persistenti delle immagini.
- Output JSON con schema rigoroso (esempio concettuale, da adattare ai dati reali): `summary_it`, `objectType`, `features[]`, `suggestedContexts[]`, `primaryCategoryId|null`, `confidence`, `uncertainties[]`, `reasonShort`, `evidence`, `processorVersion`. Ogni categoria proposta deve esistere davvero nell'account; eventuali nuove categorie diventano soltanto candidati.
- Imporre limiti di lunghezza, enum/categorie consentite, numero massimo di tag, deduplica sinonimi e validazione forte. Se risposta non valida: retry limitato e `needs_review`, non inventare un risultato.
- Consentire `suggest-only`, approvazione e rifiuto; soglie iniziali **da calibrare, non trattare come probabilità affidabili** (es. >=0,85 proposta ad alta fiducia, 0,60–0,85 revisione, <0,60 non applicare). **Nessuna autoapplicazione al lancio**.
- Motivazione personale: il motore può suggerire usi plausibili, ma deve etichettarli come **possibili**; il campo «perché l'ho salvato» rimane una dichiarazione dell'utente.
- Memorizzare versione modello, schema output, fingerprint e data analisi per sapere cosa rivalutare se in futuro il modello cambia.
- Se Ollama non è disponibile, l'import continua normalmente e l'elaborazione rimane rinviabile; interfaccia sempre utilizzabile.

**Valutazione**

- Preparare un piccolo dataset personale **versionato in modo minimale**: 50–100 progetti diversi, con label attese controllate manualmente (tipologia e caratteristiche), e 10–20 casi ambigui; evitare immagini/file di terzi nel repo quando non autorizzati (usare fixture sintetiche o metadati minimi).
- Misurare: accuratezza top-1/top-3 per categoria, precisione dei tag, percentuale di proposte fantasiose, tasso di revisione, latenza mediana e p95, RAM, velocità e percentuale errori.
- Confrontare almeno un modello locale leggero e uno più capace **solo se l'hardware lo permette**; registrare hardware e versioni. Non scegliere il modello per fama o benchmark generalista.

**Gate 5:** almeno 50 progetti analizzati, output validati, correzioni preservate, funzionalità disponibile anche con AI offline, metriche riportate; abilitazione automatica solo se la qualità viene giudicata adeguata sul dataset. Il criterio assoluto iniziale è **zero sovrascritture di modifiche manuali**.

---

## FASE 6 — Indicizzazione e ricerca semantica/ibrida

**Obiettivo:** cercare per concetto («incastri senza viti») oltre al titolo e ai tag.

**Azioni**

- Mantenere e riutilizzare la ricerca PostgreSQL full-text esistente (`Print.searchVector` e indici) invece di sostituirla.
- Definire il **testo indicizzabile** con pesi distinti: titolo, descrizione, autore, tag, riepilogo AI, caratteristiche, contesti, nota personale. Non mescolare motivazione certa con ipotesi AI senza conservarne l'origine.
- Usare modello di embedding locale, indipendente dal modello generativo e identificato da `modelId`, dimensione effettiva e `embeddingVersion`. Modello e dimensione devono essere verificati **in esecuzione**, non assunti.
- Prima decisione tecnica obbligatoria: verificare volume previsto e disponibilità `pgvector`. L'upstream distribuisce PostgreSQL 16 Alpine standard: `pgvector` **non va dato per già installato**. Per dataset piccoli è accettabile un MVP con vettori salvati in PostgreSQL e ranking in Node con limite documentato; oltre una soglia giustificata da benchmark, usare l'estensione PostgreSQL `pgvector` con immagine e migration esplicite, senza introdurre un secondo database o un servizio vettoriale.
- Se si adotta `pgvector`, valutare compatibilità dell'immagine, deploy/migration su test, indice e ricerca `userId` scoped, query parametrizzate; Prisma può richiedere migration SQL e/o tipo `Unsupported`, da verificare con la versione corrente.
- Calcolare embedding una volta per ciascuna versione significativa del contenuto; riuso/caching e reindex sicuro quando cambia modello. Job interrompibili e riprendibili, con progress per 1.000+ modelli.
- Realizzare endpoint **ibrido**, mantenendo operativa la ricerca tradizionale: ricerca lessicale + vettoriale + filtri esistenti (tag, autore, categorie, collezioni) e autorizzazioni. Aggregare i risultati con una funzione semplice e documentata, per esempio rank fusion; usare un tie-break stabile.
- Mostrare per ogni risultato perché compare, quando possibile: match su titolo, tag, nota oppure affinità semantica. Non simulare una spiegazione «razionale» che il ranking non ha prodotto.
- Failover: se il servizio embedding è offline, usare full-text; se un modello non ha vettore, non scompare dalla ricerca. Nessun invio di query verso servizi cloud impliciti.
- Aggiungere «ricerche salvate» e raccolte virtuali **solo dopo** la ricerca funzionante; inizialmente una raccolta virtuale può essere una query + filtri memorizzati, senza creare copie o assegnare nuovi tag.

**Benchmark e test**

- Usare 25–40 query reali, comprese parafrasi italiane, titoli inglesi, sinonimi, oggetti multifunzione e richieste senza corrispondenze; definire a mano i modelli rilevanti.
- Misurare Recall@5, MRR@10, miglioramento rispetto al solo full-text, p50/p95 con 100, 1.000 e 5.000 modelli (questi ultimi possono essere fixture sintetiche); documentare risultati, non affermare percentuali inventate.
- Autorizzazione multiutente, filtri, paginazione, ordinamento deterministico, query vuota, Unicode, HTML, SQL injection, crash embedding, modello cambiato, embedding incompleti.

**Gate 6:** su query semanticamente difficili la ricerca ibrida batte quella solo lessicale nel dataset definito; full-text e filtri non regrediscono; nessun servizio di ricerca esterno, nessuna fuga fra account.

---

## FASE 7 — UX minima, correzioni e raccolte virtuali

**Obiettivo:** minimizzare il numero di decisioni quotidiane richieste all'utente.

**Interfaccia**

- Conservare layout, navigazione, componenti e design system di Thingport. Non rifare dashboard/sidebar né creare una pagina AI separata se basta una sezione nella libreria esistente.
- Nella scheda modello mostrare: «Che cos'è», «Caratteristiche», «Possibili contesti», «Perché l'ho salvato» (nota opzionale), stato archivio e indicazione della provenienza AI/manuale dei suggerimenti.
- Fornire una coda di revisione compatta per suggerimenti incerti: approva, modifica, rifiuta, ignora. Batch approve solo per suggerimenti già valutati, con anteprima e undo.
- La ricerca deve avere un solo campo visibile per testo libero, con filtri facoltativi; distinguere «Ricerca in tutti i modelli», «Elementi da rivedere», «Raccolte virtuali» senza duplicare la navigazione.
- Consentire la correzione della tipologia, l'aggiunta/rimozione di caratteristiche e contesti, e un campo personale che l'AI non sovrascrive.
- Da una query persistente creare una raccolta virtuale che si aggiorna quando arrivano nuovi progetti. Non ricopiare o spostare i record fisici.
- Consentire in preferenze: `AI disattivata`, `solo suggerimenti`, `automatica per campi non manuali` **solo dopo** valutazione di affidabilità e conferma esplicita.

**Apprendimento dalle correzioni**

- MVP: memorizzare feedback deterministico (mapping, sinonimi, category reject, override manuale), senza fine-tuning. Riutilizzare `aiRejectedCategoryIds` e lo stato presente, ove applicabile.
- Non generalizzare una singola correzione a tutti i modelli simili in modo distruttivo: proporre una regola riutilizzabile, eventualmente confermata dall'utente.
- Il feedback deve influenzare future proposte senza far cambiare silenziosamente modelli già approvati.

**Test:** flow da keyboard/mouse, stati loading/error, accessibilità minima, nessuna scelta obbligatoria durante il salvataggio, approvazione/rifiuto/undo, paginazione recensioni e visualizzazione coerente dopo refresh.

**Gate 7:** utente salva su MakerWorld senza scegliere cartella; ritrova l'oggetto tramite ricerca per significato e può correggere rapidamente il risultato, senza duplicazione delle raccolte.

---

## FASE 8 — Robustezza, backup, upstream e rilascio controllato

**Obiettivo:** passare da prototipo a soluzione usabile nel tempo.

**Azioni**

- Eseguire test di integrazione reali su dataset rappresentativo; abilitare cron/sync solo dopo l'esito delle fasi precedenti.
- Stress-test import e reindex con 1.000+ modelli sintetici/metadati consentiti; limite concorrenza, banda, RAM, storage e tempi.
- Audit sicurezza: permission extension, session cookie, secret, token, origini remote, sanitizzazione contenuti terzi, protezione SSRF delle URL server-side, isolamento multiutente, rate limit e log.
- Backup: dump database + directory storage + eventuali configurazioni; prova di restore su nuova istanza; verificare che file, membership, review e indici siano ricostruibili. Le rappresentazioni AI devono poter essere rigenerate da sorgenti locali senza riscaricare tutto.
- Deploy su immagine del fork con tag immutabile/SHA; prova migrazione da copia di database precedente; rollback documentato; attenzione alle migration irreversibili e alle modifiche dell'immagine Postgres se pgvector adottato.
- Test di aggiornamento upstream su branch separato, usando preferibilmente merge controllato secondo § 0A, risolvendo conflitti, rieseguendo tutte le suite. Mai fare pull alla cieca sull'istanza funzionante.
- Confermare su una release concreta che `main` rimanga specchio upstream, `develop` sia costruibile dal proprio commit e l'elenco dei cambiamenti propri sia spiegabile tramite diff, senza duplicazione di componenti.
- Separare bug fix candidabili a PR upstream, mai inviare automaticamente; registrare eventuali parti della nostra implementazione ormai sostituibili da capacità native upstream.
- Verificare adempimenti AGPL-3.0-only quando si redistribuisce o si mette il servizio a disposizione di altri utenti attraverso una rete.
- Produrre una sezione operativa nel README esistente: attivazione sync, AI locale, limiti, disattivazione, backup, recovery, comandi essenziali. Evitare un nuovo manuale di 50 pagine.

**Gate 8:** flusso completo ripetibile su istanza pulita, backup/restoring e upgrade provati, nessuna perdita/modifica automatica indesiderata, performance e limiti osservati, istruzioni sufficienti per manutenzione ordinaria; merge di aggiornamento upstream simulato con successo e storia Git del fork chiaramente separata.

---

## Test trasversali obbligatori

### Matrice di regressione

| Area | Casi che devono sempre rimanere funzionanti |
|---|---|
| Ingestione | Import singolo, collezione, retry, dedup, stampa/profili e file |
| Sincronizzazione | Incrementale, no delete, provider offline, autenticazione scaduta |
| Catalogo | Modifica manuale, categorie/cartelle, tag, collections, autore |
| Classificazione | Suggest-only, reject, override manuale, invalid JSON, reprocess |
| Ricerca | Lessicale, semantica, ibrida, sinonimi, filtro, utenti separati |
| File | File presenti, preview, download, import incompleto, storage offline |
| Resilienza | Restart durante job, idempotenza, dati obsoleti, restore |
| Estensione | Browser supportati, background worker, permessi, nessun secret nel log |
| Compatibilità upstream | Diff contenuto, merge in ramo di prova, suite dopo merge, compatibilità migration/extension |

### Regole sui test

- Unit test sulle trasformazioni pure: normalizzazione, schema JSON, regole, rank fusion, fingerprint e precedenze.
- Test integrazione backend con DB di **test** separato per migrazioni, autorizzazioni, job, dedup e ricerca.
- Regressione end-to-end Playwright soltanto per percorsi critici: un flusso principale per salvataggio/import, review, ricerca e restore; evitare duplicazioni dei casi a livello UI.
- Test AI ripetibili usando **mock** deterministico nella CI. I test di qualità con Ollama reale sono benchmark separati, con modelli versionati e metriche, non test CI flakey.
- Registrare il comando effettivo e l'esito di ogni suite; il successo di `test:run --passWithNoTests` **non prova l'esistenza di test frontend**.
- Non far girare i test backend sul DB di sviluppo: le istruzioni upstream indicano che possono modificarlo.

---

## Decisioni architetturali da prendere solo dopo benchmark

1. **AI già presente:** riuso o estensione delle strutture esistenti? Motivare con riferimenti al codice, non per preferenza stilistica.
2. **Tag AI:** usare array attuali + metadati di provenienza o una tabella specializzata? Scegliere il minimo sufficiente per preservare gli override.
3. **Embedding:** per dataset previsto e benchmark locale, ranking in-process o `pgvector` nel PostgreSQL esistente? Misurare latenza e complessità del deployment.
4. **Vision:** la differenza di qualità rispetto a text-only giustifica risorse, latenza e consumo? Non abilitarla automaticamente.
5. **Autoapplicazione:** metriche sufficienti e possibilità di annullare modifiche? Iniziare sempre da `suggest-only`.
6. **Default Collection:** è veramente osservabile dal sync ufficialmente supportato? Altrimenti usare una Inbox esplicita e documentare il compromesso.
7. **Futuro `Sorted` MakerWorld:** rimandare a una fase post-MVP separata, solo dopo studio dei rischi, delle autorizzazioni e della reversibilità; non necessario al successo del prodotto.

---

## Risultato finale desiderato: criteri di accettazione end-to-end

1. L'utente salva normalmente una reference su MakerWorld in una raccolta riconosciuta dal sistema, senza annotazioni obbligatorie.
2. Thingport acquisisce il progetto tramite l'integrazione esistente, senza generare duplicati.
3. Quando i file sono disponibili e importabili, il sistema li conserva localmente; segnala chiaramente eventuali download mancanti.
4. Il modello è analizzato localmente e produce suggerimenti multi-facet coerenti; la motivazione soggettiva rimane modificabile esclusivamente dall'utente.
5. Una correzione manuale non viene mai sovrascritta in import, reprocess o upgrade.
6. L'utente trova un oggetto cercando «sistema a incastro per fissare qualcosa senza forare», anche se titolo e tag non contengono quelle parole.
7. La stessa ricerca può essere salvata come collezione virtuale; i modelli aggiunti in seguito vi compaiono senza spostamenti manuali.
8. In caso di AI offline, backup/restore, riavvio o sorgente non più disponibile, la libreria mantiene i dati acquisiti e la ricerca testuale continua a funzionare.
9. Il progetto rimane una sola applicazione Thingport modificata nel fork, con architettura leggibile, test e possibilità concreta di aggiornarsi dall'upstream.
10. Il ramo `main` resta allineabile con fast-forward a `upstream/main`, mentre `develop` include le nostre estensioni e può essere aggiornato mediante merge testato; nessun aggiornamento modifica automaticamente i dati personali o sovrascrive correzioni manuali.
11. A ogni feature possiamo spiegare quali elementi sono nativi e quali sono nostri, ed elencare i file upstream toccati senza dover navigare una seconda applicazione o un secondo repository.

---

## Audit tecnico (compilare nella FASE 0)

| Funzione | Esito: esiste/parziale/manca | Percorso codice | Delta minimo |
|---|---|---|---|
| Import MakerWorld | Da verificare nel checkout | — | — |
| Extension Grab | Da verificare nel checkout | — | — |
| Collection sync | Da verificare nel checkout | — | — |
| Conservazione file | Da verificare nel checkout | — | — |
| Categorie/collection/tag | Da verificare nel checkout | — | — |
| Classificazione AI esistente | Da verificare nel checkout | — | — |
| Correzioni/rifiuti | Da verificare nel checkout | — | — |
| Ricerca full-text | Da verificare nel checkout | — | — |
| Test backend/frontend/extension | Da verificare nel checkout | — | — |
| Regressione Playwright | Da verificare nel checkout | — | — |

## Ricognizione fork (compilare nella FASE 0)

| Fork e SHA | Delta rispetto a upstream | Aspetto utile e test | Integrazione / riferimento / ignorare | Verificabilità |
|---|---|---|---|---|
| Da enumerare, nessuna conclusione precompilata | — | — | — | NON VERIFICATO |

**Nota:** una descrizione su GitHub o un numero di commit non è prova di funzionalità realmente sviluppate nel fork. Non precompilare risultati sulla base di congetture o analisi precedenti non riproducibili.

## Compatibilità upstream (compilare e mantenere)

| Voce | Stato |
|---|---|
| SHA e data base upstream | Da verificare |
| Origin del fork / upstream remote | Da verificare |
| Stato `main` mirror | Da verificare |
| Stato `develop` e divergenza | Da verificare |
| Moduli upstream a rischio conflitto | Da verificare |
| Prossimo aggiornamento upstream: test richiesti | Da verificare |
| Feature del fork candidabili a PR upstream | Nessuna prima dell'implementazione |

## Registro avanzamento (aggiornare qui, NON generare file di diario)

- **Fase corrente:** 0 — non avviata.
- **Commit base / branch / SHA upstream:** da compilare.
- **Diff fork vs upstream:** da compilare (nessuna modifica funzionale ancora autorizzata).
- **Decisioni principali:** da compilare.
- **Suite baseline e risultato:** da compilare.
- **Blocchi:** nessuno noto prima dell'audit; nessuna implementazione effettuata da questo documento.

---

## Prompt operativo iniziale da impartire a GPT-6.1 (copiare in Codex)

> Agisci come maintainer di un fork di Thingport, non come autore di una nuova applicazione. La nostra priorità è restare vicini all'upstream e aggiungere **solo** classificazione intelligente, ricerca semantica e UX strettamente necessaria.
>
> Leggi **integralmente** `docs/AI_ROADMAP.md` — incluse le sezioni 0A, 0B, 0C — poi `README.md`, `CONTRIBUTING.md`, `docs/DEVELOPMENT.md` e la documentazione dell'estensione se presenti. Verifica lo stato corrente del checkout prima di agire: `git status`, branch, commit SHA, `git remote -v` e differenze da upstream; verifica invece di presumere nomi di branch, percorsi o file.
>
> **Questa esecuzione è limitata alla FASE 0.** Esegui una ricognizione tecnica *in sola lettura* dell'architettura reale, schema Prisma, AI eventualmente già esistente, search, import/sync MakerWorld, storage, extension, test e deployment. Identifica il delta minimo che ci separa dal prodotto desiderato. Esamina i fork pubblici via GitHub CLI/API se accessibile e riporta soltanto differenze documentate da commit e codice; se l'accesso è impossibile, segnalo come NON VERIFICATO e prosegui sull'audit del repository.
>
> Proponi esplicitamente come mantenere `main` quale mirror di upstream e `develop` quale ramo delle nostre funzionalità, adattandoti allo stato reale del fork senza operazioni distruttive. Identifica aree di conflitto, miglioramenti genericamente proponibili upstream e modalità di test/merge sicuro.
>
> Non implementare feature, non introdurre dipendenze o migration, non creare altri report, file `AGENTS.md`, directory o nuove applicazioni. **Puoi modificare soltanto le tabelle Audit tecnico, Ricognizione fork, Compatibilità upstream e Registro avanzamento già esistenti in questa roadmap.** Non eseguire push, PR, deploy, reset/force push, modifica branch remoti né commit; non modificare `.env` o database. Se alcune verifiche non sono disponibili, descrivi il limite senza inventare prove.
>
> Al termine presenta: (1) tabella Esiste/Parziale/Manca con riferimenti ai file, (2) fork utili verificati e motivi, (3) top 5 rischi di manutenzione, (4) proposta di delta minimo, (5) esito PASS/FAIL/BLOCKED del Gate 0 e passo concreto verso la FASE 1. **Fermati. Non procedere senza una mia istruzione esplicita.**
