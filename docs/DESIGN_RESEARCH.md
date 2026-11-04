# ALIBI — Design Research (layout principles)

Art direction: **Forensic Modernism (primary) × Victorian Gothic (secondary)**. Researched 2026-11-04.
Purpose: extract *transferable principles*, not visual copies. Nothing below is to be reproduced; every ALIBI asset is original.
Legend: **[V]** verified on the cited page this session · **[S]** from secondary sources/reviews · **[U]** could not verify.

## 1. Victorian scientific plates (Haeckel, BHL)
- **Numbered plate as the unit.** *Kunstformen der Natur* is 100 plates (1899–1904), each identified by plate number + group name ("81. Thalamophora; Lagena"). The number is the primary key; the name is secondary. [V] https://commons.wikimedia.org/wiki/Kunstformen_der_Natur
- **Figures inside a plate are keyed, not captioned.** Individual figures carry small numerals/letters; explanation lives in a separate key ("spot key for figures"). Keeps the image clean. [V] same URL
- **Plates issued in numbered fascicles (Hefte)** with a bilingual contents list pairing plate numbers to subjects → plate series feel like a catalogue. [S] https://sourcelibrary.org/artwork/kunstformen-der-natur-bhl47388285 (mirror; descriptions partly auto-generated)
- **Symmetry + generous margin.** Specimens arranged on a central axis within a ruled field, captions outside the image field. [U — observed convention, no single citable spec]

## 2. Museum collection record pages (Wellcome, Cooper Hewitt/Smithsonian, Rijksmuseum)
- **Fixed field order, short labels.** Wellcome: Title → Date → Reference → "Part of" hierarchy → viewer → Licence & credit → "About this work" (Description, Physical description e.g. "1 glass plate negative; 12 x 16.5 cm", Notes) → Where to find it → Permanent link. [V] https://wellcomecollection.org/works/ah23u2ck
- **Reference number is prominent and repeated in the title** ("M0013915: Catalogue of…"). IDs are content, not metadata noise. [V] same
- **Provenance gaps shown openly.** Cooper Hewitt records state "Gift of Unknown Donor" and "Research in Progress" rather than hiding uncertainty; accession numbers like 1916-29-21-c; dimensions given as H × W × D. [V] https://collections.si.edu/search/detail/edanmdm:chndm_1980-36-924
- **Hierarchy breadcrumb** (collection → series → item) gives archival depth cheaply. [V] Wellcome, above
- **Image + basic data first, full record one step deeper** (Rijksmuseum object page pattern). [S, dated 2013] https://bbf.enssib.fr/consulter/bbf-2013-05-0061-015.pdf — current Rijksmuseum object page layout **[U]**.

## 3. Experimental editorial web design
- **Archival/analog type tone carried by restraint**: Readymag Websites of the Year 2025 Jury Choice (Repponen, *People Look at Art…*) praised for minimalist typography and an "archival/analog tone". [V] https://blog.readymag.com/websites-of-the-year-2025/
- **Grid established, then deliberately broken** at a few moments (Jo Iijima portfolio, Readymag Choice 2025). [V] same
- **Dense material revealed progressively**, balancing image, text and blank space; motion only to guide reading (Wakuli Impact Report, Community Choice). [V] same
- Awwwards has no "editorial site of the year" 2025 category I could confirm; typography-led SOTDs exist. [U] https://www.awwwards.com/inspiration_search/winner_category_typography/

## 4. Gothic literature book design (Penguin, Folio Society)
- **Two-colour limitation.** Bickford-Smith's Penguin Gothic Horror covers are confined to two hues, citing Romek Marber's grid as inspiration → constraint reads as authority. [S] https://www.varsity.co.uk/culture/1193
- **One emblematic motif, repeated as pattern** (Clothbound Classics: foil-stamped repeat; Dracula's garlic flower "to trap Dracula inside the book"). Motif carries meaning, not decoration. [S] https://www.themarginalian.org/2010/11/22/coralie-bickford-smith-penguin-book-covers/
- **Series system over single cover**: fixed title band + variable motif makes many titles read as one set. [S] same
- **Folio: blocked cloth binding, printed slipcase, few full-page plates** (e.g. Frankenstein, 7 full-page illustrations, Angela Barrett) — illustration is rationed. [S] https://www.foliosociety.com/uk/dracula, https://www.foliosociety.com/fiction/horror-gothic
- Metallic (gold/red) blocking used sparingly for accent only. [S] Folio listing above

## 5. Historical police documents (Bertillon)
- **Full-face + profile photograph pair** under standardised lighting, distance, pose and scale. [V/S] https://www.nlm.nih.gov/exhibition/visibleproofs/galleries/artifacts/bertillon.html
- **Photos on one side, name + measurements + notes on the reverse** → natural front/back card flip. [V] same
- **Measurement table** (11–14 anthropometric measures; sources disagree) plus coded descriptors and a "distinguishing marks" field (scars, tattoos). [V] same; count discrepancy [S] https://dnalc.cshl.edu/view/11916-Anthropometry-card-of-Alphonse-Bertillon-who-originated-this-criminal-identification-system-of-profile-and-full-face-photos-and-key-body-measurements.html
- **Portrait parlé**: a comparison chart of isolated features (ears, noses) mounted side by side. [S] same NLM gallery
- **Card numbers + filing logic** (e.g. "20213") are visible on the record. [V] NLM; exact field labels [U]. Physical example: https://collection.sciencemuseumgroup.org.uk/objects/co8613506/criminal-record-card-with-photograph-record-document

## 6. Mystery games
- **Murdle (live, murdle.com)**: daily puzzle framed as WHO? / HOW? / WHERE? / WHY?; solved via a cross-elimination grid (suspect×weapon×location). Uppercase labels, small icon nav. [V/S] https://murdle.com/ (render not confirmed in fetch)
- **Obra Dinn**: the notebook (crew roster + sketches + fate entries) *is* the UI; answers confirmed only in batches of three, preventing brute force. [S] https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn, https://filmstories.co.uk/?p=83249 — dev rationale [U]
- **Golden Idol**: separate "thinking" screen; sentences with blanks filled from a word bank colour-coded by word type. Sequel made statements movable panels so evidence stays visible while deducing. [S] https://thinkygames.com/reviews/the-rise-of-the-golden-idol-review, https://adventuregamehotspot.com/2022/11/21/the-case-of-the-golden-idol
- **Her Story**: one mechanic (search a police database); diegetic retro desktop; search history stored and visible. Dated look is styling only, function is plain. [S] https://en.wikipedia.org/wiki/Her_Story_(video_game)
- Shared lesson: the *document is the interface*; deduction UI must keep evidence in view. Note: all four are 2015–2024 titles, still current references; Golden Idol original UI was criticised as overbearing/fiddly. [S]

## Synthesis — rules for ALIBI
1. **Suspect record = Bertillon card.** Front: full-face + profile SVG portrait pair in equal frames, card no. ("FILE 20·417"). Back (flip/tab): measurement table, coded descriptors, "Distinguishing marks", alibi statement.
2. **Evidence = numbered plate.** Roman plate label ("PL. IV") top-left, keyed figures (1, 2, a, b) inside the engraving, caption + key *beneath* the image, never overlaid.
3. **Every object gets a reference number** shown in its title (e.g. "EX-07 · Pocket watch, cracked crystal") — the ID is the primary identifier, name secondary.
4. **Fixed record field order** for every exhibit/witness: Title → Ref → Date/Time → Location → Physical description → Notes → Provenance ("Found by…"). Same labels, same order, every case.
5. **Uncertainty is shown, not hidden**: "Unverified", "Research in progress", "Witness unknown" as first-class states (matches the game's truth/claim split).
6. **Dark ink hero band vs. ivory record sheets.** One dark masthead (case title, date, case no.) above light paper records; never dark records.
7. **Two inks + one accent.** Ink and paper plus a single oxblood accent used only for verdict/contradiction marks (Penguin two-colour, Folio sparing metallic). 
8. **Deduction board keeps evidence visible**: accusation/sentence-builder sits beside the records, not on a separate screen (Golden Idol sequel lesson).
9. **Batch or cost verification** to stop brute force (Obra Dinn's three-at-a-time logic) — e.g. limited accusations per day.
10. **Breadcrumb archive depth**: Case → Dossier → Exhibit, styled as a catalogue hierarchy.
11. **Grid first, break it once**: strict 12-col editorial grid with marginalia column for notes; one deliberate break per screen (the hero portrait or the verdict).
12. **One emblem per case**, repeated as a subtle pattern (endpaper / card back), carrying the case's meaning.

## Avoid
- Copying any specific plate, cover, card or game screen; recognisable Haeckel compositions; Penguin/Folio trade dress; Murdle's WHO/HOW/WHERE/WHY label set.
- Parchment textures, burnt edges, blood splatter, "Victorian" script fonts for body text, skull clip-art.
- Real criminal photographs or real Bertillon records of identifiable people.
- Faux-dated UI that hampers function (Her Story lesson: style the chrome, keep interaction plain).
- Separate "thinking" screens that hide evidence; colour as the only carrier of meaning (accessibility).
- Overlaying captions on illustrations; more than one accent colour.

## Licensing note
Public-domain/open sources exist: Biodiversity Heritage Library (public domain or CC; "no known copyright restrictions" is the scanning institution's judgement, not a legal guarantee, and is jurisdiction-dependent) https://about-new.biodiversitylibrary.org/?p=1027, BHL Flickr https://flickr.com/people/biodivlibrary; Wellcome Collection items under Public Domain Mark or CC BY (per item) [V]; Wikimedia Commons scans (licence per file page) [V]; Smithsonian Open Access (per-record terms) [S].
**Decision: ALIBI uses none of them at runtime.** All illustration is original, hand-authored SVG line art committed to the repo; no runtime image APIs, no hot-linked or scraped engravings. References above inform principles only.
