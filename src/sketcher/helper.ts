import { IPosition } from './sketchermodel';

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  point: IPosition,
  fillStyle = 'blue',
  size = 6
): void {
    ctx.beginPath()
    ctx.fillStyle = fillStyle
    ctx.fillRect(point.x - size/2, point.y - size/2, size, size);
    ctx.closePath()
}
