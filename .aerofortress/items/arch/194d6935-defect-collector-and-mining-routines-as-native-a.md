---
id: 194d6935-baaf-4ff2-9d95-00fe56ccb21e
slug: arch
type: decision
title: Defect-collector and mining routines as native aerofortress-framework hooks
tags: aerofortress-framework, hooks, architecture, mining-routines
provenance: dito
evidence: User: 'isso não deveria estar nativamente nos hooks do aerofortress-framework assim como estão critical, journey, slice, module, etc.?'
decay: stable
created: 2026-07-02T14:48:44.456998400+00:00
updated: 2026-07-02T14:48:44.456998400+00:00
validated: 2026-07-02T14:48:44.456998400+00:00
links: 
---

User questioned why defect-collector (and similar mining/validation routines) is a separate routines-panel configuration rather than a native hook in aerofortress-framework, alongside established native hooks like `critical`, `journey`, `slice`, `module`. The question implies mining and automation routines may deserve first-class framework status rather than peripheral configuration.
