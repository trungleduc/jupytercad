import { v4 as uuid } from 'uuid';

export interface IPosition {
  x: number;
  y: number;
}

export interface ILine {
  start: IPosition;
  end: IPosition;
}
function distance(p1: IPosition, p2: IPosition): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}
export class SketcherModel {
  constructor(options: { gridSize: number }) {
    this._points = new Map();
    this._lines = new Map();
    this._gridSize = options.gridSize;
  }

  get gridSize(): number {
    return this._gridSize;
  }
  get points(): Map<string, IPosition> {
    return this._points;
  }
  get lines(): Map<string, ILine> {
    return this._lines;
  }
  addPoint(point: IPosition): string {
    const id = uuid();
    this._points.set(id, point);
    return id;
  }
  removePoint(id: string): void {
    this._points.delete(id);
  }
  getPointByPosition(pos: IPosition): string | undefined {
    for (const [key, val] of this._points.entries()) {
      if (distance(val, pos) < 0.05 * this._gridSize) {
        return key;
      }
    }
  }
  private _points: Map<string, IPosition>;
  private _lines: Map<string, ILine>;
  private _gridSize: number;
}
