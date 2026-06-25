# Nimble Statblocks

An Obsidian plugin that renders [Nimble TTRPG](https://www.nimble-ttrpg.com/) monster statblocks directly inside your notes from inline YAML.

**Authors:** Xelerox (forked from a plugin made with Gemini by Kurven)

---

## Installation

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Create the folder `<vault>/.obsidian/plugins/nimble-statblocks/`.
3. Copy the files into that folder.
4. In Obsidian, go to **Settings → Community Plugins** and enable **Nimble Statblocks**.

### Via BRAT

1. Install the **BRAT** community plugin.
2. Open BRAT settings and select **Add Beta Plugin**.
3. Enter this repository's URL, then install and enable it.

---

## Usage

Create a fenced code block with the language tag `nimbleStatblock` and provide your monster data as YAML:

~~~markdown
```nimbleStatblock
name: Cave Troll
level: 3
hp: 40
defense: 14
speed: 30 ft.
actions:
  - name: Slam
    desc: Deals 8 HP to one target.
```
~~~

Multiple monsters can be rendered in a single block by using a YAML list:

~~~markdown
```nimbleStatblock
- name: Goblin
  level: 1
  hp: 10
  defense: 12
  actions:
    - name: Stab
      desc: Deals 4 HP.
- name: Hobgoblin
  level: 2
  hp: 18
  defense: 14
  actions:
    - name: Slash
      desc: Deals 6 HP.
```
~~~

---

## YAML Reference

### Common Fields

| Field | Type | Description |
|---|---|---|
| `name` | string | Monster name. |
| `level` | number / string | Monster level, shown as `LVL X`. |
| `hp` | string | Hit points (e.g. `24`). |
| `defense` | string | Defence value (e.g. `13`). |
| `speed` | string | Movement speed (e.g. `30 ft.`). |
| `resistances` | string | Resistances or immunities. |
| `description` | string | Flavour or rules text shown below the header. |
| `passive` | list | Passive traits — each entry has `name` and `desc`. |
| `actions` | list | Actions — each entry has `name` and `desc`. |
| `essence` | list | Essence rewards — each entry has `name` and `desc`. |
| `loot` | list | Loot entries — each entry has an `item` field. |

### Solo Monsters

Set `type: solo` to use the solo monster layout, which adds additional sections:

| Field | Type | Description |
|---|---|---|
| `type` | string | Must be `solo` to activate the solo layout. |
| `title` | string | Optional subtitle shown after the level line. |
| `actions_pretext` | string | Optional preamble text shown before the actions list. |
| `bloodied` | string | Text shown in the **Bloodied** section. |
| `last_stand` | string | Text shown in the **Last Stand** section. |

### Full Solo Example

~~~markdown
```nimbleStatblock
type: solo
name: The Rot Colossus
title: Titan of Decay
level: 8
hp: 120
defense: 17
speed: 30 ft.
resistances: Poison
description: An ancient construct bound together by necrotic energy.
passive:
  - name: Pestilent Aura
    desc: Creatures that start their turn within 10 ft. take 2 HP.
actions_pretext: "The colossus acts twice each round."
actions:
  - name: Crushing Slam
    desc: Deals 14 HP to one target. Target is knocked prone.
  - name: Toxic Breath
    desc: All creatures in a 20 ft. cone take 8 HP poison damage.
bloodied: The colossus releases a shockwave, pushing all nearby creatures back 15 ft.
last_stand: The colossus explodes, dealing 20 HP to all creatures within 30 ft.
essence:
  - name: Rot Core
    desc: A pulsing necrotic gem. Can be used to enchant weapons with poison damage.
loot:
  - item: Ancient Iron Plate
  - item: Necrotic Residue (×3)
```
~~~

---

## Wiki-Links

Trait and action descriptions support Obsidian wiki-links. Both formats are recognised and rendered as live internal links with hover previews:

- `[[Target Note]]`
- `[[Target Note|Display Text]]`

HP values and `X more damage` references are automatically highlighted in red.


