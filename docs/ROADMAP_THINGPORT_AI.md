# Thingport AI — roadmap di implementazione e validazione

**Destinatario:** GPT-6.1 / Codex, eseguito sulla repository di lavoro.  
**Stato:** specifica di progetto, non resoconto di funzionalità già implementate.  
**Repository upstream:** https://github.com/TautvydasDerzinskas/Thingport  
**Approccio:** **upstream-first**, per portare aggiornamenti e implementazioni upstream nel fork con il minimo conflitto. Il flusso è upstream → fork: non verranno aperte pull request verso il repository upstream. `main` resta specchio dell’upstream e `develop` il ramo integrato del prodotto; estensioni additive e revisionabili; nessuna seconda applicazione web.

**Regola di esecuzione:** procedere **una fase alla volta**, con gate di test e resoconto; non sviluppare in anticipo fasi successive.
**Versione di questa specifica:** 2.1 — 13 ottobre 2026; chiarita la manutenzione upstream → fork senza PR verso upstream; audit, validazioni e blocker del Gate 2 aggiornati.
**Priorità operativa immediata:** chiudere il **Gate 2** con una raccolta MakerWorld dedicata; verifiche controllate della FASE 2 eseguite, verifica reale ancora pendente. FASE 3 e successive non avviate; AI disattivata.

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
10. **Misurare la divergenza.** Ogni fase esplicita quali file upstream tocca, quanto è invasiva e come resterà integrabile; mantenere i miglioramenti generici separabili per facilitare gli aggiornamenti upstream nel fork, senza proporli tramite PR upstream.
11. **Nessuna operazione remota implicita.** Codex può analizzare e modificare il checkout locale nelle fasi autorizzate, ma non deve fare push, aprire PR interne al fork, cambiare default branch su GitHub o accettare merge remoti senza richiesta esplicita.

### Vincoli di organizzazione del repository

- Usare le directory già presenti: `backend/`, `frontend/`, `extension/`, `regression/`, `docs/` e `bridge/` (quest'ultima da lasciare invariata salvo motivo concreto).
- Un solo documento di progetto vivo: `docs/AI_ROADMAP.md` (questo testo, se copiato nel fork). Aggiornare stato, decisioni e risultati **qui**, non in file separati `plan-v2.md`, `summary.md`, `notes.md`, `architecture-new.md`, ecc.
- Se utile all'agente, un unico `AGENTS.md` radice di massimo ~80 righe con istruzioni operative e un link a questa roadmap, solo se non esiste già.
- Nuovi file sorgente solo quando esiste una responsabilità distinta e riutilizzabile: preferire estendere moduli coerenti con quelli esistenti senza creare file monolitici.
- Prima di proporre un file nuovo cercare responsabilità equivalente nel codice upstream e scrivere nella fase: **perché questo file serve**. Non duplicare sistemi di job, servizi HTTP, DTO, config, moduli AI o componenti di ricerca.
- Evitare sia l'esplosione in microfile sia il grande `aiService.ts` con tutto dentro: organizzare per confini effettivi già adottati da upstream. Non imporre un numero arbitrario di file, ma segnalare ogni file nuovo a fine fase.
- Tenere README e documentazione originale dove sono. Aggiornare istruzioni pertinenti _in situ_; questo file è l'unica fonte per roadmap, audit, decisioni e avanzamento.
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
- `develop` è il ramo di integrazione del prodotto personalizzato, da cui buildare e distribuire il fork. Partire da `main`, quindi creare `develop` _soltanto se non esiste_, senza alterare un ramo di lavoro o modifiche locali preesistenti.
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

| Domanda                                                              | Risposta richiesta                               |
| -------------------------------------------------------------------- | ------------------------------------------------ |
| Si può ottenere con codice upstream già presente?                    | Percorso/simbolo e motivo del sì/no              |
| Possiamo aggiungere una feature senza cambiare i contratti centrali? | Sì/no e trade-off                                |
| Quali file upstream vanno toccati?                                   | Elenco ristretto e motivazione                   |
| Servono migrazioni di dati?                                          | Impatto, reversibilità, isolamento in test       |
| Cosa succede quando upstream cambia quel modulo?                     | Strategia di merge/verifica concreta             |
| Come resta compatibile con aggiornamenti upstream?                   | Delta separabile e test di integrazione nel fork |

Preferire integrazione adiacente a moduli originali, feature flag/config opzionali, migrazioni additive, API retrocompatibili e rollback possibile. Evitare grandi refactor di formato, rinomine massive, fork interni di componenti, vendor copy e cambiamenti cosmetici che rendano i diff illeggibili.

### Politica degli aggiornamenti upstream

- L’allineamento serve esclusivamente a importare nel fork aggiornamenti e implementazioni utili dal progetto originale, riducendo divergenza e conflitti. **Non verranno aperte pull request verso upstream**, nemmeno per bug fix generici.
- Bug fix, test di regressione e funzionalità del fork restano cambiamenti coerenti, separabili e testati per facilitare i merge futuri. Le eventuali PR interne hanno come destinazione il fork; licenza, attribuzioni e riservatezza dei dati restano vincolanti.
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

### Validazione FASE 1 — 12 ottobre 2026

**Perimetro:** riusati Dockerfile, PostgreSQL/Prisma, script npm, regression pack e Grab upstream.
L'alternativa a minor diff è la configurazione locale ignorata e l'estensione dei workflow esistenti:
nessun nuovo servizio applicativo, pacchetto, dipendenza, sorgente runtime o migration.
Superficie di conflitto limitata a CI, istruzioni di sviluppo, attributi Git e due test upstream;
queste ultime correzioni restano separate dalle funzionalità per facilitarne la manutenzione nel fork.
Unico file tecnico nuovo: `backend/.dockerignore`, assente nella baseline e necessario per
escludere `.env`, storage e dipendenze host dal contesto Docker. Senza questa esclusione `COPY . .`
può sovrapporre `node_modules` Windows alle dipendenze Linux dello stage build/test. Il frontend
possiede già la propria esclusione; non viene introdotto alcun sistema di build alternativo.

| Verifica                                  | Comando/metodo eseguito                                                                                                                                                           | Esito                                                                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toolchain e lockfile                      | Node **22.17.1 / npm 10.9.2 di nvm**; `npm ci --no-audit --no-fund` in root e `npm --prefix backend/frontend/extension/regression ci --no-audit --no-fund` per ciascun componente | PASS; nessun lockfile modificato. Due avvisi engine per plugin semantic-release richiedono 22.22.2+ o 24.15+; pubblicazione non eseguita                                                             |
| Prisma, lint e build backend              | `npm --prefix backend run prisma:generate`, `npm --prefix backend run lint`, `npm --prefix backend run build`                                                                     | PASS; Prisma Client 5.22.0; **49 migration** applicate soltanto a database sacrificabili                                                                                                             |
| Frontend                                  | `npm --prefix frontend run verify`                                                                                                                                                | PASS: **8 file / 42 test**, typecheck, lint e build; avvisi MUI `use client` e dimensione chunk preesistenti                                                                                         |
| Grab                                      | `npm --prefix extension run verify`; `npm --prefix extension run lint:firefox`                                                                                                    | PASS: typecheck, lint, Chrome/Firefox/Edge; Firefox **0 errori, 8 warning**                                                                                                                          |
| Backend nativo Windows, baseline iniziale | `cd backend; npx prisma migrate deploy; npm test`, con `DATABASE_URL` e `FILE_STORAGE` espliciti di test                                                                          | FAIL iniziale: 489 test passati, test POSIX `chmod` incompatibile con Windows e worker terminato; non utilizzato come prova Linux                                                                    |
| Backend Linux, database vuoto             | `docker build --target test -t thingport-phase1-backend-test:1929dc1 backend`; container `--user node`, env di test esplicito; `sh -c 'npx prisma migrate deploy && npm test'`    | Dopo correzione fixture: **54 file / 492 test PASS**; prima, 491/492 con fixture accidentalmente ADMIN                                                                                               |
| Regression completa                       | Da `regression/`, Git Bash `./run.sh` con Node nvm                                                                                                                                | **37/37 PASS** dopo correzione selettore; inizialmente 36/37, notifica ora link anziché menuitem; teardown automatico verificato                                                                     |
| Formato                                   | `npx prettier --check .` e `npx prettier --check . --end-of-line auto`; controllo LF Linux con `npm run format:check` su copia del checkout                                       | Baseline Windows: 596 file segnalati per CRLF, soltanto roadmap con `--end-of-line auto`; nessuna normalizzazione massiva upstream. Esito finale LF registrato nel Registro avanzamento              |
| CI e pubblicazione                        | Parsing dei 6 YAML modificati e matrice eventi `push main/develop`, PR, tag e dispatch                                                                                            | PASS locale: `develop`/PR non pubblicano; immagini main/tag conservate, signing/release Grab main-only. Actions remote non eseguite                                                                  |
| Mirror e merge                            | `git ls-remote upstream refs/heads/main`, `git diff --exit-code main upstream/main`; worktree/ramo temporanei da `develop`, `git merge --no-commit --no-ff upstream/main`         | PASS: upstream/main = main `1408b09c5989499b38ee0effd1b7c29661a233a5`; merge già aggiornato, nessun conflitto attuale. Ramo/worktree di prova rimossi; futuri delta richiederanno una nuova verifica |

**Isolamento e configurazione.** Progetto Docker locale distinto con DB dev/test su loopback
55432/55433, storage separati, frontend su `127.0.0.1:18080`, backend senza porta host.
Secret casuali, CORS con origine esatta, nessun account/dato personale, cookie provider, SMTP,
FlareSolverr o provider AI; `COLLECTION_SYNC_ENABLED=false`, `SYSTEM_NOTIFICATIONS_URL=`.
L'API conferma AI `mode=off`, nessun base URL/modello/chiave e `send_image=false`.
Backup iniziale associato alla base fork `8789f0147b9dd48e196dee0698a0549397b1d94f`;
immagini definitive ricostruite dal commit locale **`1929dc1585dc4b9123d8c75e44a2afc6380f8afa`**
con il medesimo `GIT_SHA`, senza cambiamenti al codice runtime rispetto alla base.
Commit della fase: `94205f3` (baseline/CI/test), `1929dc1` (contesto Docker backend isolato)
e `692c867` (solo formato della specifica già committata, per CI). Audit e validazione estesa
rimangono nel working tree separati da questi commit.
`.gitattributes` esteso con `*.sh text eol=lf`: il primo avvio da Windows falliva per CRLF
nell'entrypoint; ricostruzione e healthcheck successivi passati. Nessuna modifica alla logica runtime.
`push.default=nothing` impedisce push impliciti; i push espliciti e le protezioni GitHub rimangono
responsabilità della procedura di rilascio, senza cambiamenti remoti in questa fase.
Healthcheck, origine CORS esatta e assenza di autorizzazione CORS per un'origine estranea verificati;
binding loopback confermati con `docker inspect`. Il proxy nginx upstream risolve il backend
all'avvio: dopo cambi IP del container serve il riavvio del frontend, eseguito e documentato;
nessuna riscrittura del proxy introdotta.

**Grab collegato.** Build unpacked effettiva caricata in Chromium Linux Playwright 1.63.0,
profilo sacrificabile separato: login dal popup, stato configurato e lettura delle collezioni
attraverso background/API autenticata verificati, zero cookie MakerWorld. Solo l'host locale è
preautorizzato nel profilo di test: la finestra nativa di conferma permesso **non è stata testata**.
Chromium completo Windows non avviabile per errore SideBySide; nessuna modifica ai browser personali.
Nessun import reale da provider o certificazione dei flussi MakerWorld anticipata alla FASE 2.

**Backup e ripristino reali.** Fixture riusate da `regression/tests/fixtures.ts`: account locale,
cubo 3MF, file di supporto, immagine, categoria manuale, tag e membership di collezione.
Backend fermato prima di `pg_dump -Fc --no-owner --no-privileges` e archivio dell'intero storage;
`pg_restore --no-owner --no-privileges --exit-on-error` verso un DB nuovo e storage estratto in
percorso distinto. Confronto prima dell'accesso: **22 tabelle**, conteggi e hash canonici delle righe
identici (incluse 49 migration), **12 file** con SHA256 identici. Istanza ripristinata su loopback
18081: login, metadati, categoria/tag, membership e **4 risorse scaricate via API** con SHA256
identici, senza accesso a provider. Procedura aggiornata in `docs/DEVELOPMENT.md`; configurazioni,
credenziali, dump, screenshot, script e log operativi soltanto in `.agent_private/`, esclusa da Git.

**Gate verso FASE 2:** usare una raccolta dedicata con modelli importabili, verificare identità e
supporto della raccolta abituale/Default, import singolo, sync, duplicati, file offline e ripresa
dopo interruzione. Il successo della baseline non risolve paginazione/troncamento sync, race delle
precedenze, durabilità AI e credenziali individuati nell'audit; nessuna correzione di quelle feature
è inclusa nella FASE 1.

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

### Validazione FASE 2 — 12 ottobre 2026

**Esito: Gate 2 BLOCKED sulla prova reale MakerWorld.** L'incremento locale corregge soltanto difetti dimostrati dell'acquisizione esistente; i test controllati non certificano autenticazione, condizioni del servizio, layout Grab o download del provider reale.

**Riuso e delta minimo.** Restano `collectionSyncRunner`, `makerworldCollections`, `ImportJob`/`ImportJobItem`, deduplica per utente/provider/ID e storage upstream. Modificati soltanto i due servizi di listing/sync e `backend/tests/collectionSync.test.ts`; nessun nuovo sorgente pubblico, dipendenza, migrazione, API privata, schema o componente UI. Nessuna cancellazione locale o scrittura MakerWorld. Superficie di conflitto: la paginazione MakerWorld e la lettura del listing nel runner; fix generici separabili per facilitare gli aggiornamenti del fork da upstream.

**Difetti riprodotti e correzioni.** HTTP 429/502 su una pagina successiva producevano un job parziale; un payload senza ID poteva continuare senza progresso fino alla terminazione del worker; `truncated` era ignorato dal sync. Ora ogni pagina usa lettura strict, valida totale/ID/progresso e rifiuta pagine ripetute o incomplete. Il sync registra un errore leggibile senza avanzare `knownIds` o creare job su listing incompleto. Il cap upstream di **300 elementi rimane**: oltre il cap il sync fallisce esplicitamente; usare una raccolta più piccola o l'import manuale esistente, senza aumentare richieste o introdurre endpoint.

| Verifica                         | Comando/prova effettiva                                                                                                                                                                                                              | Esito                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toolchain                        | Node 22.17.1 / npm 10.9.2 già presenti in nvm; `npm.cmd --prefix backend run build`, `npm.cmd --prefix backend run lint`                                                                                                             | PASS                                                                                                                                                  |
| Riproduzione prima del fix       | Immagine test della FASE 1, nuovi test montati, `npm test -- tests/collectionSync.test.ts`                                                                                                                                           | FAIL atteso su paginazione 429/502; payload senza ID termina il worker. Un'asserzione del nuovo test offline corretta prima della validazione finale  |
| Test mirati                      | Container Linux non-root, DB `thingport_test`, sorgenti/test montati; `npm test -- tests/collectionSync.test.ts tests/imports.test.ts tests/linksImportJob.test.ts tests/importQueue.test.ts tests/importJobRunner.test.ts`          | **5 file / 101 test PASS** prima degli ultimi tre casi di paginazione                                                                                 |
| Regressione backend finale       | Stessa immagine `thingport-phase1-backend-test:1929dc1`, `--user 1000:1000 --network thingport-phase1_default --env-file .agent_private/test-linux.env`, mount `backend/src:/app/src:ro` e `backend/tests:/app/tests:ro`; `npm test` | **54 file / 509 test PASS**, 17 casi aggiunti rispetto alla baseline; 126,45 s                                                                        |
| File e resilienza                | Test di download sopra il limite dichiarato, stream interrotto, HTTP 503 e retry; crash dopo salvataggio del print; asset locale con provider offline                                                                                | PASS: fallimenti senza print dichiarato acquisito, retry sul job esistente, nessun doppio file; associazioni e download locale preservati             |
| Arresto del processo e scheduler | Database separato `thingport_phase2_gate`, 49 migration upstream, server reale e provider sintetico; SIGKILL durante download, startup recovery e `Sync now`, successivo timer scheduler reale                                       | PASS: 2 modelli, 2 file e 2 membership; secondo Sync now idempotente, download locale anche con provider offline; nessuna richiesta al provider reale |
| Formato                          | `npx.cmd prettier --check backend/src/services/collectionSyncRunner.ts backend/src/services/makerworldCollections.ts backend/tests/collectionSync.test.ts`                                                                           | PASS                                                                                                                                                  |

**Formato finale:** `npx.cmd prettier --check . --end-of-line auto` PASS sul checkout Windows; `npm run format:check` (Prettier + gofmt) PASS in Linux sulla copia privata LF con i file modificati e la roadmap aggiornata. Nessuna normalizzazione massiva upstream.

**Copertura dei sette casi minimi.** Import singolo/incrementale, seconda sync senza duplicati, membership in due raccolte con file invariati, recupero di item RUNNING già salvato, auth 401/403 e outage/rate limit, rimozione sorgente add-only, download locale senza fetch esterno: PASS con fixture sintetiche. La selezione `all` prova due profili/plate; l'import riuscito non garantisce tutti i profili disponibili, immagini o allegati del sito: verificare gli asset desiderati uno per uno nella prova reale. File molto grande simulato tramite `Content-Length` oltre limite, non benchmark di trasferimento multi-GB. Nessuna prova di deployment multiworker.

**Default Collection e limiti esterni.** La ricerca del 12/10 trova una [pagina pubblica MakerWorld denominata Default Collection](https://makerworld.com/en/collections/2803712) con ID numerico; il contenuto indicizzato non dimostra accessibilità attuale né supporto della raccolta di un account specifico. Il parser upstream accetta URL `/collections/<id>` indipendentemente dal nome; non esiste un adapter speciale Default. Verifica reale **NON ESEGUITA**. Le pagine condizioni `/en/terms-of-use`, `/en/terms`, `/terms-of-use` non sono state accessibili: conformità e disponibilità restano da verificare prima di import reali. Nessun bypass, cookie personale o nuova integrazione introdotti. Alternativa se Default risulta inutilizzabile: Inbox esplicita entro il cap, poi import manuale Grab; nessun rilevatore browser dei salvataggi.

**Passo per chiudere il Gate 2.** Usare una piccola raccolta dedicata e legittimamente importabile, verificare condizioni/accesso e sessione nel profilo di test, provare Grab `Keep this collection in sync`, aggiunta di un modello e check schedulato, `Sync now` ripetuto, rimozione dalla sorgente senza perdita locale; confrontare ID, membership e byte dei profili/file desiderati. Mantenere il cron dell'istanza di sviluppo disattivato fino a tale verifica. **FASE 3 non avviata.**

**Chiusura Gate 2 — verifica reale in corso, 12/10/2026.** Branch `feat/acquisition-reliability`, commit applicativo `cce813b748d96b9b7ddf830eb12b6dc0567b6720`; roadmap e ignore preesistenti preservati, inizialmente non committati; la pubblicazione successiva è registrata nel Registro avanzamento. L'istanza ordinaria usa ancora un'immagine precedente: la prova usa immagini backend/frontend costruite dall'archivio del commit indicato, porta loopback `18084`, rete e storage separati, database sacrificabile `thingport_gate2_real` sul server PostgreSQL di test già esistente. Applicate soltanto le 49 migration upstream incorporate; scheduler inizialmente disattivato e logging runtime Docker disabilitato per non registrare credenziali. SHA runtime/backend, guardia listing strict e SHA del bundle frontend verificati. Grab Chrome ricostruito dal checkout pulito, versione 1.4.0; installazione e interazione nel browser esterno richiedono verifica manuale. Stato iniziale osservato: un account di prova, zero print, raccolte, sync e job; nessuna sessione MakerWorld ancora persistita nel backend. Artefatti e dati identificativi restano nella directory privata ignorata.

**Differenza tra guida e UI MakerWorld.** In `extension/src/content/panels/makerworldCollection.ts` la versione 1.4.0 accoda tutti i modelli nuovi: non presenta le caselle individuali descritte genericamente in `docs/guides/synced-collections.md`. Per una prima prova su un solo modello usare la pagina singola e il collection picker esistente. Il backend conserva comunque in `knownIds` tutti gli ID osservati all'attivazione: quelli già visti, esclusi o eliminati localmente non vengono reimportati automaticamente; rimozioni dalla sorgente non cancellano l'archivio. Queste sono semantiche documentate e riscontrate nel codice, ancora da dimostrare con il provider reale; un'interruzione del batch non equivale alla selezione individuale mancante.

**Condizioni e confronto upstream aggiornati.** Le condizioni effettive sono accessibili su [MakerWorld user agreement](https://makerworld.com/it/user-agreement), aggiornate l'11/06/2024: il §9 limita acquisizione e monitoraggio automatici; l'accesso tecnico non costituisce da solo una verifica di conformità. La precedente impossibilità di leggere gli URL ipotizzati resta un limite storico dell'audit, superato per l'accessibilità del testo. Default Collection esclusa dalla prova. HEAD remoto osservato `6993a4c4231b9e80db9eb13c27ab97fc89e9ac01`: +10 commit, 75 file e 5 migration rispetto alla base `1408b09`; comprende Grab 1.5.0, collegamento sync dal frontend, account provider, sospensione su sessione mancante e nuovi default giornalieri/profili designer. Nessun aggiornamento integrato: la validazione resta sul commit fissato, con default 1 ora/profilo selezionato. Il delta richiederà successivamente un confronto specifico di schema, contratti Grab e runner.

**Primo tentativo reale: rifiutato, senza falso successo.** Il pannello Grab su una pagina singola riporta `Failed to fetch URL: Forbidden`. Il codice riconduce il messaggio al fetch remoto durante `/import/inspect`, prima del pulsante di importazione; l'ispezione del database isolato conferma zero print, raccolte, sync e job, e nessuna sessione MakerWorld persistita. La sola autorizzazione del browser ad accedere al sito non dimostra la disponibilità del cookie di autenticazione. Da distinguere sessione mancante, mancata propagazione e rifiuto del provider: causa specifica ancora non dimostrata. Nessun retry automatico, solver o modifica applicativa introdotto per superare il rifiuto.

**Correzione minima Grab: sessione reale verificata.** La diagnostica dell'API `chrome.cookies.get` inizialmente restituisce lettura fallita; il manifest 1.4.0 dichiara `cookies` e i match dei content script, ma nessun `host_permissions` esplicito, mentre il setup richiede soltanto l'origine dell'istanza. L'accesso cookie richiede anche il permesso host ([documentazione Chromium](https://developer.chrome.com/docs/extensions/reference/api/cookies)). Aggiunte soltanto due righe a `extension/scripts/manifest.ts`: commento e `host_permissions: ["https://makerworld.com/*"]`. Dopo ricarica nel browser reale la lettura riesce, il backend isolato conserva una sessione e il pannello di import apre correttamente. `npm.cmd --prefix extension run verify` PASS; Firefox lint PASS, 0 errori/8 warning della baseline. Questo risolve il difetto di permesso riprodotto, senza provare la causa di ogni possibile 403 del provider.

**Secondo difetto riprodotto: profilo selezionato sostituito dallo ZIP originale.** Il primo import reale crea un solo modello con metadati, 6 immagini preview, 2 immagini descrizione e uno ZIP locale da 7.833.910 byte; il file contiene STL e un 3MF di ricambi, ma non il profilo esplicitamente richiesto. `resolveMakerworldDownloadUrl` consentiva il fallback STL/CAD anche con `#profileId`. Modificata una sola riga in `extension/src/content/makerworld/downloadResolver.ts`: il default `profileOnly` ora segue la presenza del profilo richiesto, riusando il percorso esistente. Tre casi offline verificano supporto raw senza profilo, assenza di fallback raw con profilo esplicito e identità del 3MF selezionato; il caso di fallback fallisce prima del fix e i tre casi passano dopo. Nuova extension verify PASS; nessuna API, dipendenza o migration aggiunta.

**Import, integrità e deduplica reali: PASS sul primo modello.** Dopo ricarica Grab, `Add profile` aggiunge un 3MF da **5.482.609 byte** al medesimo record, senza sostituire lo ZIP: il profilo richiesto è identificato correttamente. Confronto con una copia scaricata normalmente da MakerWorld: SHA-256 identico nel riferimento, storage e download autenticato di Thingport. CRC e struttura 3MF validi, 25 elementi; il loader 3MF già incluso nel backend carica **255.546 triangoli**, vertici finiti e indici validi. Anche lo ZIP originale e il 3MF annidato superano CRC/struttura, lo STL contiene geometria binaria valida. API attraverso il frontend: reimport modello e profilo restituiscono `already_imported`, stessi ID e hash; aggiunta ripetuta a una seconda raccolta mantiene esattamente due membership senza duplicazioni. Prove circoscritte a un modello, nessuna Default Collection.

**Collegamento Grab e timer reali: collegamento PASS, acquisizione incrementale BLOCKED.** La raccolta dedicata viene ridotta a un modello già acquisito e collegata tramite `Keep this collection in sync`: stesso ID raccolta locale, un solo `knownIds`, scope `url`, intervallo upstream 1 ora, `lastCheckedAt` nullo, nessun job. Un secondo modello viene aggiunto successivamente alla sorgente senza import manuale. Lo scheduler è attivato soltanto nell'istanza isolata, senza alterare timer o cooldown. Il primo controllo automatico, dopo i 2 minuti upstream, termina il 12/10/2026 alle **21:37:04 UTC** con `MakerworldAuthError`: sessione memorizzata ed estraibile come bearer, ma accesso backend alla raccolta rifiutato. Il codice converte sia HTTP 401 sia 403 nella stessa eccezione: lo status preciso non è conservato e non è stato misurato, né si può concludere che il token sia scaduto o distinguere una restrizione del provider. Nessun nuovo job o modello, `knownIds` invariato, `missingChecks` zero, errore persistito e `lastCheckedAt` aggiornato: nessun falso successo. Nessun retry del provider, solver o cambio endpoint; scheduler nuovamente disattivato dopo il rifiuto.

**Persistenza e accessibilità dopo il rifiuto: PASS con limiti espliciti.** SIGKILL e riavvio del backend isolato, a import concluso e prima di attivare il timer, preservano modello, byte, membership, sessione e collegamento sync. Il recupero durante stream resta quello già superato con provider sintetico, non viene presentato come crash durante un download MakerWorld reale. Dopo il rifiuto della raccolta e la disattivazione del timer, download autenticati attraverso frontend/nginx/backend restituiscono HTTP 200 per ZIP e 3MF con hash identici allo storage, senza richieste MakerWorld; anche deduplica del profilo ancora PASS. È dimostrata l'indipendenza dei file locali dall'accesso al listing rifiutato, non l'indisponibilità dell'intero sito. Snapshot di tutte le 22 tabelle dell'istanza ordinaria invariato rispetto all'inizio della prova.

| Caso obbligatorio                            | Evidenza reale e limite residuo                                                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Import singolo e nuovo modello in sync       | Import singolo e profilo PASS; il timer parte ma viene rifiutato dal provider, nessuna acquisizione incrementale dimostrata                                                                       |
| Due sync con contenuto invariato             | BLOCKED: nessun primo listing reale riuscito; deduplica delle API di import PASS, non sostituisce la prova di sync                                                                                |
| Membership in due raccolte                   | PASS: due associazioni uniche, file e modello invariati                                                                                                                                           |
| Riavvio durante elaborazione                 | PASS sintetico durante stream; PASS reale a import concluso; recupero durante download reale NON VERIFICATO                                                                                       |
| Autenticazione, limiti e listing incompleto  | Rifiuto reale senza falsi successi o perdita locale; diagnostica successiva conferma 403 con challenge Cloudflare; 401/403 applicativi, 429/502/pagine incomplete verificati nei test controllati |
| Rimozione sorgente senza perdita locale      | BLOCKED sul provider reale; additività riscontrata in codice e test controllati                                                                                                                   |
| Download locale con sorgente non accessibile | PASS per il percorso listing rifiutato: ZIP/3MF serviti dal frontend senza richieste esterne; outage totale MakerWorld non simulato nella prova reale                                             |

**Elementi già visti, esclusi o eliminati.** `knownIds` è additivo: un elemento osservato all'attivazione resta escluso dagli import automatici futuri anche se non archiviato o cancellato localmente; rimuoverlo e reinserirlo nella sorgente non lo rende nuovo. Un ID nuovo già presente in libreria aggiunge soltanto la membership, senza scaricare nuovamente. Il salvataggio della sync in Grab estende gli ID noti anche alle carte visualizzate: durante la prova incrementale non va usato per registrare il nuovo modello prima del timer. Semantica confermata da guida, codice e prove controllate; il listing reale rifiutato impedisce di dimostrarla nel check reale. Nessun modello locale cancellato per simulare un esito non osservabile.

**Diagnosi successiva del rifiuto: challenge Cloudflare confermata.** Il 12/10/2026 alle **21:44:25 UTC**, dopo il cooldown upstream, una sola richiesta diagnostica allo stesso endpoint della raccolta dedicata restituisce **HTTP 403**, `Content-Type: text/html`, `Server: cloudflare` e `cf-mitigated: challenge`. Sono stati conservati soltanto metadati consentiti e indicatori booleani, nessun corpo della risposta, cookie, token o credenziale. Il significato dell'header è confermato dalla [documentazione Cloudflare](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/). È dunque osservato un blocco della protezione per questo accesso backend; la risposta non dimostra che la sessione sia scaduta. Nessun retry, replay di clearance, solver, proxy alternativo o cambio endpoint effettuato.

**Perché può scattare senza VPN — analisi del 13/10/2026.** Il listing usa `fetch` di Node nel backend, non il browser Arc: `collectionHeaders` invia il token MakerWorld come Bearer e un User-Agent statico Windows Chrome 121 definito in `config.ts`. Il token applicativo non trasferisce il contesto browser né dimostra il superamento delle verifiche Cloudflare. Il container osservato esegue Node 20.20.2; le variabili proxy HTTP/HTTPS/ALL, maiuscole e minuscole, sono assenti, così come quelle dell’ambiente shell host. Questo controllo esclude tali proxy espliciti, ma non certifica l’intero percorso di rete. Cloudflare documenta controlli su header, caratteristiche di sessione e segnali browser, oltre a euristiche e fingerprint: una VPN non è un requisito per una challenge ([motori di rilevamento](https://developers.cloudflare.com/bots/concepts/bot-detection-engines/)). È plausibile che contino i segnali del client automatico o la policy dell’endpoint, ma non è dimostrato quale regola sia scattata. Import dal browser e listing backend riguardano richieste diverse: non costituiscono un confronto controllato sullo stesso endpoint. La risposta ricevuta non rivela regola WAF, bot score o causa legata all’IP; per attribuirla con precisione servono i dati di sicurezza del gestore MakerWorld. Nessuna nuova richiesta al provider, modifica del fingerprint o copia di cookie di clearance eseguita durante questa analisi.

**Correzione minima della classificazione.** `makerworldCollections.ts` classificava anche questa challenge come `MakerworldAuthError` quando FlareSolverr era disattivato. Ora distingue un 403 con marker esplicito `cf-mitigated: challenge` dal 403 JSON applicativo, conserva `HTTP 403` nel messaggio e indica che la sessione può essere ancora valida. Il percorso strict registra l'errore senza job o avanzamento degli ID; il percorso non-strict mantiene il contratto nullable. Nessuna protezione aggirata e nessun nuovo meccanismo di acquisizione. Tre regressioni aggiunte nell'esistente `collectionSync.test.ts`: due casi di challenge, falliti prima e passati dopo il fix, e un 403 JSON dietro Cloudflare che deve restare un errore di sessione. Verificati anche una sola richiesta, nessuna chiamata al solver, ID/missing checks invariati e zero job nei casi di blocco. `npm.cmd --prefix backend run build` e `run lint` PASS con nvm Node 22.17.1; suite pertinente Linux non-root **2 file / 49 test PASS** (`collectionSync.test.ts`, `makerworldCloudApi.test.ts`). I 509 test precedenti restano la baseline storica; l'intera suite non è stata rieseguita per questa patch circoscritta.

**Runtime e limite esterno residuo.** Backend isolato ricostruito dal commit `cce813b` più la sola patch diagnostica, immagine locale con suffisso `-cfdiag`; hash del modulo compilato verificato contro il checkout. Frontend resta alla base `cce813b`, Grab alla base più i due fix già verificati. Replay offline degli header osservati nel runtime costruito PASS, senza richieste esterne o scritture DB. L'errore già persistito dal primo timer è mantenuto come evidenza storica: non è stato riscritto manualmente né presentato come un nuovo check reale. Scheduler spento. Una modalità di accesso backend supportata dal provider non è stata verificata; la ricerca mirata sui domini ufficiali MakerWorld/Bambu non ha individuato documentazione applicabile alle raccolte, senza dimostrare che tale modalità non esista. Il percorso manuale Grab nel browser autenticato rimane verificato, ma non soddisfa da solo la sync automatica richiesta.

**Decisione aggiornata: Gate 2 BLOCKED sulla challenge Cloudflare del percorso backend.** La correzione del messaggio errato è completata e verificata; l'accesso automatico alla raccolta rimane rifiutato. Per risolvere il blocker operativo serve una modalità supportata dal provider o una configurazione consentita dal gestore dell'endpoint, senza aggirare la protezione. Poi restano da provare almeno un listing riuscito, acquisizione automatica del nuovo modello con confronto file, due sync riuscite e idempotenti, rimozione dalla sorgente senza perdita locale e recupero durante elaborazione reale. Modifiche preesistenti preservate e patch revisionabili sul ramo di lavoro del fork; nessun merge o aggiornamento upstream integrato, dipendenza, servizio applicativo o migration aggiunta. FASE 3 non avviata.

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
- Mantenere separabili i bug fix del fork per facilitare gli aggiornamenti da upstream, senza aprire PR verso upstream; registrare eventuali parti della nostra implementazione ormai sostituibili da capacità native upstream.
- Verificare adempimenti AGPL-3.0-only quando si redistribuisce o si mette il servizio a disposizione di altri utenti attraverso una rete.
- Produrre una sezione operativa nel README esistente: attivazione sync, AI locale, limiti, disattivazione, backup, recovery, comandi essenziali. Evitare un nuovo manuale di 50 pagine.

**Gate 8:** flusso completo ripetibile su istanza pulita, backup/restoring e upgrade provati, nessuna perdita/modifica automatica indesiderata, performance e limiti osservati, istruzioni sufficienti per manutenzione ordinaria; merge di aggiornamento upstream simulato con successo e storia Git del fork chiaramente separata.

---

## Test trasversali obbligatori

### Matrice di regressione

| Area                   | Casi che devono sempre rimanere funzionanti                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Ingestione             | Import singolo, collezione, retry, dedup, stampa/profili e file                             |
| Sincronizzazione       | Incrementale, no delete, provider offline, autenticazione scaduta                           |
| Catalogo               | Modifica manuale, categorie/cartelle, tag, collections, autore                              |
| Classificazione        | Suggest-only, reject, override manuale, invalid JSON, reprocess                             |
| Ricerca                | Lessicale, semantica, ibrida, sinonimi, filtro, utenti separati                             |
| File                   | File presenti, preview, download, import incompleto, storage offline                        |
| Resilienza             | Restart durante job, idempotenza, dati obsoleti, restore                                    |
| Estensione             | Browser supportati, background worker, permessi, nessun secret nel log                      |
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

Audit del **12 ottobre 2026**, sul checkout `8789f0147b9dd48e196dee0698a0549397b1d94f`, base upstream `1408b09c5989499b38ee0effd1b7c29661a233a5`. **Esiste** significa riscontrato nel codice e nei contratti; non certifica una prova runtime. Nessuna istanza, credenziale personale, database o servizio AI è stato usato. Il documento presente nel checkout è `docs/ROADMAP_THINGPORT_AI.md`; il percorso `docs/AI_ROADMAP.md` indicato nella specifica non esiste. Si mantiene il file esistente come unica roadmap, senza duplicarlo o rinominarlo.

| Funzione                                   | Esito: esiste/parziale/manca                          | Percorso codice                                                                                                                                                                                               | Delta minimo                                                                                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Import MakerWorld                          | **Esiste**, disponibilità reale da validare           | `backend/src/routes/imports.ts`; `services/importService.ts::importPrintFromUrl`, `importNewOrExisting`, `addMakerworldProfileToPrint`; `makerworldCloudApi.ts`, `importResolvers.ts`                         | Riutilizzare import, dedup e selezione profili; nessun nuovo scraper. Testare errori e completezza dei file in FASE 2                                                                                                |
| Extension Grab                             | **Esiste**, Chrome/Edge/Firefox, versione 1.4.0       | `extension/src/content/panels/makerworldCollection.ts::loadMakerworldGuidedCollection`; `background/makerworldJob.ts`, `importJobs.ts`, `api.ts`; `scripts/manifest.ts`                                       | Riutilizzare scansione DOM e import guidato persistito nel browser; verificare compatibilità locale senza alterare la copia distribuita                                                                              |
| Collection sync                            | **Esiste**, additivo, con limiti                      | `backend/src/services/collectionSyncService.ts::enableSync`, `findLibraryPrints`; `collectionSyncRunner.ts::runSync`; `collectionSyncSchedule.ts`; `routes/collectionSyncs.ts`                                | Nessuna seconda coda; coprire troncamento listing, ripartenza e failure nelle finestre tra creazione job/item/knownIds                                                                                               |
| Raccolta MakerWorld abituale/Default       | **Parziale / NON VERIFICATA** sul servizio reale      | `makerworldCollections.ts::parseMakerworldCollectionUrl`; `extension/src/shared/urls.ts`; `content/makerworld/pageData.ts`                                                                                    | Sono riconosciute collection con URL `/collections/<ID numerico>`. Nessun caso dedicato Default; verificare URL, ID, visibilità e conteggio su raccolta sacrificabile; alternativa Inbox esplicita                   |
| Conservazione file                         | **Esiste**, stato archivio completo **parziale**      | `backend/prisma/schema.prisma::Plate`, `PrintFile`, `PreviewImage`, `DescriptionImage`; `services/printCreation.ts::createPrint`; `descriptionImageService.ts`; `sourceGaps.ts`                               | I file modello/profilo sono `Plate`, gli allegati/preparati sono `PrintFile`. Non dedurre completezza da source URL o source gaps; distinguere file presenti, profili scelti e mancanti                              |
| Backup/restore                             | **Parziale**: persistenza, manca procedura provata    | `docker-compose.yml` (`data/postgres`, `data/storage`); `backend/src/config.ts`; `services/printCreation.ts::resolvePlateFilePath`                                                                            | Backup coerente PostgreSQL + storage, eventuali file esterni referenziati da `sourcePath`, configurazione privata; prova restore in FASE 1. Export ZIP non sostituisce un backup                                     |
| Categorie/collection/tag                   | **Esiste**                                            | `schema.prisma::Category`, `Collection`, `CollectionItem`, `Print.tags`; `services/categoryService.ts`, `collectionService.ts`, `utils/tagNormalization.ts`                                                   | Una categoria/cartella per Print, collection molti-a-molti, tag stringhe senza provenienza. Estendere solo i metadati mancanti, senza confondere i tre concetti                                                      |
| Classificazione AI esistente               | **Esiste**, single-category; multi-facet **manca**    | `backend/src/services/aiCategorizationService.ts::requestProvider`, `categorizePrint`; `settingsService.ts::DEFAULT_AI_CATEGORIZATION_SETTINGS`; `routes/aiCategorization.ts`; `frontend/src/pages/AiPage/`   | Conservare provider HTTP compatibile OpenAI, validazione Zod, modalità off/suggest/auto, limiti e UI. Ollama locale tramite `/v1/chat/completions` è un riuso del protocollo, da provare con modello/versione reali  |
| Correzioni/rifiuti                         | **Esiste**, governance **parziale**                   | `schema.prisma::CategorySource`, `Print.aiSuggestion`, `aiRejectedCategoryIds`; `aiCategorizationService.ts::acceptAiSuggestion`, `rejectAiSuggestion`; `printCategoryService.ts::setPrintCategory`           | Riutilizzare reject e compare-and-set; preservare anche approvazioni e rimozioni manuali, distinguere versioni di input e suggestion; niente secondo sistema review                                                  |
| Pipeline AI recuperabile                   | **Parziale**                                          | `aiCategorizationService.ts::enqueueAiCategorization`, `startAiCategorizationRun`, `runAiCategorization`; hook in `printCreation.ts::createPrint`                                                             | Hook fire-and-forget, run/limiter in memoria; mancano fingerprint, processorVersion, stato persistente, recupero dopo restart e claim multiworker. Estensione motivata in FASE 4, non riuso improprio di `ImportJob` |
| Note personali e tag AI                    | **Parziale**                                          | `Print.notes` contiene la descrizione importata/editabile; `Print.tags`, `Collection.tags`; `fillGapsService.ts::fillEmptyMetadata`                                                                           | Non usare `notes` come motivazione personale implicita; manca provenienza dei tag e campo personale distinto. Definizione minima in FASE 3                                                                           |
| Ricerca full-text                          | **Esiste**; filtri della libreria su percorso diverso | `services/searchService.ts::search`, `searchPrintIds`; `routes/search.ts`; migration `20260919164610_add_search_vectors`; `routes/prints.ts::buildPrintWhere`; `frontend/src/components/Layout/GlobalSearch/` | Conservare tsvector/GIN e isolamento userId. La ricerca globale usa ranking, `/prints?q` usa contains/ILIKE e filtro tag separato: integrarli senza sostituire API esistenti                                         |
| Embedding/ricerca ibrida/raccolte virtuali | **Manca**                                             | Nessun campo embedding, indice vettoriale o saved query nei moduli/schema ispezionati; PostgreSQL 16 Alpine standard                                                                                          | Benchmark prima della scelta ranking Node/pgvector. Riutilizzare search, filtri, DTO e UI; non introdurre DB vettoriale separato                                                                                     |
| UI AI e revisione                          | **Esiste**, multi-facet/undo **mancano**              | `frontend/src/pages/ModelsPage/AiCategorizationPanel.tsx`, `ModelsManagerDialog.tsx`; `ModelDetailPage/ModelSidePanel.tsx`, `ModelActionsMenu.tsx`; `pages/AiPage/`                                           | Sono già presenti elenco paginato suggerimenti, bulk accept/reject, run/cancel, badge e recategorize con conferma manuale. Estendere queste superfici; nessuna nuova pagina AI necessaria                            |
| Test backend/frontend/extension            | **Esiste / parziale**                                 | 54 `backend/tests/*.test.ts`, 8 test frontend; `backend/vitest.config.ts`; package script backend/frontend/extension                                                                                          | Backend: DB reale separato, file sequenziali. Frontend: test utility, non copertura UI AI. Extension: typecheck/lint/build, nessuna suite unit individuata. Nessuna suite eseguita in FASE 0                         |
| Regressione Playwright                     | **Esiste**, copertura AI/sync reale **parziale**      | 8 `regression/tests/*.spec.ts`; `regression/run.sh`, `docker-compose.yml`, `playwright.config.ts`; `.github/workflows/regression.yml`                                                                         | Stack temporaneo con tmpfs; auth, upload, consume, models, collections, sidebar. Mancano E2E dedicati import MakerWorld/review/ricerca semantica/restore; riutilizzare fixture e pack                                |

**Architettura e flusso verificati**

- Backend Express 4/TypeScript, Prisma 5/PostgreSQL; frontend React 18/Vite 6/MUI 6; extension TypeScript/SCSS/esbuild; bridge Go separato, da lasciare invariato. Nessun npm workspace. Versioni dichiarate: backend 0.1.0, frontend 0.0.1, extension 1.4.0; la release eseguibile va identificata con SHA. Licenza `AGPL-3.0-only` nei manifest e in `CONTRIBUTING.md`, testo AGPL v3 in `LICENSE`.
- MakerWorld collection → Grab legge titolo/conteggio e scorre il DOM → verifica `/import/status` → attiva facoltativamente `/collection-sync` con tutti gli ID osservati → archivia gli elementi già presenti nella collection → naviga tra le pagine dei nuovi modelli, risolve il download e chiama `/import` tramite il background. **Questo import guidato iniziale non è un ImportJob server**: lo stato è in `chrome.storage.local`; chiudere la tab interrompe il percorso. Esiste anche l'import collection server in `routes/imports.ts`/`importJobRunner.ts`.
- Successivamente scheduler backend → `CollectionSync` → listing provider → differenza rispetto a `knownIds` → membership dei modelli già presenti → job `LINKS` con `ImportJobItem` per i nuovi → `importPrintFromUrl` → `Print` + `Plate` + immagini/allegati → `CollectionItem` → DTO/API e UI. Nessuna cancellazione di Print o membership per rimozione dalla sorgente. Due risposte definitive di collection assente rimuovono il solo sync; autenticazione/offline non devono essere interpretati come cancellazione.
- Dedup per `userId + sourceProvider + sourceExternalId`, vincolo DB e gestione race `P2002`; profili MakerWorld sul medesimo Print con `sourceInstanceId` e confronto SHA256. `CollectionItem` ha unique collection/print. Reimport non sostituisce automaticamente i metadati; fill-gaps riempie quelli vuoti, le immagini descrittive vengono localizzate.
- `Category.kind` separa tassonomia import (`category`) e albero dell'utente/upload (`folder`), ereditato dal capostipite. I mapping site-category producono `RULE`; assegnazione esplicita `MANUAL`; migration AI marca le assegnazioni preesistenti `LEGACY`. L'AI esclude folder/manual salvo richiesta force esplicita. `Collection` è una membership indipendente, non una directory né una categoria esclusiva. Cambiare categoria può **spostare file** tramite `setPrintCategory` → `relocatePrint`: non è un cambiamento soltanto visivo.
- Full-text generata con configurazione `simple`: nome/titolo peso A, tag B, notes C, creator D; query parametrizzate, prefissi e limite di 8 token; palette predefinita 6 modelli/4 collection/5 tag. Mancano sinonimi semantici, embedding e tie-break finale per ID quando rank/nome coincidono. La migration SQL mantiene funzione immutable e indici GIN fuori dalla rappresentazione completa di Prisma: verificare ogni futura migration generata.

**Lacune e rischi osservati (nessuna correzione in FASE 0)**

1. **Integrità e precedenze manuali.** Compare-and-set della categoria esiste, ma non c'è revisione del contenuto: `acceptAiSuggestion` non confronta una versione attesa e salva `AI`, quindi un'approvazione non ha provenienza distinta da una predizione. Categoria rimossa manualmente diventa source null; tag vuoti e note vuote non distinguono cancellazione intenzionale da dato mancante. `fillEmptyMetadata` legge prima della chiamata remota e aggiorna senza controllo dello snapshot; testare edit concorrenti. Anche DB e filesystem in `setPrintCategory` non formano un'unica transazione recuperabile.
2. **Sync e completezza.** `fetchMakerworldCollectionEntries` ha cap 300 e restituisce `truncated`, ignorato dal runner; errori di paginazione non strict possono restituire un listing parziale. Non prova perdita locale, ma può nascondere nuovi elementi. Job, item e `knownIds` sono scritti in passi separati: simulare crash nei punti intermedi. Il lock globale del sync e il controllo import attivo sono in-process; deployment multiworker non dimostrato. Intervalli 1/6/24 ore, tick 5 minuti, startup 2 minuti, cooldown manuale 5 minuti; pacing chiamate MakerWorld 5 s e import sync 60 s. Gli ID iniziali noti non vengono importati retroattivamente.
3. **Durabilità e qualità AI.** Import hook solo per Print inizialmente senza categoria; non classifica automaticamente quelli assegnati da regola. Parte prima dell'aggancio finale delle immagini importate, rilevante per vision futura. Timeout/retry HTTP limitati e stop dopo 5 fallimenti esistono; JSON invalido non ha recupero persistente. Nessun versioning/fingerprint né protezione da input terzo manipolato oltre alla validazione di categoria. Tenere off in baseline e suggest-only nella sperimentazione; auto già presente upstream non autorizza ad abilitarlo. Nessuna scelta di modello o benchmark in questa fase.
4. **Credenziali e confini di rete.** JWT HS256 e bcrypt, scope userId nelle route, API token hashato ma read-only: il token attuale non sostituisce il login dell'extension per import. Password Thingport/token/copia cookie in storage locale extension; cookie MakerWorld in chiaro in `User.makerworldCookie`, chiave AI nel JSON `Setting`, quindi sensibili anche nei backup. Recent imports (titoli/URL) usano `chrome.storage.sync` e il servizio del browser, come dichiarato in `extension/PRIVACY.md`; non sono esclusivamente locali. JWT di sessione ammessi in query per file/immagini possono apparire nei log proxy. Redazione AI limitata a Bearer e test connessione, non filtro generale dei log. Il message dispatcher è tipizzato ma senza schema runtime/allowlist per handler; non è stata dimostrata un'exploitabilità dalle pagine web.
5. **Manutenzione, deployment e accessi remoti.** URL import validate per protocollo/DNS/IP privati, ma fetch segue redirect senza rivalidare ogni destinazione; suffissi provider `endsWith('makerworld.com')` non impongono confine di dominio. L'endpoint AI configurabile da admin non impone host locale/consenso per utente; no garanzia local-only a livello codice. CORS default localhost, wildcard configurabile, dev Vite su tutte le interfacce, AUTH_SECRET fallback noto: isolamento e segreto esplicito prima dell'avvio. Docker entrypoint esegue `prisma migrate deploy` all'avvio: vietato usarlo su dati personali prima del backup. CI backend/frontend/extension filtrata su main, nessuna protezione branch del fork rilevata; deve coprire develop senza attivare pubblicazioni automatiche.

**MakerWorld e disponibilità esterna:** l'integrazione corrente usa API del sito (`/api/v1/design-service/favorites` e cloud API), cookie personale, DOM e fallback FlareSolverr; la presenza di queste capacità upstream **non certifica** API developer ufficiali né conformità alle condizioni del servizio. La pagina condizioni tentata `https://makerworld.com/en/terms-of-use` non è stata accessibile; condizioni attuali e raccolta Default restano **NON VERIFICATE**, da risolvere prima di test/import reali della FASE 2. Nessuna richiesta autenticata MakerWorld, tentativo di aggirare protezioni o modifica del servizio effettuato. Il riuso del protocollo Ollama è supportato dalla [documentazione ufficiale di compatibilità](https://docs.ollama.com/api/openai-compatibility); compatibilità concreta schema/modello e località dell'inferenza richiedono comunque prova, senza modelli cloud.

**Testing e baseline: evidenze, non esiti presunti**

| Controllo             | Comando/percorso                                                                                                                                                                                                                    | Esito FASE 0 e uso successivo                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git e mirror          | `git status --short --branch`, `git remote -v`, `git rev-parse HEAD main upstream/main`, `git rev-list --left-right --count main...develop`, `git diff --exit-code main upstream/main`, `git merge-base --is-ancestor main develop` | **PASS**: inizialmente pulito, develop +1/-0, mirror identico e antenato; diff iniziale solo roadmap                                                                                                                                     |
| Modifiche audit       | `git diff --check`; verifica contenimento sezioni e path locali citati; `git check-ignore .agent_private/fork-api-audit.json`                                                                                                       | **PASS** ai controlli finali; cartella privata ignorata, nessun sorgente/schema/lockfile modificato                                                                                                                                      |
| Manifest e inventario | `ConvertFrom-Json -AsHashtable` su 12 manifest/lockfile tracciati; `rg --files` per test/migration; `node --version`                                                                                                                | **PASS** parsing; 54 backend, 8 frontend, 8 spec Playwright, 49 migration; Node locale v24.19.0. `docs/DEVELOPMENT.md` dice 19 file/151 test, nessun test frontend e 27 migration: valori obsoleti, non usare come baseline              |
| Format/lint/build     | `npm run format:check`; `npm --prefix backend run lint` e `run build`; `npm --prefix frontend run verify`; `npm --prefix extension run verify` e `run lint:firefox`                                                                 | **NON ESEGUITI**: node_modules assenti in tutti i componenti, npm/gh/go non trovati nel PATH; nessuna installazione in FASE 0. Root format:check include sintassi shell POSIX e gofmt: usare ambiente compatibile                        |
| Backend integrazione  | `npm --prefix backend test`, previa `prisma generate` e `prisma migrate deploy` sul solo DB test                                                                                                                                    | **NON ESEGUITO**, nessun DB test predisposto. Test AI/sync/import già presenti con HTTP mock; DB reale, `fileParallelism: false`; impostare DATABASE_URL e FILE_STORAGE espliciti e separati                                             |
| Frontend e regression | `npm --prefix frontend run test:run`; `regression/run.sh` in Bash con Docker                                                                                                                                                        | **NON ESEGUITI**. `--passWithNoTests` non dimostra copertura; verificare numero effettivo. Docker CLI presente, daemon non verificato; nessuno stack avviato                                                                             |
| CI upstream           | `.github/workflows/backend-image.yml`, `build-image.yml`, `frontend-image.yml`, `extension-release.yml`, `format.yml`, `regression.yml`                                                                                             | Ispezione statica: backend **esegue anche test + migration su PostgreSQL** prima dell'immagine; frontend build ordinaria non usa stage Docker `test` né esegue Vitest; regression settimanale/manuale. Nessun esito remoto CI dichiarato |

**Delta minimo, ordinato per le fasi successive:** conservare subito import/sync, mapping categorie, provider e review upstream; FASE 1 soltanto ambiente isolato, baseline, backup/restore e CI; FASE 2 correggere solo problemi dimostrati del flusso acquisizione; FASE 3 aggiungere il minimo per motivazione personale e provenienza multi-facet; FASE 4 rendere recuperabile l'elaborazione esistente con fingerprint/versioni e mock, senza microservizio; FASE 5 estendere output validato e provider locale già compatibile; FASE 6 aggiungere embedding/ranking alla ricerca attuale dopo benchmark; FASE 7 estendere i pannelli review esistenti. Nessuna duplicazione di classificatore, extension, UI, database o coda import. Nuovi file/dipendenze/migration: **nessuno approvato o necessario in FASE 0**.

**Piano iniziale per la FASE 1 (formulato nell'audit FASE 0; consuntivo nella Validazione FASE 1)**

| Passo | Attività e superficie prevista                                                                                                                                                                                                                                                 | Prova di accettazione                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Rileggere stato Git e SHA remoto, conservare main mirror; dopo consolidamento dell'audit lavorare su `feat/baseline-safety` da develop. Nessun reset o rebase condiviso; main non richiede correzioni                                                                          | Base e diff registrati, main privo di commit propri; nessun push/PR o modifica impostazioni GitHub implicita                                                                      |
| 2     | Predisporre npm/Node compatibile (backend richiede >=20.19, CI usa 20), Bash e Go per format; `npm ci` nei componenti con lockfile, `npm --prefix backend run prisma:generate`. Nessun workspace nuovo                                                                         | Installazione riproducibile, lockfile invariati, disponibilità Docker verificata; eventuali incompatibilità distinte dai difetti applicativi                                      |
| 3     | PostgreSQL 16 dev e test **distinti**, porte legate a loopback, storage sacrificabili distinti, `.env` ignorati; AUTH_SECRET casuale, CORS esplicito; AI off, sync schedulato off inizialmente. Usare Compose esistente o override locale ignorato, senza schema nuovo         | Migrazioni attuali applicate solo ai DB isolati; nessun servizio personale contattato; registrazione account test e login riusciti                                                |
| 4     | Eseguire format, backend lint/build/test, frontend verify, extension verify/lint Firefox e pack Playwright. Verificare Grab unpacked collegata all'istanza test, prima senza import reali                                                                                      | Comandi/esiti e conteggi effettivi registrati; difetti preesistenti separati da nuove regressioni; build dei tre browser                                                          |
| 5     | Creare dataset sintetico consentito con Print/Plate/immagini/collection, dump PostgreSQL + copia storage coerente; ripristinare in una seconda istanza sacrificabile                                                                                                           | Conteggi, membership, hash dei file e download dopo restore coincidono; password/cookie/log restano fuori dal repository                                                          |
| 6     | Estendere **workflow esistenti** per PR verso develop e gate pertinenti, mantenendo pubblicazione disattivata per il nuovo percorso; prevedere protezione main/develop previa autorizzazione remota. Simulare merge upstream su ramo locale temporaneo con working tree pulito | Build collegata allo SHA develop; nessun deploy o pubblicazione automatica; migration/search/review/extension verificate dopo merge. Gate 1 solo dopo baseline e restore riusciti |

Superficie prevista: questa roadmap e, se necessario, `.github/workflows/backend-image.yml`, `frontend-image.yml`, `build-image.yml`, `extension-release.yml`, `format.yml`, `regression.yml` e correzioni puntuali alle istruzioni **esistenti**. Nessuna modifica funzionale backend/frontend/extension prevista in FASE 1; eventuali difetti della baseline si riportano prima di ampliare il perimetro. Nessuna nuova migration. Configurazioni operative private soltanto in percorsi ignorati. Possibili correzioni future nel fork, senza PR upstream: fix salvataggio preview/file, test di crash/paginazione sync, race fill-gaps e guardie URL, ciascuno separabile e da riprodurre prima.

## Ricognizione fork (compilare nella FASE 0)

Ricognizione pubblica API GitHub del **12/10/2026**. `gh` non disponibile; usati endpoint REST `repos/.../forks?per_page=100&page=1` (11 risultati), pagina 2 (0), `commits/<default_branch>`, `branches` e `compare/<SHA upstream>...<SHA fork>`. Base di tutti i confronti: `1408b09c5989499b38ee0effd1b7c29661a233a5`, confermata anche sull'upstream remoto. Tutti i default branch sono `main`. Date `pushed_at` sotto in **UTC**, non data del commit HEAD. Il conteggio UI web consultato era 10: non sostituisce i risultati API. `+/-` conta commit distintivi/mancanti nel grafo, non funzionalità; uno squash upstream può risultare ancora divergente.

| Fork e SHA                                                                                                                                 | Delta rispetto a upstream                                                | Aspetto utile e test                                                                    | Integrazione / riferimento / ignorare                                                                                                                                            | Verificabilità                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [JurgenCS/Thingport](https://github.com/JurgenCS/Thingport), main `1408b09c5989499b38ee0effd1b7c29661a233a5`; push 11/10 22:55:31          | Identico +0/-0; develop `8789f0147b9dd48e196dee0698a0549397b1d94f` +1/-0 | Solo roadmap su develop, nessuna feature propria                                        | Mantenere base corrente                                                                                                                                                          | HEAD e develop remoto verificati                                                                     |
| [jontstaz/Thingport](https://github.com/jontstaz/Thingport), `68397d4c46fd5e755166e306ac20cb3e0604936f`; push 08/10 02:01:57               | +6/-23; 34 file delta                                                    | Cults3D; `allowNoPlates` e UI `files_pending`; 2 file test aggiunti, HTTP/DNS mock + DB | **Riferimento** per distinguere metadati/file; ignorare nuovo provider nel MVP. Rischio alto su import/schema/extension                                                          | Patch e test letti, non eseguiti; LICENSE AGPL blob uguale upstream                                  |
| [patrickream1980/Thingport](https://github.com/patrickream1980/Thingport), `423dad0dcf2cb0bf222cac62b89b9bd274232d37`; push 07/10 20:33:27 | +11/-25; 5 file delta; branch bulk incluso in main                       | Bulk category e filtro `__unassigned__`; nessun test aggiunto nel delta                 | **Riferimento** UX, non merge: conflitto ModelsPage/review; Promise.all può dare esito UI ambiguo dopo successo parziale, stringhe non localizzate, filtro virtuale da confinare | Patch dei 5 file letta; capacità distinte dalla bulk review AI già upstream; LICENSE uguale upstream |
| [caaatpro/Thingport](https://github.com/caaatpro/Thingport), main `04f3106ce84f94c92a08b42fa2546c4e050c1f98`; push 09/10 13:40:51          | Main +0/-52; branch distintivi sotto                                     | Il solo main nasconde gli sviluppi pertinenti                                           | Ignorare main come fonte di nuove feature; esaminare patch isolate                                                                                                               | HEAD, branch, confronti verificati                                                                   |
| [prostoimax/Thingport](https://github.com/prostoimax/Thingport), `f3b3fb78e37314c4e0e01257f1dd76f208be3008`; push 24/09 18:04:25           | +0/-104                                                                  | Nessun commit distinto, solo main                                                       | Ignorare                                                                                                                                                                         | Verificato via compare                                                                               |
| [angusmaul/Thingport](https://github.com/angusmaul/Thingport), main `bc0e06218014ee716473d972139c49b4d249685a`; push 23/09 08:28:36        | Main +0/-113; fix sotto                                                  | Fix filename già adottato upstream                                                      | Ignorare duplicazione                                                                                                                                                            | HEAD e branch verificati                                                                             |
| [Ruivalim/Thingport](https://github.com/Ruivalim/Thingport), main `56f842ed6fdc517d4ce7174faa0d61143d216744`; push 10/10 17:53:16          | Main +0/-115; tre branch distintivi sotto                                | AI, queue e fix Firefox; main da solo è fuorviante                                      | Riutilizzare le versioni **già upstream**                                                                                                                                        | Branch, patch e commit squash confrontati                                                            |
| [dmitryzenit/Thingport](https://github.com/dmitryzenit/Thingport), `3bc4f9c96dfe0b07de83d3fbff113efb3d14a2a1`; push 20/09 16:43:19         | +0/-132                                                                  | Nessun commit distinto, solo main                                                       | Ignorare                                                                                                                                                                         | Verificato via compare                                                                               |
| [danhively/thingport](https://github.com/danhively/thingport), `063beb317e8c975f5ac704083b4353b9094e77ba`; push 14/09 06:38:26             | +0/-142                                                                  | Nessun commit distinto, solo main                                                       | Ignorare                                                                                                                                                                         | Verificato via compare                                                                               |
| [s5314s/Thingport](https://github.com/s5314s/Thingport), `063beb317e8c975f5ac704083b4353b9094e77ba`; push 14/09 06:38:26                   | +0/-142                                                                  | Nessun commit distinto, solo main                                                       | Ignorare                                                                                                                                                                         | Verificato via compare                                                                               |
| [richardfrk/Thingport](https://github.com/richardfrk/Thingport), `6469fa2d14dcce729b82cf15fd601c0957e1a221`; push 13/09 13:04:38           | +0/-147                                                                  | Nessun commit distinto, solo main                                                       | Ignorare                                                                                                                                                                         | Verificato via compare                                                                               |

Branch non-default esaminati (oltre a develop del fork corrente):

| Branch / commit immutabile                                                                                                                                  | Delta e qualità osservata                                                                                                                                                                                                                              | Decisione e rischio                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Ruivalim AI `0a28821e326950e21ade598343abf35214ee5a9e`](https://github.com/Ruivalim/Thingport/commit/0a28821e326950e21ade598343abf35214ee5a9e)             | +7/-12, 39 file; provider, review, migration e test AI                                                                                                                                                                                                 | **Già integrato** con squash upstream [708a938](https://github.com/TautvydasDerzinskas/Thingport/commit/708a93822a40a69249232f52de8296006c33b7ae), poi fix base URL/errori. Non cherry-pickare vecchio branch                                      |
| [Ruivalim queue `dc089831d8e907f4ab0e45cb73bb307ae3a7c2bc`](https://github.com/Ruivalim/Thingport/commit/dc089831d8e907f4ab0e45cb73bb307ae3a7c2bc)          | +4/-46, 49 file; coda/retry/reimport, test importQueue/links/reimport                                                                                                                                                                                  | Capacità confluite/adattate in upstream `96da36a` (#6); attuale fill-gaps volutamente non aggiunge file. **Riferimento storico**, evitare ripristino del vecchio reimport                                                                          |
| [Ruivalim Firefox `ea4c01318d4b7c18d50260befcd341c7263efdbb`](https://github.com/Ruivalim/Thingport/commit/ea4c01318d4b7c18d50260befcd341c7263efdbb)        | +1/-115, vecchi 2 file JS/manifest                                                                                                                                                                                                                     | Upstream `a1a8db2` (#2), poi build TS per browser. **Già risolto**, ignorare patch obsoleta                                                                                                                                                        |
| [angusmaul UTF-8 `5c0a25827cee55a1084037582bb8a4821c72bccc`](https://github.com/angusmaul/Thingport/commit/5c0a25827cee55a1084037582bb8a4821c72bccc)        | +1/-113, fileUtils e test filename                                                                                                                                                                                                                     | Upstream `b732992` (#3), decode Latin1/UTF8 e controlli C0/C1 presenti nel checkout. **Già risolto**                                                                                                                                               |
| [patrickream bulk `28ed4940e3a8e7264a367c41d4488b2ccba8618f`](https://github.com/patrickream1980/Thingport/commit/28ed4940e3a8e7264a367c41d4488b2ccba8618f) | +8/-32, 4 file; versione meno recente del suo main                                                                                                                                                                                                     | Nessun vantaggio rispetto al main esaminato. Solo **riferimento**; servono test parziali, paginazione, autorizzazioni e upload dal filtro virtuale                                                                                                 |
| [caaatpro fix edit `db59048a4328b63d717b551a8f5803f7617e8b18`](https://github.com/caaatpro/Thingport/commit/db59048a4328b63d717b551a8f5803f7617e8b18)       | +3/-52, 6 file; commit `d6e5831` filtra ID immagini mancanti, `47add75` separa errori preview/upload e mappa Multer 413, `db59048` fallback randomUUID su HTTP LAN; nessun test nel delta                                                              | **Candidato al riuso isolato** dopo riproduzione/test; bug corrispondenti ancora visibili in EditModelModal/app/uploadMiddleware upstream. Non aumentare limite memoria 8→32 MB senza misura; rischio medio e patch separabili nel fork            |
| [caaatpro backend-v2 `f70939e7daba8d7be6a9ad79de101d3af06fd4ac`](https://github.com/caaatpro/Thingport/commit/f70939e7daba8d7be6a9ad79de101d3af06fd4ac)     | +68/-52; risposta compare limitata a 300 file                                                                                                                                                                                                          | **Ignorare come base**: modularizzazione massiva, upgrade stack e contratti, schema/sharing/CI propri                                                                                                                                              |
| [caaatpro frontend-v2 `795e1635f0a7f84a6e0bf3d642b044dcec1c8a87`](https://github.com/caaatpro/Thingport/commit/795e1635f0a7f84a6e0bf3d642b044dcec1c8a87)    | +62/-52; compare limitato a 300 file, test presenti ma non eseguiti                                                                                                                                                                                    | **Ignorare come base**: sostituzione frontend, rimozione bridge e superfici upstream, incompatibile con budget di divergenza                                                                                                                       |
| [caaatpro modernization `e0a4f6145f2737847627460493bddc664018543b`](https://github.com/caaatpro/Thingport/commit/e0a4f6145f2737847627460493bddc664018543b)  | +69/-52; compare limitato a 300 file. Ispezionati schema, `modules/processing/queue.ts`, `modules/accounts/apiTokens.ts`, `http/rateLimit.ts`: stato job persistito, claim updateMany, token scoped e rate limiter; test di token/rate/access presenti | **Riferimento mirato** per FASE 4/sicurezza; niente trapianto: nessun fingerprint AI, single drainer e recovery globale non bastano per multiworker; migrazioni/sharing e riscrittura non pertinenti. Test e copertura completa **NON VERIFICATI** |

Provenienza/licenza: jontstaz e patrickream mantengono il blob LICENSE upstream `e6c7a0296fb68c3c08859b5bc3fb0b8df9e2eb2a`; nei due ref caaatpro fix/modernization il blob `be2426e68c5730bee8c85d79709bebbe866e1291` conserva testo AGPL v3 con intestazione aggiunta (API automatica `NOASSERTION`, non una prova di licenza incompatibile). Prima di adottare qualsiasi patch verificare attribuzioni e dipendenze dello specifico commit. Nessun clone, merge, cherry-pick o import di codice effettuato. Audit completo dei default HEAD e dei branch elencati; non prova assenza di ulteriori PR non associate a questi branch o correttezza runtime. I grandi fork non sono stati auditi integralmente oltre i file pertinenti indicati.

## Compatibilità upstream (compilare e mantenere)

| Voce                                            | Stato                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SHA e data base upstream                        | `1408b09c5989499b38ee0effd1b7c29661a233a5`, commit 11/10/2026 23:20:21 Europe/Rome; API HEAD remoto verificata 12/10/2026 identica al tracking locale; ultimo tema notifiche. AI upstream #11 già presente, poi normalizzazione base URL `29c54ba` ed errori `5fcadfb`: non reimplementare                                                                                                                                             |
| Origin del fork / upstream remote               | origin `https://github.com/JurgenCS/Thingport.git`; upstream `https://github.com/TautvydasDerzinskas/Thingport.git`, fetch/push corretti; default branch remoto del fork main. Nessuna modifica ai remoti                                                                                                                                                                                                                              |
| Stato `main` mirror                             | main = origin/main = upstream/main = SHA base; `git diff --exit-code main upstream/main` 0, antenato develop. Nessun reset/riscrittura necessario; protezione main API `false`, da predisporre soltanto con autorizzazione remota                                                                                                                                                                                                      |
| Stato `develop` e divergenza                    | HEAD = origin/develop = `8789f0147b9dd48e196dee0698a0549397b1d94f`, +1/-0 rispetto a main; unico commit `docs: add Thingport AI roadmap`, diff iniziale 1 file/536 righe. Audit locale non committato: roadmap e `.gitignore`; nessun delta applicativo, nessuna migration                                                                                                                                                             |
| Moduli upstream a rischio conflitto             | Alto: schema/migration/tsvector, importService/importJobRunner/collectionSync*, aiCategorizationService/settingsService/printCategoryService e DTO/route correlate; UI ModelsPage/ModelSidePanel/AiPage; extension shared API/URL/normalizer. Medio: workflow build/release e Compose. Preferire aggiunte circoscritte e preservare contratti extension; bridge/web fuori perimetro                                                    |
| Prossimo aggiornamento upstream: test richiesti | Ramo temporaneo da develop pulito, main fast-forward soltanto se possibile, merge controllato senza riscrittura. Prisma generate + tutte le migration su snapshot sacrificabile e controllo GIN/generated columns; backend AI/sync/import/tenant/storage/search; frontend verify; extension verify/lint Firefox e smoke browser; pack Playwright e restore. Verificare versioni API e file dopo relocation. Nessun deploy implicito    |
| Correzioni del fork da mantenere separabili     | Ricognizione FASE 0: nessuna implementata. Candidati generici nel fork dopo riproduzione: crash/paginazione sync, precedenze concorrenti, salvataggio preview/file e URL guard; tenere separati da multi-facet/embedding. I contributi Ruivalim e angusmaul già integrati non sono feature mancanti                                                                                                                                    |
| CI e distribuzione del prodotto                 | Workflow backend/frontend/extension su PR main e push main, tag di immagini e release possono pubblicare automaticamente; format su tutte le PR, regression schedule/manuale. Estendere gli stessi workflow verso develop con gate e pubblicazione esplicitamente controllata. Compose locale builda sorgenti, deploy Compose usa immagini upstream: non usarle per il prodotto personalizzato; mantenere SHA/schema/modelli tracciati |

## Registro avanzamento (aggiornare qui, NON generare file di diario)

- **FASE 0 — completata il 12/10/2026; Gate 0 PASS (audit statico), nessuna certificazione runtime in quella fase.**
- **Base:** develop `8789f0147b9dd48e196dee0698a0549397b1d94f`; upstream/main e main `1408b09c5989499b38ee0effd1b7c29661a233a5`, HEAD remoto confermata; +1/-0, soltanto roadmap prima dell'audit.
- **Decisioni:** riusare import/sync, provider AI compatibile Ollama, review, categorie/tag e full-text già upstream; estensioni multi-facet, durabilità e semantica solo nelle rispettive fasi.
- **Fork:** 11 default HEAD e 9 branch aggiuntivi esterni confrontati; AI/queue/filename/Firefox già upstream; fix edit caaatpro candidato isolato, altri fork riferimento o ignorati, nessuna patch adottata.
- **File:** aggiornate soltanto le quattro sezioni predisposte di questa roadmap e `.gitignore` per `.agent_private/`; artefatti di ricognizione esclusi da Git. Nessun sorgente, dipendenza, migration o architettura modificato.
- **Verifiche:** stato/ancestry/mirror, parsing 12 manifest/lockfile, inventario 54 test backend/8 frontend/8 spec E2E/49 migration, controllo diff/sezioni/path/ignore superati; suite applicative non eseguite, dipendenze e DB test assenti.
- **Limiti:** Default collection, condizioni MakerWorld, download reali, qualità Ollama, daemon Docker, backup/restore e risultati CI runtime non verificati; non bloccano l'identificazione del delta prevista dal Gate 0.
- **Rischi:** precedenze e race, troncamento sync/finestre di crash, AI in memoria, credenziali/confini di rete, migration e CI main-only; dettagli e mitigazioni nell'audit.
- **Passo successivo:** FASE 1 soltanto dopo autorizzazione esplicita: baseline isolata, build/test, Grab locale, backup+restore e gate develop sugli stessi workflow; niente implementazioni AI anticipate.
- **Operazioni Git/remoto:** nessun commit, branch creato, fetch, merge, push, PR, deploy o impostazione remota modificata; audit lasciato revisionabile nel working tree.

- **FASE 1 — completata il 12/10/2026; Gate 1 PASS locale**, con i limiti esplicitati nella validazione della fase; FASE 2 non avviata.
- **Base e ramo:** `feat/baseline-safety` da `develop`; main/upstream invariati a `1408b09`; base fork `8789f01`, mirror e merge provvisorio verificati senza conflitti attuali.
- **Ambiente:** Node 22.17.1/npm 10.9.2 di nvm; immagini locali dai Dockerfile upstream; DB dev/test, storage e account sintetici isolati, porte loopback, AI/sync/integrazioni remote disattivati.
- **File:** 6 workflow CI, `.gitattributes`, nuovo `backend/.dockerignore` (contesto senza secret/dipendenze host), CONTRIBUTING/DEVELOPMENT, compose e test consume della regression, fixture consume backend; nessun nuovo file applicativo, dipendenza o migration.
- **Baseline:** Prisma generate, lint/build backend, frontend verify (42 test), extension verify e Firefox lint (0 errori/8 warning) PASS; backend Linux non-root 492/492, regression completa 37/37 PASS.
- **Formato/CI:** `npm run format:check` con gofmt PASS su copia LF privata in Linux; Prettier con `--end-of-line auto` PASS sul checkout Windows; parsing YAML e matrice di pubblicazione PASS, Actions remote non eseguite.
- **Correzioni minime:** LF obbligatorio per shell Windows→Docker, membro esplicito nella fixture backend e selettore link nelle notifiche E2E; nessun cambiamento runtime o schema, limitazioni Windows documentate.
- **Recupero e Grab:** restore DB+storage con 22 tabelle/12 file identici e 4 download API verificati; unpacked Linux con login popup/API PASS, host locale preautorizzato, consenso nativo/provider reali non testati.
- **Git/privacy:** push impliciti disabilitati localmente; audit FASE 0 e ignore preesistenti mantenuti separati dal commit della FASE 1; artefatti/credenziali esclusivamente in `.agent_private/`; nessun push, PR o cambio remoto.
- **Passo successivo:** FASE 2 da autorizzare separatamente: raccolta MakerWorld di test, supporto Default verificato, import/sync/deduplica/file offline/crash; restano i rischi funzionali descritti nell'audit.

- **FASE 2 — incremento locale verificato il 12/10/2026; Gate 2 BLOCKED** sulla verifica reale MakerWorld; FASE 3 non avviata.
- **Base/upstream:** `develop` alla FASE 1 `692c867`; ramo `feat/acquisition-reliability`, commit applicativo `cce813b`; HEAD upstream remoto successivamente osservato a `6993a4c` (+10 commit, 5 migration), main/base incorporata `1408b09` invariati; nessun aggiornamento upstream integrato; pubblicazione limitata al ramo di lavoro su `origin`.
- **Riuso/file:** servizi/test backend già indicati; nella chiusura reale `extension/scripts/manifest.ts` (+2 righe, permesso cookie) e `downloadResolver.ts` (1 riga, profilo esplicito senza fallback raw); nessun nuovo sorgente pubblico, dipendenza, migration, API o architettura.
- **Fix:** listing strict, totale/ID/progresso validati, cap 300 invariato ed errore senza job/ID avanzati; successiva patch distingue challenge Cloudflare 403 da sessione rifiutata, senza retry o nuovo meccanismo di acquisizione.
- **Test:** baseline **54 file/509 backend PASS** (+17); patch Cloudflare successiva: 2 regressioni FAIL prima, poi **2 file/49 test PASS**, build/lint PASS. Grab verify PASS, Firefox 0 errori/8 warning; nvm Node 22.17.1/npm 10.9.2 host. Intera suite non rieseguita dopo la patch diagnostica.
- **Resilienza:** provider sintetico: SIGKILL durante stream, recovery, Sync now e scheduler PASS; provider reale: SIGKILL dopo import, persistenza e download via frontend con listing rifiutato PASS; nessuna equivalenza dichiarata con un crash durante download MakerWorld.
- **Commit/pubblicazione:** `cce813b` contiene il primo incremento backend; `bef9929` contiene i fix Grab e diagnostica Cloudflare; audit/roadmap e ignore sono inclusi nella pubblicazione del ramo `feat/acquisition-reliability` sul solo fork `origin`. `develop` conserva la baseline FASE 1; incremento FASE 2 non integrato mentre il Gate resta aperto. Nessuna PR upstream.
- **Dati:** istanza ordinaria esclusa dalle scritture; prova reale isolata su immagini `cce813b`, porta 18084, rete/storage dedicati e DB `thingport_gate2_real` sul PostgreSQL di test esistente; 49 migration incorporate; artefatti/credenziali soltanto in `.agent_private/` ignorata.
- **Prova reale:** sessione Grab/backend e import PASS dopo fix permesso; profilo 3MF da 5.482.609 byte identico alla sorgente dopo fix fallback, geometria caricata dal parser upstream; deduplica modello/profilo e doppia membership PASS. Default esclusa, nessuna selezione individuale nel batch MakerWorld Grab 1.4.0, cap 300 invariato.
- **Blocker/passo successivo:** diagnosi mirata conferma 403 HTML con `cf-mitigated: challenge`; corretto il falso messaggio di sessione scaduta, accesso backend ancora bloccato. Serve modalità consentita dal provider, poi incremento/due sync/rimozione/recupero reali. Timer spento, Gate BLOCKED, FASE 3 non autorizzata.

---

## Prompt operativo iniziale da impartire a GPT-6.1 (copiare in Codex)

> Agisci come maintainer di un fork di Thingport, non come autore di una nuova applicazione. La nostra priorità è restare vicini all'upstream e aggiungere **solo** classificazione intelligente, ricerca semantica e UX strettamente necessaria.
>
> Leggi **integralmente** `docs/AI_ROADMAP.md` — incluse le sezioni 0A, 0B, 0C — poi `README.md`, `CONTRIBUTING.md`, `docs/DEVELOPMENT.md` e la documentazione dell'estensione se presenti. Verifica lo stato corrente del checkout prima di agire: `git status`, branch, commit SHA, `git remote -v` e differenze da upstream; verifica invece di presumere nomi di branch, percorsi o file.
>
> **Questa esecuzione è limitata alla FASE 0.** Esegui una ricognizione tecnica _in sola lettura_ dell'architettura reale, schema Prisma, AI eventualmente già esistente, search, import/sync MakerWorld, storage, extension, test e deployment. Identifica il delta minimo che ci separa dal prodotto desiderato. Esamina i fork pubblici via GitHub CLI/API se accessibile e riporta soltanto differenze documentate da commit e codice; se l'accesso è impossibile, segnalo come NON VERIFICATO e prosegui sull'audit del repository.
>
> Proponi esplicitamente come mantenere `main` quale mirror di upstream e `develop` quale ramo delle nostre funzionalità, adattandoti allo stato reale del fork senza operazioni distruttive. Identifica aree di conflitto, miglioramenti generici separabili nel fork senza PR verso upstream e modalità di test/merge sicuro.
>
> Non implementare feature, non introdurre dipendenze o migration, non creare altri report, file `AGENTS.md`, directory o nuove applicazioni. **Puoi modificare soltanto le tabelle Audit tecnico, Ricognizione fork, Compatibilità upstream e Registro avanzamento già esistenti in questa roadmap.** Non eseguire push, PR, deploy, reset/force push, modifica branch remoti né commit; non modificare `.env` o database. Se alcune verifiche non sono disponibili, descrivi il limite senza inventare prove.
>
> Al termine presenta: (1) tabella Esiste/Parziale/Manca con riferimenti ai file, (2) fork utili verificati e motivi, (3) top 5 rischi di manutenzione, (4) proposta di delta minimo, (5) esito PASS/FAIL/BLOCKED del Gate 0 e passo concreto verso la FASE 1. **Fermati. Non procedere senza una mia istruzione esplicita.**
