const Stage = ({ children, onClick, width, height }: any) => (
  <div
    data-testid="konva-stage"
    data-width={width}
    data-height={height}
    onClick={(e) => { if (e.target === e.currentTarget) onClick?.() }}
  >
    {children}
  </div>
)
const Layer = ({ children }: any) => <div data-testid="konva-layer">{children}</div>
function makeFakeKonvaEvent(x = 10, y = 20) {
  return { target: { x: () => x, y: () => y } }
}

const Rect = ({ onClick, onMouseEnter, onMouseLeave, onDragEnd, id, ...rest }: any) => (
  <div
    data-testid="konva-rect"
    data-id={id}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onDragEnd={() => onDragEnd?.(makeFakeKonvaEvent())}
    data-fill={rest.fill}
  />
)
const Text = ({ onClick, onMouseEnter, onMouseLeave, onDragEnd, id, text, verticalAlign }: any) => (
  <div
    data-testid="konva-text"
    data-id={id}
    data-text={text}
    data-vertical-align={verticalAlign}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onDragEnd={() => onDragEnd?.(makeFakeKonvaEvent())}
  />
)
const Image = ({ onClick, onMouseEnter, onMouseLeave, onDragEnd, id }: any) => (
  <div
    data-testid="konva-image"
    data-id={id}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onDragEnd={() => onDragEnd?.(makeFakeKonvaEvent())}
  />
)
const Circle = ({ onClick, id }: any) => (
  <div
    data-testid="konva-circle"
    data-id={id}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
  />
)
const Group = ({ children, onClick, onMouseEnter, onMouseLeave, onDragEnd, id, name }: any) => (
  <div
    data-testid={name ? `konva-${name}` : 'konva-group'}
    data-id={id}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onDragEnd={() => onDragEnd?.(makeFakeKonvaEvent())}
  >
    {children}
  </div>
)
const Line = () => <div data-testid="konva-line" />
const Transformer = () => <div data-testid="konva-transformer" />
const RegularPolygon = ({ onClick, onMouseEnter, onMouseLeave, onDragEnd, id, fill }: any) => (
  <div
    data-testid="konva-regular-polygon"
    data-id={id}
    data-fill={fill}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onDragEnd={() => onDragEnd?.(makeFakeKonvaEvent())}
  />
)

export { Stage, Layer, Rect, Text, Image, Circle, Group, Line, Transformer, RegularPolygon }
