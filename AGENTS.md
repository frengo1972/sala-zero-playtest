# Sala Zero Playtest — linee guida per gli agenti

Valgono per ogni assistente o agente (Claude, GitHub Copilot, Codex e altri) che lavora su questo repository. Si scrive in italiano.

## Cos'è questo repository

È il banco di prova pubblico di Sala Zero.

- Il ramo **`playtest`** contiene le versioni candidate dei giochi ed è pubblicato con GitHub Pages su <https://frengo1972.github.io/sala-zero-playtest/>.
- Il ramo **`main`** contiene il README con le versioni da provare, i controlli prima del rilascio e gli esiti delle prove. Le segnalazioni si raccolgono nelle issue.

Lo sviluppo avviene in un laboratorio privato; il catalogo definitivo è [sala-zero](https://github.com/frengo1972/sala-zero).

## Regole

- **Solo i file del gioco.** Sul ramo `playtest` vanno solo i file necessari a giocare: niente dossier, note, prompt, file di lavoro o materiali di progettazione.
- **Salvataggi separati.** Le versioni di prova usano chiavi di salvataggio e profili dedicati (suffisso `-playtest`), così non toccano quelli del catalogo pubblico.
- **Pubblico.** Niente segreti, token, indirizzi email o URL interni. Prima di ogni push si ricontrolla l'elenco dei file.
- **Tracciabilità.** Ogni versione inviata indica gioco, versione e commit di origine nel messaggio di commit e nel README.
- **Esiti.** L'esito di una prova riporta gioco, versione, dispositivi, risultato di ogni controllo del README e problemi aperti con il link.
- **Minori, originalità e crediti.** Valgono le stesse regole del catalogo: niente account, chat, tracciamento o acquisti con estrazioni casuali nei giochi per tutti; solo asset originali con licenze e crediti.
- **Pubblicazione.** Il proprietario ha autorizzato in modo permanente gli agenti a unire e pubblicare su `main`: si lavora su un ramo, si verifica, si unisce e si riporta al proprietario cosa è stato pubblicato. Servono invece l'ok esplicito per force push, cancellazione del repository e cambi di impostazioni.
