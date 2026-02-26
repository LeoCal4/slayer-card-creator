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
const Rect = ({ onClick, onMouseEnter, onMouseLeave, onDragEnd, id, ...rest }: any) => (
  <div
    data-testid="konva-rect"
    data-id={id}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    data-fill={rest.fill}
  />
)
const Text = ({ onClick, onMouseEnter, onMouseLeave, id, text }: any) => (
  <div
    data-testid="konva-text"
    data-id={id}
    data-text={text}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  />
)
const Image = ({ onClick, onMouseEnter, onMouseLeave, id }: any) => (
  <div
    data-testid="konva-image"
    data-id={id}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  />
)
const Circle = ({ onClick, id }: any) => (
  <div
    data-testid="konva-circle"
    data-id={id}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
  />
)
const Group = ({ children, onClick, onMouseEnter, onMouseLeave, id, name }: any) => (
  <div
    data-testid={name ? `konva-${name}` : 'konva-group'}
    data-id={id}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    {children}
  </div>
)
const Line = () => <div data-testid="konva-line" />
const Transformer = () => <div data-testid="konva-transformer" />
const RegularPolygon = ({ onClick, onMouseEnter, onMouseLeave, id, fill }: any) => (
  <div
    data-testid="konva-regular-polygon"
    data-id={id}
    data-fill={fill}
    onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  />
)

export { Stage, Layer, Rect, Text, Image, Circle, Group, Line, Transformer, RegularPolygon }
