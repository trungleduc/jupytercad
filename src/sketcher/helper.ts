import { IPosition } from './sketchermodel';

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  point: IPosition,
  fillStyle = 'blue',
  size = 6
): void {
  const oldFill = ctx.fillStyle;
  ctx.beginPath();
  ctx.fillStyle = fillStyle;
  ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
  ctx.closePath();
  ctx.fillStyle = oldFill;
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  start: IPosition,
  end: IPosition,
  strokeStyle: string,
  lineWidth = 0.5
): void {
  const oldlineWidth = ctx.lineWidth;
  const oldStroke = ctx.strokeStyle;

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.stroke();
  ctx.closePath();

  ctx.lineWidth = oldlineWidth;
  ctx.strokeStyle = oldStroke;
}
