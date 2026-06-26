const obsidian = require('obsidian');

/**
 * Appends text to an element, converting [[Target]] and [[Target|Display]]
 * wiki-links into Obsidian internal-link anchors so hover previews,
 * graph connections, and link resolution all work as expected.
 * Also parses **bold** and *italic* markdown into <strong>/<em> elements.
 */
function appendWithLinks(el, text) {
    if (!text) return;
    // Split on wiki-links, bold/italic markdown, and red-bold HP/damage patterns
    // in one pass. Bold (**) must precede italic (*) so ** is matched first.
    const parts = String(text).split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\*[^*]+\*|\d+\s*HP|\d+\s*more damage)/i);
    for (const part of parts) {
        if (!part) continue;
        const linkMatch = part.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
        const boldMatch = part.match(/^\*\*([\s\S]+)\*\*$/);
        const italicMatch = part.match(/^\*([\s\S]+)\*$/);
        if (linkMatch) {
            const target = linkMatch[1].trim();
            const display = linkMatch[2] ? linkMatch[2].trim() : target;
            el.createEl('a', {
                text: display,
                cls: 'internal-link',
                attr: { 'data-href': target, href: target }
            });
        } else if (boldMatch) {
            // Recurse so links / red-bold inside the bold span are still parsed
            appendWithLinks(el.createEl('strong'), boldMatch[1]);
        } else if (italicMatch) {
            appendWithLinks(el.createEl('em'), italicMatch[1]);
        } else if (/^(\d+\s*HP|\d+\s*more damage)$/i.test(part)) {
            el.createEl('span', { text: part, cls: 'ms-red-bold' });
        } else {
            el.appendText(part);
        }
    }
}

module.exports = class StatblockPlugin extends obsidian.Plugin {
    async onload() {
        this.registerMarkdownCodeBlockProcessor("nimbleStatblock", (source, el, ctx) => {
            try {
                const parsed = obsidian.parseYaml(source);
                const monsters = Array.isArray(parsed) ? parsed : [parsed];

                monsters.forEach(data => {
                    const wrapper = el.createDiv({ cls: "ms-statblock-wrap" });
                    const container = wrapper.createDiv({ cls: "monster-statblock" });

                    const buildStat = (parent, iconName, text, extraCls = "") => {
                        const span = parent.createSpan({ cls: "ms-stat " + extraCls });
                        const iconSpan = span.createSpan({ cls: "ms-icon" });
                        obsidian.setIcon(iconSpan, iconName);
                        span.createSpan({ text: text });
                    };

                    if (data.type !== 'solo') {
                        container.addClass("ms-standard-layout");
                        const topSection = container.createDiv({ cls: "ms-std-header" });
                        const titleArea = topSection.createDiv({ cls: "ms-std-title" });
                        titleArea.createSpan({ cls: "ms-std-name", text: data.name || "Unknown" });
                        if (data.level) titleArea.createSpan({ cls: "ms-std-level", text: `LVL ${data.level}` });
                        
                        const statsRight = topSection.createDiv({ cls: "ms-std-stats" });
                        if (data.defense) buildStat(statsRight, "shield", data.defense);
                        if (data.hp) buildStat(statsRight, "heart", data.hp);
                        if (data.speed) buildStat(statsRight, "chevrons-right", data.speed);
                        if (data.resistances) buildStat(statsRight, "star", data.resistances);

                        const body = container.createDiv({ cls: "ms-body" });
                        
                        if (data.description) {
                            if (typeof data.description === 'string') {
                                const descDiv = body.createDiv({ cls: "ms-description" });
                                appendWithLinks(descDiv, data.description);
                            } else if (Array.isArray(data.description)) {
                                data.description.forEach(desc => {
                                    const descDiv = body.createDiv({ cls: "ms-description" });
                                    descDiv.createSpan({ cls: "ms-std-trait-name", text: `${desc.name}. ` });
                                    const descSpan = descDiv.createSpan({ cls: "ms-std-trait-desc" });
                                    appendWithLinks(descSpan, desc.desc);
                                });
                            }
                            body.createDiv({ cls: "ms-divider" });
                        }

                        if (Array.isArray(data.passive)) {
                            data.passive.forEach(p => {
                                const tDiv = body.createDiv({ cls: "ms-std-trait-box" });
                                tDiv.createSpan({ cls: "ms-std-trait-name", text: `${p.name}. ` });
                                const descSpan = tDiv.createSpan({ cls: "ms-std-trait-desc" });
                                appendWithLinks(descSpan, p.desc);
                            });
                        }
                        
                        if (data.actions) {
                            data.actions.forEach(action => {
                                const actDiv = body.createDiv({ cls: "ms-std-action" });
                                actDiv.createSpan({ cls: "ms-action-name", text: `${action.name}. ` });
                                appendWithLinks(actDiv, action.desc);
                            });
                        }

                        if (Array.isArray(data.special)) {
                            data.special.forEach(p => {
                                const tDiv = body.createDiv({ cls: "ms-std-special-box" });
                                tDiv.createSpan({ cls: "ms-std-trait-name", text: `${p.name}. ` });
                                const descSpan = tDiv.createSpan({ cls: "ms-std-trait-desc" });
                                appendWithLinks(descSpan, p.desc);
                            });
                        }

                        if (Array.isArray(data.essence) || Array.isArray(data.loot)) {
                            // Create a gap before essence if there are actions or passives
                            body.createDiv({ cls: "ms-large-divider" });

                            if (Array.isArray(data.essence)) {
                                data.essence.forEach(p => {
                                    const tDiv = body.createDiv({ cls: "ms-std-essence-box" });
                                    const nameSpan = tDiv.createSpan({ cls: "ms-std-essence-name" });
                                    nameSpan.appendText('ESSENCE: ');
                                    appendWithLinks(nameSpan, p.name);
                                    nameSpan.appendText('. ');
                                    const descSpan = tDiv.createSpan({ cls: "ms-std-essence-desc" });
                                    appendWithLinks(descSpan, p.desc);
                                });
                            }

                            if (Array.isArray(data.loot)) {
                                const tDiv = body.createDiv({ cls: "ms-std-loot-box" });
                                const nameSpan = tDiv.createSpan({ cls: "ms-std-loot-name" });
                                nameSpan.appendText('LOOT: ');
                                data.loot.forEach((p, index) => {
                                    appendWithLinks(nameSpan, p.item);
                                    if (index < data.loot.length - 1) {
                                        nameSpan.appendText(', ');
                                    }
                                });
                            }
                        }
                    } else {
                        const topSection = container.createDiv({ cls: "ms-top-section" });
                        const headerLeft = topSection.createDiv({ cls: "ms-header-left" });
                        if (data.level) headerLeft.createDiv({ cls: "ms-level", text: `LVL ${data.level} Solo ${data.title ? data.title : ''}` });
                        headerLeft.createDiv({ cls: "ms-name", text: data.name || "Unknown" });

                        const statsRight = topSection.createDiv({ cls: "ms-stats-right" });
                        if (data.hp) buildStat(statsRight, "heart", data.hp);
                        if (data.defense) buildStat(statsRight, "shield", data.defense);
                        if (data.speed) buildStat(statsRight, "chevrons-right", data.speed);
                        if (data.resistances) buildStat(statsRight, "star", data.resistances);

                        const body = container.createDiv({ cls: "ms-body" });
                        
                        // Viser passive som kort tekst oppe til høyre hvis det ikke er en liste
                        if (data.passive && typeof data.passive === 'string') {
                            buildStat(statsRight, "star", data.passive, "ms-traits");
                        }

                        body.createDiv({ cls: "ms-divider" });
                        
                        if (data.description) {
                            if (typeof data.description === 'string') {
                                const descDiv = body.createDiv({ cls: "ms-description" });
                                appendWithLinks(descDiv, data.description);
                            } else if (Array.isArray(data.description)) {
                                data.description.forEach(desc => {
                                    const descDiv = body.createDiv({ cls: "ms-description" });
                                    descDiv.createSpan({ cls: "ms-std-trait-name", text: `${desc.name}. ` });
                                    const descSpan = descDiv.createSpan({ cls: "ms-std-trait-desc" });
                                    appendWithLinks(descSpan, desc.desc);
                                });
                            }
                            body.createDiv({ cls: "ms-divider" });
                        }

                        // Viser passive som bokser hvis det er en liste
                        if (Array.isArray(data.passive)) {
                            data.passive.forEach(p => {
                                const tDiv = body.createDiv({ cls: "ms-std-trait-box" });
                                tDiv.createSpan({ cls: "ms-std-trait-name", text: `${p.name}. ` });
                                const descSpan = tDiv.createSpan({ cls: "ms-std-trait-desc" });
                                appendWithLinks(descSpan, p.desc);
                            });
                        }

                        

                        if (data.actions) {
                            const actionsDiv = body.createDiv({ cls: "ms-actions-section" });
                            const actionsHeader = actionsDiv.createDiv({ cls: "ms-actions-header" });
                            actionsHeader.createSpan({ cls: "ms-section-title", text: "ACTIONS: " });
                            if (data.actions_pretext) actionsHeader.createSpan({ text: data.actions_pretext });

                            const actionsUl = actionsDiv.createEl("ul", { cls: "ms-actions-list" });
                            data.actions.forEach(action => {
                                const actLi = actionsUl.createEl("li", { cls: "ms-action-item" });
                                actLi.createSpan({ cls: "ms-action-name", text: `${action.name}. ` });
                                appendWithLinks(actLi, action.desc);
                            });
                        }

                        if (Array.isArray(data.special)) {
                            data.special.forEach(p => {
                                const tDiv = body.createDiv({ cls: "ms-std-special-box" });
                                tDiv.createSpan({ cls: "ms-std-trait-name", text: `${p.name}. ` });
                                const descSpan = tDiv.createSpan({ cls: "ms-std-trait-desc" });
                                appendWithLinks(descSpan, p.desc);
                            });
                        }

                        if (data.bloodied || data.last_stand) {
                            body.createDiv({ cls: "ms-divider" });
                            const specialDiv = body.createDiv({ cls: "ms-special-section" });

                            if (data.bloodied) {
                                const bDiv = specialDiv.createDiv({ cls: "ms-special-line" });
                                bDiv.createSpan({ cls: "ms-special-title", text: "BLOODIED: " });
                                appendWithLinks(bDiv, data.bloodied);
                            }
                            if (data.last_stand) {
                                const lsDiv = specialDiv.createDiv({ cls: "ms-special-line" });
                                lsDiv.createSpan({ cls: "ms-special-title", text: "LAST STAND: " });
                                appendWithLinks(lsDiv, data.last_stand);
                            }
                        }

                        if (Array.isArray(data.essence) || Array.isArray(data.loot)) {
                            // Create a gap before essence if there are actions or passives
                            body.createDiv({ cls: "ms-large-divider" });

                            if (Array.isArray(data.essence)) {
                                data.essence.forEach(p => {
                                    const tDiv = body.createDiv({ cls: "ms-std-essence-box" });
                                    const nameSpan = tDiv.createSpan({ cls: "ms-std-essence-name" });
                                    nameSpan.appendText('ESSENCE: ');
                                    appendWithLinks(nameSpan, p.name);
                                    nameSpan.appendText('. ');
                                    const descSpan = tDiv.createSpan({ cls: "ms-std-essence-desc" });
                                    appendWithLinks(descSpan, p.desc);
                                });
                            }

                            if (Array.isArray(data.loot)) {
                                const tDiv = body.createDiv({ cls: "ms-std-loot-box" });
                                const nameSpan = tDiv.createSpan({ cls: "ms-std-loot-name" });
                                nameSpan.appendText('LOOT: ');
                                data.loot.forEach((p, index) => {
                                    appendWithLinks(nameSpan, p.item);
                                    if (index < data.loot.length - 1) {
                                        nameSpan.appendText(', ');
                                    }
                                });
                            }
                        }
                    }
                    
                });
            } catch (e) {
                console.error("Statblock error:", e);
                el.createEl("p", { text: "Feil med Statblock: " + e.message, cls: "ms-error" });
            }
        });
    }
};