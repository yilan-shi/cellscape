# Cell Imaging and Claude

## Bottlenecks at the Frontier of Live Cell RNA Biology, Grounded in Direct Lab Experience

> A reorganized synthesis of the live cell imaging bottleneck analysis, framed around four priority axes (live cell tracking, subcellular structure labeling and imaging, temporal dynamics, and RNA focused questions), grounded in the scientific lineage that prepared you to attack them, and mapped to the CellDiff architecture. Designed to be lifted directly into the May 14 Anthropic STEM Fellow submission.

---

## 1. Scientific Lineage Anchoring This Document

The bottlenecks below are not abstract field complaints. Each one is an open problem that your training has been pointed at for over a decade.

**UCLA, Iruela Arispe lab.** Your senior thesis examined VEGFR2 in nonpathological endothelial cells responding to oxidative stress. The receptor trafficking and stress response framing is structurally identical to the arsenite induced stress granule biology you later worked on at Yeo Lab and the stress paradigm CellScope models.

**NIH, Kalab lab, Center for Cancer Research.** You designed biochemical assays to elucidate cell cycle proteins regulating, nucleating, and maintaining the mitotic spindle in a cell free cytoplasm in vitro system. The lab's discovery during your time there that importin alpha family proteins positively regulate mitotic spindle integrity is the kind of subcellular structure biology that volumetric imaging is supposed to resolve but currently cannot at the level of dynamics.

**Lawrence Livermore National Laboratory, Mass Spectrometry Core.** With Ognibene and Enright, you found that environmentally relevant fetal triclocarban exposure disrupts lipid metabolism in mice. This trained you in quantitative molecular measurement on cellular and organismal scales, the exact half of the imaging to sequencing bridge that current live cell imaging cannot reach.

**Yeo Lab, UCSD, Biomedical Sciences PhD.** You authored the 2020 Nature Cell Biology Perspective with Smargon and Yeo on RNA targeting CRISPR systems, which framed the RCas field's transition from metagenomic discovery to transcriptomic engineering (Smargon, Shi, Yeo, Nat Cell Biol 22, 143 to 150, 2020). Your thesis work focused on two questions: RNA cycling dynamics in stress granules over time, and subcellular compartmentalization of transcripts during neuronal injury and repair.

**Those two thesis questions are the spine of this document.** They sit precisely on the frontier of what current live cell RNA imaging cannot do, and they map one to one onto the four axes below.

**Stanford, current.** Data science master's, Martinez Lab adjacency through Dario and senior postdocs, alignment with Nicole Martinez's pseudouridylation and alternative splicing work (Martinez et al, Mol Cell 2022), and with the broader Stanford imaging community (Moerner single molecule super resolution, Qi CRISPR Cas engineering).

---

## 2. The Four Priority Axes

```
╔══════════════════════════════════════════════════════════════════╗
║              FOUR PRIORITY AXES OF THIS ANALYSIS                 ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   AXIS I.    Live Cell Tracking                                  ║
║              "follow one molecule for as long as possible"       ║
║                                                                  ║
║   AXIS II.   Subcellular Structure Labeling and Imaging          ║
║              "see where it is in 3D, with respect to what"       ║
║                                                                  ║
║   AXIS III.  Temporal Dynamics                                   ║
║              "watch how it changes, without killing the cell"    ║
║                                                                  ║
║   AXIS IV.   RNA Focused Questions                               ║
║              "identify what it actually is at the molecular      ║
║               level: isoform, modification, processing state"    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

### Axis I. Live Cell Tracking

#### What the field can do today

Track single mRNAs in living cells using MS2 and PP7 stem loop arrays bound by fluorescent coat proteins, with single molecule resolution since 2003. Tag endogenous loci with the MS2 system to study mRNA dynamics in live mouse brain tissue. Use RCas9 (which your lab developed and which your Nature Cell Biology Perspective formalized) and dCas13 for live cell RNA imaging without inserting stem loop arrays. Fluorogenic aptamers (Spinach, Broccoli, Mango II arrays, Pepper, Peach) enable single molecule resolution in live cells, with the Mango II 24x array notably bright (Cawte et al, Nat Commun 11, 1283, 2020).

#### What the field cannot do

The Yeo lab review (Le, Ahmed, Yeo, Nat Cell Biol 24, 815 to 824, 2022) is explicit about the live cell tracking ceiling. Live cell imaging is "limited to a single gene per colour." Cas based methods do not yet reach single molecule resolution. Long term tracking is bounded by phototoxicity, which is "a limitation to long term single molecule tracking in live cell imaging." Most existing work is on transgenes carrying 24x stem loop arrays, not endogenous transcripts, and MS2 arrays are known to block 5' and 3' exonucleases, altering the very degradation kinetics you are trying to measure (Garcia and Parker 2015 to 2016; Tutucci et al, Nat Methods 15, 81, 2018; reviewed in Cawte 2020).

#### Specific questions scientists want to ask

Track a single endogenous transcript through its entire life cycle from co transcriptional emergence at the gene locus, through nuclear processing, through nuclear pore export, through cytoplasmic transport, through translation, to degradation. Currently impossible at single molecule resolution on endogenous loci over biologically meaningful timescales.

Track multiple distinct RNA species simultaneously to see co processing. The Yeo review explicitly identifies this gap: "the ability to resolve multiple mRNAs as diffraction limited spots has become a challenge, inhibiting our understanding of whether different species of mRNA can be co processing in the same place." Current live cell methods are typically restricted to one or two RNA species per experiment.

For your thesis specifically: track an mRNA into and out of a stress granule across the assembly disassembly cycle, with knowledge of which transcript identity it carries. The SMIS system (Liu et al, Sci Adv 10, eadp5689, 2024) gets partway by tagging the m6A reader YTHDF, but conflates modification status with reader binding.

#### Severity rating

★★★★★ (5 out of 5). This is the moonshot axis. Your RCas authorship is direct domain credentialing.

#### CellDiff layer linkage

Layer 2 (Spatiotemporal Foundation Model). VideoMAE and V-JEPA style pretraining on 4D z-stacks learns to integrate across the temporal dimension a tracking experiment cannot maintain on real samples without bleaching them out.

---

### Axis II. Subcellular Structure Labeling and Imaging

#### What the field can do today

Confocal and spinning disk imaging at lateral resolution near 200 nm and axial resolution near 400 nm. 3D structured illumination microscopy (3D SIM) lateral resolution near 185 nm in two color live samples, axial near 547 nm (Deep3DSIM, Wilding et al, eLife 2025). STED, RESOLFT, and single molecule localization microscopy go below 100 nm but at illumination doses living samples do not tolerate for long. Light sheet imaging gives gentle volumetric speed at the cost of axial resolution. Light field microscopy captures a 3D volume per snapshot but reconstructions are noisy and non uniform.

#### What the field cannot do

The speed, resolution, and toxicity trilemma is unbroken. Volumetric super resolution in living cells "remains a challenge for the field; current implementations of 3D super resolution methods come at the expense of a limited axial range and long acquisition times, often requiring major technical expertise" (Laine et al on eSRRF, Nat Methods 20, 1958, 2023).

Phase separation diagnostics from morphology alone produce false positives. The standard FRAP plus roundness plus fusion plus hexanediol checklist is documented to confuse porous solids and reversible binding clusters with true LLPS condensates (Alberti, Gladfelter, Mittag, Cell 176, 419, 2019; McSwiggen et al, Genes Dev 33, 1619, 2019). Diffraction limited features look spherical by construction.

Multi color imaging in live cells is "limited to three or four" colors due to broad fluorescence spectra. Six colors is the practical ceiling with sophisticated spectral unmixing (Valm et al, Nature 546, 162, 2017). Newer eight color systems exist (Hubatsch et al, Nat Photonics 19, 1106, 2025) but are not widely adopted.

Segmentation of organelles and substructures in 3D remains a manual annotation bottleneck. Automated segmentation pipelines (Cell Pose, ASEM, OpenOrganelle, COSEM) all require expert annotations that are laborious to produce (Heinrich et al, Nature 599, 141, 2021; Gallusser et al, J Cell Biol 222, 2023).

#### Specific questions scientists want to ask

In an arsenite stressed cell, are these bright nuclear MALAT1 foci true LLPS condensates, gel intermediates, or porous binding clusters? Standard morphology cannot tell you. Your CellScope Gap 2 (Phase Separation Misclassification) is the field's bottleneck, not Claude's idiosyncrasy.

In a neurite, what is the exact distance of an mRNA from the nuclear envelope, the ER membrane, the closest microtubule, and the closest mitochondrion, in 3D? With current widely available tools you can estimate but not quantify.

Can you simultaneously image MALAT1, an mRNA, the nuclear envelope, mitochondria, the cytoskeleton, a chromatin modifier, an RNA binding protein, and a stress granule marker in the same living cell? In practice no, you image three or four and register replicates.

#### Severity rating

★★★★ (4 out of 5). Hardware physics limits the moonshot, but learned priors over what subcellular state combinations look like (the CellDiff Layer 1 approach) push the boundary.

#### CellDiff layer linkage

Layer 1 (Conditional Diffusion Model) learns the perturbation to morphology to subcellular state mapping that current imaging cannot disambiguate. Layer 4 (Failure Mode Eval Benchmark) provides the segmentation ground truth that downstream subcellular reasoning depends on.

---

### Axis III. Temporal Dynamics

#### What the field can do today

Image fluorescent samples at video rate or faster on confocal and light sheet platforms. Capture single molecule dynamics on the millisecond timescale. Measure splicing kinetics in living cells (Coulon et al, eLife 3, e03939, 2014; STaQTool, Martin et al, Cell Rep 11, 1093, 2015; Wan et al, Cell 184, 2878, 2021 for quasi genome scale nascent RNA imaging).

#### What the field cannot do

Phototoxicity invalidates long term dynamics measurements before any morphological warning sign. Even sub lethal illumination doses cause ROS spikes, intracellular calcium dysregulation, mitotic prolongation, and condensate state changes. Near UV doses as low as 0.6 J/cm² delay mitosis (PhotoFiTT, Mota et al, Nat Commun 16, 11432, 2025). Most published live cell papers do not report illumination dose despite the 2017 Nature Methods consensus call to do so (Laissue et al, Nat Methods 14, 657, 2017). "Illumination overhead," meaning illumination while the camera is not capturing, is the dominant phototoxicity contributor on most microscopes and is fixable but rarely fixed (Kiepas et al, J Cell Sci 133, jcs242834, 2020).

The mismatch of timescales is brutal for full life cycle observation. Splicing of an individual intron takes 20 seconds to minutes. mRNA half lives are hours. Stress granule assembly takes 5 to 20 minutes; disassembly takes 30 minutes to hours. Tracking one transcript across this dynamic range while sampling fast enough to catch splicing means a phototoxic dose totaled across the experiment that the cell will not tolerate.

Temporal trajectory inference from a static image is currently a manual interpretation task. Trained microscopists can guess from morphology where dynamics are heading. No quantitative model does this well. Your CellScope Gap 3 (Temporal Trajectory Inference) is again the field's bottleneck.

#### Specific questions scientists want to ask

How fast does an mRNA enter a stress granule under arsenite stress, and how is its residence time distributed across the population? Mulan's thesis question.

What is the temporal coupling between transcription and splicing for the same gene, at the same locus, in the same cell, across many genes? Sequencing approaches (nano-COP, POINT) give population averages on lysed samples; live imaging gives kinetics for one or two reporter transgenes (Wan 2021 is the current frontier and is still quasi genome scale, not genome scale).

How do the dynamics of organelle organization in a neuron change during injury and repair? Mulan's thesis question. Currently you image fixed time points and infer dynamics; you cannot watch.

#### Severity rating

★★★★★ (5 out of 5). The phototoxicity sub problem is rated lower in this writeup but the broader temporal dynamics ceiling is the central moonshot.

#### CellDiff layer linkage

Layer 2 (Spatiotemporal Foundation Model). Self supervised pretraining on 4D imaging learns to encode static morphology as dynamic history, predicting how a state will evolve. Layer 4 (Failure Mode Eval Benchmark) measures whether the model has learned this.

---

### Axis IV. RNA Focused Questions

This axis is your unique credentialing zone. You sit at the intersection of three communities (Yeo Lab RNA imaging, Martinez Lab RNA modifications, the AI for biology side at Stanford). Almost no STEM Fellow applicant will sit on all three.

#### Subaxis IV.A. Isoform Identity in Living Cells

About 95 percent of human multi exon genes undergo alternative splicing. Current live cell methods report transcript presence, not isoform identity. Live cell intron and exon dual color systems can detect intron retention or excision at a single locus, but cannot identify which alternative exons were included. Isoform resolved methods (SpliceRCA, nanoplasmonic dimer probes) require fixed cells. The Yeo review's outlook section explicitly identifies "the ability to image endogenous small RNAs, such as miRNA, and RNA isoforms" as a gap that "will greatly enhance our understand of RNA biology at subcellular resolution."

Specific questions scientists cannot answer today: in a single neuron under stimulation, which CD45 isoform is being made at the soma versus the dendrite, minute by minute? In a stress granule (your thesis system), which isoforms are preferentially trapped?

Severity rating: ★★★★★

#### Subaxis IV.B. RNA Modifications in Space and Time

Direct bridge from your training to Martinez Lab pseudouridylation and co transcriptional modification work. The cellular m6A imaging methods that exist are fixed cell, end point readouts (m6AISH PLA, DART FISH, PREEM). The one genetically encoded live cell system (GEMS) gives a global activity readout but loses single transcript spatial resolution. SMIS (Liu et al, Sci Adv 2024) achieves spatiotemporal m6A imaging in stress granules, but tags YTHDF reader proteins rather than the modification itself, conflating modification with reader binding. For pseudouridylation in living cells at single molecule resolution there is essentially nothing.

The recent simultaneous m6A and Ψ profiling by nanopore (Hu et al, Nat Chem Biol 20, 1278, 2024) shows the joint readout is new even in sequencing. Imaging is years behind.

Specific questions scientists cannot answer today: when does a Ψ get deposited on a transcript relative to when its first intron is removed? Do stress granule trapped mRNAs (your thesis system, again) acquire m6A before trapping or as a consequence of it?

Severity rating: ★★★★★

#### Subaxis IV.C. The Synthesis Gap Between Imaging and Sequencing

The Yeo review closes with this exact framing: "Future methods incorporating the power of both RNA imaging and sequencing will help us to make a big leap forward in RNA biology." Sequencing methods give molecular precision but no space and no time (bulk RNA seq, scRNA seq) or space but no time (MERFISH, seqFISH, STARmap, ExSeq, Slide seq, Seq-Scope). Live cell imaging gives time and space but cannot read isoforms or modifications.

This is the multilayer story for your proposal. Layer 1 generates synthetic imaging conditioned on perturbation. Layer 2 learns 4D dynamics. Layer 3 predicts sequencing style readouts from spatial state, including isoforms and modifications, anchored on Martinez Lab pseudouridylation data. Layer 4 evaluates the gaps end to end. Read as a unit, CellDiff is the architecture instantiation of the synthesis the field's most authoritative recent review explicitly calls for.

Severity rating: ★★★★★

---

## 3. The Five CellDiff Gaps Reframed Around These Axes

```
╔════════════════════════════════════════════════════════════════════════════╗
║                CELLDIFF GAPS ⇒ FIELD AXES (reframed)                       ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Gap 1 (Z-Dimension Blindness)                                             ║
║  └► Axis II (Subcellular Structure) + Axis III (Temporal Dynamics)         ║
║      The volumetric reasoning failure mirrors the field's 4D imaging       ║
║      trilemma. Yeo review names it explicitly.                             ║
║                                                                            ║
║  Gap 2 (Phase Separation Misclassification)                                ║
║  └► Axis II (Subcellular Structure)                                        ║
║      Diffraction limited foci look spherical regardless of true geometry.  ║
║      Alberti Cell 2019 documents this exact failure mode in the field.     ║
║                                                                            ║
║  Gap 3 (Temporal Trajectory Inference)                                     ║
║  └► Axis III (Temporal Dynamics) + Axis I (Live Cell Tracking)             ║
║      Static morphology to dynamic history mapping is what every            ║
║      trained microscopist does mentally; no quantitative model does it.    ║
║                                                                            ║
║  Gap 4 (Co-localization Quantification)                                    ║
║  └► Axis II (Subcellular Structure) + Axis IV (RNA Focused Questions)      ║
║      Manders and Pearson coefficients are deterministic from 3D stacks     ║
║      but require segmentation, which is the bottleneck.                    ║
║                                                                            ║
║  Gap 5 (Nuclear Boundary Misidentification)                                ║
║  └► Axis II (Subcellular Structure)                                        ║
║      Ground truth segmentation is the upstream gap.                        ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

This reframing matters for your proposal because each Claude failure is now positioned not as a private toy demo but as a Claude specific manifestation of an open frontier the field is actively trying to close.

---

## 4. CellDiff Layers Mapped to the Four Axes

```
                    AXIS I        AXIS II        AXIS III       AXIS IV
                    Live Cell     Subcellular    Temporal       RNA Focused
                    Tracking      Structure      Dynamics       Questions
                    ─────────────────────────────────────────────────────────
Layer 1                ·            ✓✓             ·              ✓
(Cond. Diffusion)    

Layer 2                ✓✓           ✓              ✓✓             ·
(Spatiotemporal FM)

Layer 3                ✓            ·              ·              ✓✓
(RNA Processing)

Layer 4                ✓            ✓              ✓              ✓
(Eval Benchmark)
```

(✓✓ = primary coverage; ✓ = secondary coverage; · = not the focus of that layer)

Read horizontally: each axis is hit by at least two layers, so no single failure mode leaves CellDiff exposed. Read vertically: each layer's purpose is explained by which field axes it targets, not just by which Claude failure it patches. This is the framing reviewers will value, because it shows the architecture has structure beyond reaction to observed gaps.

---

## 5. Implications for the May 14 Submission

A few concrete pulls from this analysis to push into the proposal.

**Reframe the problem statement around the four axes.** The current draft opens with "I tested Claude and found 5 gaps." A stronger opener leads with the four axes (live tracking, subcellular structure, temporal dynamics, RNA focused) which are recognizable to any cell biologist as the field's open frontiers, and only then introduces the five Claude failures as evidence inside that frame. Your former PI's own review (Le, Ahmed, Yeo 2022) uses essentially this framing in its outlook, so reviewers familiar with the field will read it as well grounded.

**Foreground the Yeo Lab and Martinez Lab dual lineage.** You are the only applicant who will have published in Nature Cell Biology on RNA targeting CRISPR systems, trained on RNA imaging tool development for stress granule and neuronal compartmentalization questions, and have warm contact pathways into a Stanford pseudouridylation and alternative splicing lab. The proposal should make this triangulation explicit in two sentences in the bio section and again in the team section.

**Position CellDiff as the synthesis the field's authoritative review explicitly calls for.** The Yeo 2022 review's closing line says: "Future methods incorporating the power of both RNA imaging and sequencing will help us to make a big leap forward in RNA biology." CellDiff is that method. Make this the spine of your architecture section.

**Stress granules as the running example.** Your thesis biology, the arsenite stress paradigm CellScope already models, and the m6A SMIS work that just appeared in Sci Adv all converge on stress granule dynamics. Use stress granules as the running biological example in the proposal rather than scattering across vignettes. It reads as authoritative.

---

## 6. Connector Status Note

While preparing this document, three MCP tools experienced authentication or runtime issues that the user may want to refresh before the May 14 push.

The PubMed connector returned "no approval received" on first invocation, then worked on a subsequent call for the Le, Ahmed, Yeo 2022 review full text retrieval. Likely a transient session re auth, but worth a quick refresh.

The Google Drive connector returned "no approval received" on every search and metadata call. The two folders shared (titled "Training Grants" and "Presentations") are visible by title via web fetch but the connector could not list their contents. PhD context was reconstructed from your public Yeo Lab profile and the Smargon, Shi, Yeo 2020 Nature Cell Biology Perspective. If you re approve Drive access in settings, a follow up pass can integrate specific training grants and slide content directly.

The Visualize tool timed out after four minutes when called for diagram rendering. Document uses Unicode box drawing to convey the same structure inline.

---

## 7. Citations

### Yeo Lab (direct scientific lineage)

Smargon AA, Shi YJ, Yeo GW. RNA targeting CRISPR systems from metagenomic discovery to transcriptomic engineering. Nat Cell Biol 22, 143 to 150 (2020). [DOI](https://doi.org/10.1038/s41556-019-0454-7) [PMID 32015437](https://pubmed.ncbi.nlm.nih.gov/32015437/). Mulan's own Perspective, defining the RCas field framing.

Le P, Ahmed N, Yeo GW. Illuminating RNA biology through imaging. Nat Cell Biol 24, 815 to 824 (2022). [DOI](https://doi.org/10.1038/s41556-022-00933-9) [PMID 35697782](https://pubmed.ncbi.nlm.nih.gov/35697782/) [PMC11132331](https://pmc.ncbi.nlm.nih.gov/articles/PMC11132331/). The most authoritative recent review of RNA imaging and its open problems. Outlook section is the spine of the bottleneck framing in this document.

Wheeler EC, Vu AQ, Einstein JM, DiSalvo M, Ahmed N, Van Nostrand EL, Shiskin AA, Jin W, Allbritton NL, Yeo GW. Pooled CRISPR screens with image based phenotyping on microRaft arrays reveals stress granule regulatory factors. Nat Methods. Image based stress granule biology from Yeo Lab, directly relevant to Mulan's thesis question on stress granule RNA cycling.

Corley M, Burns MC, Yeo GW. How RNA binding proteins interact with RNA: molecules and mechanisms. Mol Cell. (Note: M.C. Burns is in Mulan's PhD cohort and a co author on the Martinez 2022 Mol Cell paper.)

### Martinez Lab (Stanford adjacency)

Martinez NM et al. Pseudouridylation of mRNA from Stanford Chemical and Systems Biology, co published with Gene Yeo, Mol Cell (2022). Targeted reading and warm intro pathway through Dario and senior postdocs.

### Stanford Imaging Community (for broader context)

W.E. Moerner lab, Stanford Chemistry. Single molecule super resolution, 2014 Nobel Prize in Chemistry. Methodological foundation for live cell single molecule RNA imaging at sub diffraction resolution.

Stanley Qi lab, Stanford Bioengineering. CRISPR Cas engineering for RNA targeting and live cell imaging. Direct continuation of the RCas work Mulan's Nature Cell Biology Perspective formalized.

Polly Fordyce lab, Stanford Bioengineering and Genetics. Quantitative single molecule biophysics and microfluidics for biological measurement.

### Broader Field Grounding

Cawte AD, Unrau PJ, Rueda DS. Live cell imaging of single RNA molecules with fluorogenic Mango II arrays. Nat Commun 11, 1283 (2020). [DOI](https://doi.org/10.1038/s41467-020-14932-7). Current frontier for endogenous low background single molecule RNA imaging.

Wan Y, Anastasakis DG, Rodriguez J, Palangat M, Gudla P, Zaki G, Tandon M, Pegoraro G, Chow CC, Hafner M, Larson DR. Dynamic imaging of nascent RNA reveals general principles of transcription dynamics and stochastic splice site selection. Cell 184, 2878 (2021). [DOI](https://doi.org/10.1016/j.cell.2021.04.012) [PMID 33979654](https://pubmed.ncbi.nlm.nih.gov/33979654/). Quasi genome scale live cell nascent RNA imaging and splicing kinetics.

Liu Y, Zhou T, Hu J, Jin S, Wu J, Guan X, Wu Y, Cui J, Chen Y, Yang Y, Chen Z, Bao Y, Weng X, Zhou Y, Xie SQ, Lin C, Zhou Y. Decoding the interplay between m6A modification and stress granule stability by live cell imaging. Sci Adv 10, eadp5689 (2024). Spatiotemporal m6A imaging system (SMIS), the closest current art for live cell RNA modification imaging in stress granules.

Alberti S, Gladfelter A, Mittag T. Considerations and challenges in studying liquid liquid phase separation and biomolecular condensates. Cell 176, 419 (2019). [DOI](https://doi.org/10.1016/j.cell.2018.12.035). The definitive statement of why phase separation diagnostics from morphology alone are inadequate. Direct grounding for CellDiff Gap 2.

Laissue PP, Alghamdi RA, Tomancak P, Reynaud EG, Shroff H. Assessing phototoxicity in live fluorescence imaging. Nat Methods 14, 657 (2017). [DOI](https://doi.org/10.1038/nmeth.4344) [PMID 28661494](https://pubmed.ncbi.nlm.nih.gov/28661494/). The consensus document on phototoxicity reporting standards. Most live cell imaging papers still do not follow these.

Kiepas A, Voorand E, Mubaid F, Siegel PM, Brown CM. Optimizing live cell fluorescence imaging conditions to minimize phototoxicity. J Cell Sci 133, jcs242834 (2020). [PMID 31988150](https://pubmed.ncbi.nlm.nih.gov/31988150/). Illumination overhead as the dominant phototoxicity contributor.

Mota AAR, Lopez ARG, Asplund MC, Mota AAR, et al. PhotoFiTT: a quantitative framework for assessing phototoxicity in live cell microscopy experiments. Nat Commun 16, 11432 (2025). Quantitative phototoxicity benchmarking, including dose response curves.

Coulon A et al. Kinetic competition during the transcription cycle results in stochastic RNA processing. eLife 3, e03939 (2014). Live cell single molecule splicing kinetics.

Martin RM, Rino J, Carvalho C, Kirchhausen T, Carmo Fonseca M. Live cell visualization of pre mRNA splicing with single molecule sensitivity. Cell Rep 4, 1144 (2013). [PMID 26068754](https://pubmed.ncbi.nlm.nih.gov/26068754/). STaQTool, direct measurement of intron dynamics in single pre mRNA molecules.

Valm AM, Cohen S, Legant WR, Melunis J, Hershberg U, Wait E, Cohen AR, Davidson MW, Betzig E, Lippincott Schwartz J. Applying systems level spectral imaging and analysis to reveal the organelle interactome. Nature 546, 162 (2017). The six color live cell imaging ceiling.

Hubatsch L, Marshall DJ, Castellano N, Mela N, Pelkmans L, et al. Multispectral live cell imaging with uncompromised spatiotemporal resolution. Nat Photonics (2025). [DOI](https://doi.org/10.1038/s41566-025-01745-7). Eight channel multispectral live cell imaging.

Hu Y, Wang Y, et al. Simultaneous nanopore profiling of mRNA m6A and pseudouridine reveals translation coordination. Nat Biotechnol (2024). [PMC11300707](https://pmc.ncbi.nlm.nih.gov/articles/PMC11300707/). Joint m6A and pseudouridine sequencing readout, the molecular target Layer 3 of CellDiff predicts from imaging.

Tutucci E, Vera M, Biswas J, Garcia J, Parker R, Singer RH. An improved MS2 system for accurate reporting of the mRNA life cycle. Nat Methods 15, 81 (2018). Documents MS2 array effects on mRNA degradation, the artifact that motivates moving beyond MS2 to RCas and aptamer based imaging.

Heinrich L et al. Whole cell organelle segmentation in volume electron microscopy. Nature 599, 141 (2021). OpenOrganelle / COSEM project, the upstream segmentation ground truth that downstream subcellular reasoning depends on.

Note on attribution: full text of the Le, Ahmed, Yeo 2022 review used in this synthesis was retrieved according to PubMed, with attribution per the source DOI above.
