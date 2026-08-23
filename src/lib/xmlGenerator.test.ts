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
  cardTypes: [],
  phaseAbbreviations: {},
  phaseMap: {
    Slayer:  ['Encounter'],
    Action:  ['Combat', 'Camp'],
    Phase:   [],
    Dungeon: [],
  },
  rarityConfig: {
    common: { aliases: ['comune'], color: '#4ade80' },
    rare:   { aliases: ['rara'],   color: '#f87171' },
    epic:   { aliases: ['epica'],  color: '#60a5fa' },
  },
  templates: [],
  cards: [
    { id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer', rarity: 'common',
      effect: 'Strike.', extras: { cost: 3, power: 4, hp: 5 } },
    { id: 'c2', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'rare',
      effect: 'Deal 3 damage.', extras: { cost: 2 } },
    { id: 'c3', name: 'Ancient Phase', class: 'Warrior', type: 'Phase', rarity: 'common', effect: '', extras: {} },
    { id: 'c4', name: 'The Dungeon', class: 'Warrior', type: 'Dungeon', rarity: 'epic', effect: 'Lurk.', extras: {} },
    { id: 'c5', name: 'Shadowstep', class: 'Warrior Mage', type: 'Errant', rarity: 'epic',
      effect: 'Evade.', extras: { cost: 1, power: 2, hp: 3 } },
  ],
  artFolderPath: '',
  customImages: {},
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

describe('generateXML — double-faced cards', () => {
  const dfcProject: ProjectFile = {
    ...project,
    cards: [
      { id: 'f1', name: 'Werewolf', class: 'Warrior', type: 'Errant', rarity: 'rare',
        effect: 'Prowl.', extras: { cost: 2, power: 2, hp: 2, retro: 'Full Moon Beast' } },
      { id: 'b1', name: 'Full Moon Beast', class: 'Warrior', type: 'Errant', rarity: 'rare',
        effect: 'Rampage.', extras: { power: 5, hp: 5 } },
      { id: 'n1', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'rare',
        effect: 'Deal 3 damage.', extras: { cost: 2 } },
    ],
  }

  function cardSection(xml: string, name: string): string {
    const idx = xml.indexOf(`<name>${name}</name>`)
    return xml.slice(idx, xml.indexOf('</card>', idx))
  }

  it('marks the front face with layout transform and side front', () => {
    const front = cardSection(generateXML(dfcProject), 'Werewolf')
    expect(front).toContain('<layout>transform</layout>')
    expect(front).toContain('<side>front</side>')
  })

  it('marks the back face with layout transform and side back', () => {
    const back = cardSection(generateXML(dfcProject), 'Full Moon Beast')
    expect(back).toContain('<layout>transform</layout>')
    expect(back).toContain('<side>back</side>')
  })

  it('links the front face to its back with related attach="transform"', () => {
    const front = cardSection(generateXML(dfcProject), 'Werewolf')
    expect(front).toContain('<related attach="transform">Full Moon Beast</related>')
  })

  it('links the back face to its front with reverse-related attach="transform"', () => {
    const back = cardSection(generateXML(dfcProject), 'Full Moon Beast')
    expect(back).toContain('<reverse-related attach="transform">Werewolf</reverse-related>')
  })

  it('does not emit the retro value as a card property', () => {
    const front = cardSection(generateXML(dfcProject), 'Werewolf')
    expect(front).not.toContain('<retro>')
  })

  it('leaves unrelated cards as normal layout with no related tags', () => {
    const normal = cardSection(generateXML(dfcProject), 'Fireball')
    expect(normal).toContain('<layout>normal</layout>')
    expect(normal).not.toContain('<side>')
    expect(normal).not.toContain('attach="transform"')
  })
})
