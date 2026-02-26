class MockNode {
  attrs: Record<string, any>
  constructor(config: any = {}) {
    this.attrs = { ...config }
  }
  add(_node: any) { return this }
  destroy() {}
}

class MockLayer extends MockNode {
  add(_node: any) { return this }
}

class MockStage extends MockNode {
  add(_node: any) { return this }
  draw() {}
  toBlob(_opts?: any): Promise<Blob> {
    return Promise.resolve(new Blob([''], { type: 'image/png' }))
  }
  destroy() {}
}

class MockRect extends MockNode {}
class MockText extends MockNode {}
class MockCircle extends MockNode {}
class MockGroup extends MockNode {
  add(_node: any) { return this }
}
class MockImage extends MockNode {}

const Konva = {
  Stage: MockStage,
  Layer: MockLayer,
  Rect: MockRect,
  Text: MockText,
  Circle: MockCircle,
  Group: MockGroup,
  Image: MockImage,
}

export default Konva
