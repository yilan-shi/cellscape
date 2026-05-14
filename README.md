# cellscape
Anthropic STEM fellowship proposal:
Create a thinking microscope for cell biologists 

## Table of Contents

1. Bottlenecks in Imaging
2. I built a prototype called Cellscape (short for cellular landscape)
3. Proposal: A Thinking Microscope Driven by Claude Reasoning in Real Time

---

## 1. The Bottleneck: What Is Broken in Imaging

During my PhD work in the Yeo Lab at UCSD, I developed live cell RNA imaging systems using dCas9, SunTag, and RCas9 to track endogenous MALAT1 and mRNA dynamics in live HeLa cells. A large part of that work was spent at the confocal microscope trying to get consistent data out of images. The physical work of imaging itself was cumbersome and varied drastically across different experimenter's techniques; the analysis part had no real standardization pipeline, and existing software wasn't very smart nor adaptable.  

These are examples of some problems I encountered daily: cells moved between frames, making single molecule tracking across z planes unreliable. Signals were too dim to track without laser power that caused phototoxicity. Subcellular localization calls (nuclear vs cytoplasmic, perinuclear vs intranuclear) depended on manual judgment rather than objective segmentation. And even when imaging worked, the data said nothing about the molecular state of the RNA: which isoform, whether it was modified, what its processing state was. You could see it, but you could not identify it.

My confocal woes clustered into 4 main problem areas:

```
╔══════════════════════════════════════════════════════════════════╗
║              THE FOUR AXES OF PAIN                               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   AXIS I.    Live Cell Tracking                                   ║
║              "follow one molecule for as long as possible. Hard
to have enough throughput to have statistically significant results"║
║                                                                   ║
║   AXIS II.   Subcellular Structure Labeling and Imaging           ║
║              "see where it is in 3D, with respect to what"        ║
║                                                                   ║
║   AXIS III.  Temporal Dynamics                                    ║
║              "watch how it changes, without killing the cell or 
having to fix it (FISH out of the question and was never physiological"║
║                                                                   ║
║   AXIS IV.   RNA Focused Questions                                ║
║              "identify what it actually is at the molecular      ║
║               level: isoform, modification, processing state"    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

To test whether Claude could help address these axes, I built a protocype called Cellscape, and designed an interrogation process using my own past data. The questions below are from Section 1 of the interrogation script, targeting colocalization and compartment localization but also checking for microscopy artifacts. 

**Q1.** Calculate or estimate the Pearson's correlation coefficient (PCC) between the green and blue channels. PCC ranges from negative one to positive one, with zero indicating no correlation. What value do you estimate and why?

**Q2.** Calculate the Manders' overlap coefficient (MOC) for the same two channels. MOC is the sum of colocalizing pixel intensities divided by total pixel intensities. What percentage of the green signal overlaps with the blue signal? What percentage of the blue overlaps with the green? (These are often different.)

**Q3.** What percentage of pixels show true colocalization (both channels above threshold simultaneously)? Compare to: (a) pixels where only green is above threshold, (b) pixels where only blue is above threshold, (c) pixels where neither is above threshold. Provide estimated percentages for each.

**Q4.** Does colocalization in this image reflect true molecular interaction or just co occurrence in the same subcellular region? Object based colocalization differs from pixel intensity correlation. Which interpretation is more appropriate here?

**Q5.** What threshold would you set for each channel to separate signal from background? Should we use all pixels (PCC ALL), pixels above threshold in either channel (PCC OR), or pixels above threshold in both channels (PCC AND)? Explain your reasoning.

**Q6.** This is the structure channel (Lamin B1, nuclear envelope). After seeing the nucleus channel, calculate spatial overlap. Do these two signals colocalize? What percentage of the structure signal overlaps with nuclear signal?

**Q7.** Does the green signal localize to: (a) nucleus, (b) nuclear envelope, (c) cytoplasm, (d) plasma membrane, (e) mitochondria, or (f) endoplasmic reticulum? Provide percentage estimates for each compartment.

**Q8.** Is the red signal enriched in certain regions or excluded from others? Map out enrichment versus exclusion across subcellular compartments.

**Q9.** Can you identify where the nucleus ends and the cytoplasm begins based on fluorescence intensity patterns alone? Is the boundary sharp or gradual? How confident are you in your assignment (0 to 100%)?

---

## 2. Cellscape Prototype Build

Cellscape is an open source React app I hacked together to test Claude's imaging reasoning capabilities against the four axes above. It includes a z slice scrubber for 2D cross sectional views, a Claude API integration for real time interrogation, and a compare mode that places control and treated/experimental conditions side by side. Right now the live app (hosted on vercel) has math-generated data as filler, while I appended an extra tab for user-uploaded real data. Eventually all functionalities will only analyze real data. 

I am really proud of the failure detection script I vibe-coded that looks for hedging words as well as "confidently wrong" answers. I only tested this script (called Interrogate_real_data.py) with a few pieces of my own data, so more robust "sanity checks" are needed. 

```javascript
const failureKeywords = [
  "cannot",
  "unable to",
  "don't have access",
  "can't directly",
  "without seeing",
  "would need",
  "unclear from",
  "uncertain about the z"
];

const failures = failureKeywords.filter(
  k => reply.toLowerCase().includes(k)
);

if (failures.length > 0) {
  setFailureLog(log => [...log, {
    question: userMessage,
    issue: reply.substring(0, 200) + "...",
    timestamp: new Date().toLocaleTimeString()
  }]);
}
```

Responses containing these patterns are logged automatically to the Failures tab with the triggering question, response excerpt, and timestamp.

---

## 3. Fellowship Proposal (open to other ideas too!): A Thinking Microscope Driven by Claude Reasoning in Real Time

### The problem with how microscopes currently operate

A confocal experiment today works like this: a grad student/post-doc sets acquisition parameters (laser power, z step size, frame interval, number of channels), tinkers with the sample, presses start, and the microscope acquires exactly what it was told to. If unforseen events happen during the capture process, the microscope continues executing its original instructions, and often the user/biologist does not know if something is wrong until he/she/they go back to the computer and analyze it. This "lag time" between capture and analysis and iteration can be days to even a week between imaging the sample and figuring out what to do next experimentally. 

It's similar the scenario where a Founder talks to a user, then builds the product/solution/app by outsourcing it to a remote team that is disjointed from the original conversation. The original problem gets diluted and passed down through multiple inefficient workflow streams until it reaches the team building it.

### Claude as the real-time decision layer to assist microscopy work: 

The proposal is to close this gap by inserting Claude as a reasoning layer between the microscope's acquisition and next command. Every time the microscope completes a z stack, an imaging pipeline processes that z stack into structured data (segmentation metrics, colocalization values, morphology deltas, per cell feature vectors) and passes it to Claude. Claude evaluates the data against the experimental context and generates a hardware command specifying what should change for the next acquisition cycle.

This runs as a continuous five stage loop:

**Stage 1: Acquire.** The confocal captures a z stack (32 planes, four channels, 512 by 512 pixels per plane). Acquisition time is 2 to 10 seconds depending on scan speed and settings.

**Stage 2: Process.** The imaging pipeline extracts structured features from the z stack in real time: nuclear volume, speckle count and positions, mRNA puncta distribution, colocalization coefficients, mitochondrial morphology, and a frame to frame delta. Target processing latency is under 50 milliseconds on a GPU workstation.

**Stage 3: Reason.** Claude receives the structured JSON. It has access to the full history of structured outputs from all prior frames in the session and the experimental hypothesis stated at the start. It identifies anomalies, assesses whether the current state warrants a change in acquisition strategy, and generates a decision. Target reasoning latency is 500 to 800 milliseconds per cycle.

**Stage 4: Decide.** Claude outputs an acquisition command as structured JSON specifying which hardware parameters to change before the next frame.

**Stage 5: Execute.** The microscope control software receives the command, adjusts hardware, and acquires the next z stack. The loop restarts.

Full loop latency is approximately 1.5 seconds. This fits within standard live cell imaging frame rates, which range from one frame every 5 seconds (fast processes like membrane ruffling) to one frame per minute or longer (slow processes like differentiation).

### The six hardware control axes

**Stage XY position.** The motorized stage moves the sample to center on a different cell or region. Claude can redirect the stage to a cell showing unusual behavior, follow a migrating cell across the dish, or tile across positions to survey a wider area.

**Z drive and focal plane.** The piezo z drive sets the focus depth and defines z stack range and step size. Claude can narrow the z range to concentrate acquisition on a region of interest (for example, planes Z=14 through Z=18 where blebbing is occurring), reduce step size for finer axial sampling, or expand the range if cell geometry has changed.

**Laser line selection and power.** Four to eight laser lines are available on modern confocals, typically 405nm, 488nm, 561nm, and 633 or 647nm. Claude can switch channels on or off, adjust per channel power, and change scanning mode. If it detects signs of phototoxicity (cell rounding, signal decay), it can reduce laser power or disable nonessential channels.

**Detector configuration.** Photomultiplier tube (PMT) gain and spectral detection windows control signal capture. Claude can increase gain to compensate for reduced laser power, adjust emission detection ranges to reduce spectral bleedthrough, or switch between PMT and hybrid detector modes where available.

**Scan parameters.** Mirror scan speed, pixel resolution, zoom factor, and region of interest can all be adjusted. Claude can switch from a full 512 by 512 frame to a smaller region of interest scan to reduce photon dose and increase temporal resolution in a specific area.

**Timing and sequencing.** Frame interval, total acquisition duration, and channel order are software controlled. Claude can shorten the interval when it detects a fast process in progress, lengthen it during quiescent periods to reduce total exposure, reorder channel acquisition to image the most photosensitive channel first, or stop the experiment if cell viability metrics fall below threshold.

### Three examples of decisions Claude would make

**Rare event detection.** Claude detects that Cell 14 near the edge of the field is entering prophase based on nuclear volume increase and chromatin condensation. It redirects the stage to center on Cell 14, increases frame rate from one per 30 seconds to one per 2 seconds, and activates the 488nm channel to capture spindle formation. Without this, the division event would be captured at the edge of the frame at low temporal resolution with no tubulin channel, and the data would not be usable.

**Adaptive z sampling.** Claude detects irregular Lamin B1 morphology at Z=14 through Z=18, consistent with nuclear envelope blebbing. It narrows the z range to Z=12 through Z=20 and halves the step size from 0.3 micrometers to 0.15 micrometers. The result is twice the axial resolution at the site of interest without increasing total acquisition time.

**Phototoxicity management.** Claude notices GFP signal dropping 8% per frame and cell morphology beginning to round. It reduces 488nm laser power by 40%, increases PMT gain to partially compensate, and widens the frame interval from 5 to 15 seconds. Cell viability is extended from an estimated 10 more minutes to approximately 3 hours of usable imaging.

### Hardware integration pathway

I discovered that most confocal manufacturers (Zeiss, Leica) bridge programmable interfaces for external software to adjust run time parameters. For example, Zeiss LSM systems use the ZEN Connect Python API, which provides access to stage position, laser power, detector gain, z drive, and scan parameter control. Leica SP8 and STELLARIS systems expose LAS X automation framework that helps with stage positioning and multi-parameter acquisition sequences. 

This is a part that I would need mentorship and the resources at Anthropic to build out and test. I am not versed in hardware (nor hardware/software integration), but it would be exciting to bring this project to scientists and biology researchers. 


## Interrogation pipeline (work in progress)

CellScope includes a **Real Data Interrogation** feature that lets you:
- Upload your own microscopy images (PNG/JPEG)
- Ask preset questions about colocalization, signal quality, 3D structure, and artifacts
- Write custom questions for Claude to analyze
- Export results as JSON

### Using Real Data Interrogation

1. Navigate to the "Real Data" tab
2. Enter your Anthropic API key (stored locally only)
3. Upload a microscopy image
4. Select preset questions or write your own
5. Click "Run Interrogation"
6. Export results when done
