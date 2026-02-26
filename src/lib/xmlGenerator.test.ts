import { describe, it, expect } from 'vitest'
import { generateXML } from './xmlGenerator'
import type { ProjectFile } from '@/types/project'

const project: ProjectFile = {
  version: 1,
  set: { name: 'Test Set', code: 'TST', type: 'Core', releaseDate: '2024-01-01' },
  classColors: {
    Warrior: { primary: '#c0392b', secondary: '#7b241c', cockatriceColor: 'R' },
    Mage:    { primary: '#2980b9', secondary: '#1a5276', cockatriceColor: 'U' },
  },
  phaseAbbreviations: {},
  phaseMap: {
    Slayer:  ['Encounter'],
    Action:  ['Combat', 'Camp'],
    Phase:   [],
    Dungeon: [],
  },
  templates: [],
  cards: [
    { id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer', rarity: 'common',
      cost: 3, power: 4, hp: 5, effect: 'Strike.' },
    { id: 'c2', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'rare',
      cost: 2, effect: 'Deal 3 damage.' },
    { id: 'c3', name: 'Ancient Phase', class: 'Warrior', type: 'Phase', rarity: 'common', effect: '' },
    { id: 'c4', name: 'The Dungeon', class: 'Warrior', type: 'Dungeon', rarity: 'uncommon', effect: 'Lurk.' },
    { id: 'c5', name: 'Shadowstep', class: 'Warrior Mage', type: 'Errant', rarity: 'uncommon',
      cost: 1, power: 2, hp: 3, effect: 'Evade.' },
  ],
  artFolderPath: '',
  frameImages: {},
}

describe('generateXML', () => {
  it('returns a string containing the cockatrice_carddatabase root with version 4', () => {
    const xml = generateXML(project)
    expect(xml).toContain('cockatrice_carddatabase')
    expect(xml).toContain('version="4"')
  })

  it('includes set block with code, longname, type, and releasedate', () => {
    const xml = generateXML(project)
    expect(xml).toContain('>TST<')
    expect(xml).toContain('>Test Set<')
    expect(xml).toContain('>Core<')
    expect(xml).toContain('>2024-01-01<')
  })

  it('includes each card name', () => {
    const xml = generateXML(project)
    expect(xml).toContain('<name>Axehand</name>')
    expect(xml).toContain('<name>Fireball</name>')
  })

  it('appends phase label to card text', () => {
    const xml = generateXML(project)
    expect(xml).toContain('Strike. [Encounter]')
    expect(xml).toContain('Deal 3 damage. [Combat, Camp]')
  })

  it('omits phase label when card type has no phases', () => {
    const xml = generateXML(project)
    const phaseIdx = xml.indexOf('<name>Ancient Phase</name>')
    const phaseCard = xml.slice(phaseIdx, xml.indexOf('</card>', phaseIdx))
    expect(phaseCard).not.toContain('[')
  })

  it('includes set element with rarity attribute on each card', () => {
    const xml = generateXML(project)
    expect(xml).toContain('rarity="common"')
    expect(xml).toContain('rarity="rare"')
  })

  it('maps Slayer to Creature maintype', () => {
    const xml = generateXML(project)
    // Axehand is Slayer -> Creature
    expect(xml).toContain('<maintype>Creature</maintype>')
  })

  it('maps Action to Sorcery maintype', () => {
    const xml = generateXML(project)
    expect(xml).toContain('<maintype>Sorcery</maintype>')
  })

  it('maps Phase to Land maintype', () => {
    const xml = generateXML(project)
    expect(xml).toContain('<maintype>Land</maintype>')
  })

  it('maps Dungeon to Planeswalker maintype', () => {
    const xml = generateXML(project)
    expect(xml).toContain('<maintype>Planeswalker</maintype>')
  })

  it('includes manacost and cmc for non-Dungeon non-Phase cards', () => {
    const xml = generateXML(project)
    expect(xml).toContain('<manacost>3</manacost>')
    expect(xml).toContain('<cmc>3</cmc>')
  })

  it('omits manacost for Phase cards', () => {
    const xml = generateXML(project)
    // Find Phase card section and ensure no manacost between it and the next </card>
    const phaseCard = xml.slice(xml.indexOf('<name>Ancient Phase</name>'))
    const cardClose = phaseCard.indexOf('</card>')
    expect(phaseCard.slice(0, cardClose)).not.toContain('<manacost>')
  })

  it('omits manacost for Dungeon cards', () => {
    const xml = generateXML(project)
    const dungeonCard = xml.slice(xml.indexOf('<name>The Dungeon</name>'))
    const cardClose = dungeonCard.indexOf('</card>')
    expect(dungeonCard.slice(0, cardClose)).not.toContain('<manacost>')
  })

  it('includes pt for Slayer and Errant cards', () => {
    const xml = generateXML(project)
    expect(xml).toContain('<pt>4/5</pt>') // Axehand
    expect(xml).toContain('<pt>2/3</pt>') // Shadowstep (Errant)
  })

  it('does not include pt for non-creature types', () => {
    const xml = generateXML(project)
    const fireballIdx = xml.indexOf('<name>Fireball</name>')
    const fireballCard = xml.slice(fireballIdx, xml.indexOf('</card>', fireballIdx))
    expect(fireballCard).not.toContain('<pt>')
  })

  it('includes tablerow 2 for Slayer/Errant', () => {
    const xml = generateXML(project)
    const axehandIdx = xml.indexOf('<name>Axehand</name>')
    const axehandCard = xml.slice(axehandIdx, xml.indexOf('</card>', axehandIdx))
    expect(axehandCard).toContain('<tablerow>2</tablerow>')
  })

  it('includes tablerow 3 for Action', () => {
    const xml = generateXML(project)
    const fireballIdx = xml.indexOf('<name>Fireball</name>')
    const fireballCard = xml.slice(fireballIdx, xml.indexOf('</card>', fireballIdx))
    expect(fireballCard).toContain('<tablerow>3</tablerow>')
  })

  it('includes tablerow 0 for Phase', () => {
    const xml = generateXML(project)
    const phaseIdx = xml.indexOf('<name>Ancient Phase</name>')
    const phaseCard = xml.slice(phaseIdx, xml.indexOf('</card>', phaseIdx))
    expect(phaseCard).toContain('<tablerow>0</tablerow>')
  })

  it('looks up cockatrice color from classColors', () => {
    const xml = generateXML(project)
    // Axehand is Warrior -> R
    const axehandIdx = xml.indexOf('<name>Axehand</name>')
    const axehandCard = xml.slice(axehandIdx, xml.indexOf('</card>', axehandIdx))
    expect(axehandCard).toContain('<colors>R</colors>')
    expect(axehandCard).toContain('<coloridentity>R</coloridentity>')
  })

  it('joins colors for multi-class cards', () => {
    const xml = generateXML(project)
    // Shadowstep is "Warrior Mage" -> R + U = RU
    const shadowIdx = xml.indexOf('<name>Shadowstep</name>')
    const shadowCard = xml.slice(shadowIdx, xml.indexOf('</card>', shadowIdx))
    expect(shadowCard).toContain('<colors>RU</colors>')
  })

  it('includes token 0 for every card', () => {
    const xml = generateXML(project)
    const tokenMatches = xml.match(/<token>0<\/token>/g) ?? []
    expect(tokenMatches).toHaveLength(project.cards.length)
  })

  it('is pretty-printed with newlines', () => {
    const xml = generateXML(project)
    expect(xml).toContain('\n')
  })

  it('starts with the XML declaration', () => {
    const xml = generateXML(project)
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true)
  })

  it('indents child elements', () => {
    const xml = generateXML(project)
    // e.g. "  <sets>" should appear — two-space indent
    expect(xml).toMatch(/^\s{2}<sets>/m)
  })
})
