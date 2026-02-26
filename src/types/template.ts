import type { CardData, CardType } from './card'

interface LayerBase {
  id: string
  x: number
  y: number
  width: number
  height: number
  label?: string
  visible?: boolean
  locked?: boolean
  showIfField?: keyof CardData
}

export interface RectLayer extends LayerBase {
  type: 'rect'
  fill?: string
  fillSource?: 'class.primary' | 'class.secondary' | 'class.gradient'
  cornerRadius?: number
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

export interface ImageLayer extends LayerBase {
  type: 'image'
  imageSource: 'art' | 'frame'
  imageFit: 'cover' | 'contain' | 'fill' | 'stretch'
  opacity?: number
}

export interface TextLayer extends LayerBase {
  type: 'text'
  field: keyof CardData | 'stats' | 'statsVP'
  fontSize: number
  fontFamily?: string
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic'
  fill?: string
  align?: 'left' | 'center' | 'right'
  lineHeight?: number
  wrap?: 'word' | 'none'
}

export interface BadgeLayer extends LayerBase {
  type: 'badge'
  shape: 'circle'
  field: keyof CardData
  fill?: string
  textFill?: string
  fontSize?: number
}

export interface PhaseIconsLayer extends LayerBase {
  type: 'phase-icons'
  orientation: 'horizontal' | 'vertical'
  iconSize: number
  gap: number
  align: 'left' | 'right'
  fill?: string
  textFill?: string
  cornerRadius?: number
}

export interface RarityDiamondLayer extends LayerBase {
  type: 'rarity-diamond'
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

export type TemplateLayer =
  | RectLayer
  | ImageLayer
  | TextLayer
  | BadgeLayer
  | PhaseIconsLayer
  | RarityDiamondLayer

export interface Template {
  id: string
  name: string
  cardTypes: CardType[]
  canvas: { width: number; height: number }
  layers: TemplateLayer[]
}
