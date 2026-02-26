import type { CardType } from '@/types/card'
import type { ProjectFile } from '@/types/project'

const MAINTYPE: Record<CardType, string> = {
  Slayer:       'Creature',
  Errant:       'Creature',
  Action:       'Sorcery',
  Ploy:         'Sorcery',
  Intervention: 'Instant',
  Chamber:      'Enchantment',
  Relic:        'Artifact',
  Dungeon:      'Planeswalker',
  Phase:        'Land',
}

const TABLEROW: Record<CardType, number> = {
  Slayer:       2,
  Errant:       2,
  Action:       3,
  Ploy:         3,
  Intervention: 3,
  Chamber:      1,
  Relic:        1,
  Dungeon:      1,
  Phase:        0,
}

function appendText(doc: Document, parent: Element, tag: string, text: string): void {
  const el = doc.createElement(tag)
  el.textContent = text
  parent.appendChild(el)
}

export function generateXML(project: ProjectFile): string {
  const doc = document.implementation.createDocument('', 'cockatrice_carddatabase', null)
  const root = doc.documentElement
  root.setAttribute('version', '4')

  // <sets>
  const setsEl = doc.createElement('sets')
  root.appendChild(setsEl)
  const setEl = doc.createElement('set')
  setsEl.appendChild(setEl)
  appendText(doc, setEl, 'name', project.set.code)
  appendText(doc, setEl, 'longname', project.set.name)
  appendText(doc, setEl, 'settype', project.set.type)
  appendText(doc, setEl, 'releasedate', project.set.releaseDate)

  // <cards>
  const cardsEl = doc.createElement('cards')
  root.appendChild(cardsEl)

  for (const card of project.cards) {
    const cardEl = doc.createElement('card')
    cardsEl.appendChild(cardEl)

    appendText(doc, cardEl, 'name', card.name)

    // text = effect + optional phase label
    const phases = project.phaseMap[card.type] ?? []
    const phaseLabel = phases.length > 0 ? ` [${phases.join(', ')}]` : ''
    appendText(doc, cardEl, 'text', card.effect + phaseLabel)

    // <set rarity="...">code</set>
    const cardSetEl = doc.createElement('set')
    cardSetEl.setAttribute('rarity', card.rarity)
    cardSetEl.textContent = project.set.code
    cardEl.appendChild(cardSetEl)

    // <prop>
    const propEl = doc.createElement('prop')
    cardEl.appendChild(propEl)

    const maintype = MAINTYPE[card.type]
    appendText(doc, propEl, 'layout', 'normal')
    appendText(doc, propEl, 'type', `${maintype} — ${card.class} ${card.type}`)
    appendText(doc, propEl, 'maintype', maintype)

    if (card.type !== 'Dungeon' && card.type !== 'Phase') {
      const cost = card.cost !== undefined ? String(card.cost) : ''
      appendText(doc, propEl, 'manacost', cost)
      appendText(doc, propEl, 'cmc', cost)
    }

    // colors: split multi-class, look up each, join
    const classes = card.class.split(/[\s/]+/).filter(Boolean)
    const color = classes.map((c) => project.classColors[c]?.cockatriceColor ?? '').join('')
    appendText(doc, propEl, 'colors', color)
    appendText(doc, propEl, 'coloridentity', color)

    if (card.type === 'Slayer' || card.type === 'Errant') {
      appendText(doc, propEl, 'pt', `${card.power ?? 0}/${card.hp ?? 0}`)
    }

    appendText(doc, cardEl, 'tablerow', String(TABLEROW[card.type]))
    appendText(doc, cardEl, 'token', '0')
  }

  const raw = new XMLSerializer().serializeToString(doc)
  return '<?xml version="1.0" encoding="utf-8"?>\n' + prettyXml(raw)
}

function prettyXml(xml: string): string {
  const lines = xml.replace(/(>)(<)/g, '$1\n$2').split('\n')
  let depth = 0
  return lines
    .map((line) => {
      line = line.trim()
      if (!line) return null
      if (line.startsWith('</')) depth--
      const out = '  '.repeat(Math.max(0, depth)) + line
      if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</')) {
        depth++
      }
      return out
    })
    .filter(Boolean)
    .join('\n')
}
