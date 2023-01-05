import { v4 as uuid } from 'uuid';
import { IDict } from '../types';

export interface IPosition {
  x: number;
  y: number;
}
export interface IPoint {
  position: IPosition;
  option?: { color: string };
}

export interface ILine {
  start: IPosition;
  end: IPosition;
  controlPoints?: string[];
}
function distance(p1: IPosition, p2: IPosition): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}
export type IOperator = 'LINE';
export class SketcherModel {
  constructor(options: { gridSize: number }) {
    this._points = new Map();
    this._lines = new Map();
    this._gridSize = options.gridSize;
  }

  get gridSize(): number {
    return this._gridSize;
  }
  get points(): Map<string, IPoint> {
    return this._points;
  }
  get lines(): Map<string, ILine> {
    return this._lines;
  }
  get editing(): { type: IOperator | null; content: IDict | null } {
    return this._editing;
  }
  startEdit(type: IOperator, content: IDict): void {
    this._editing.type = type;
    this._editing.content = content;
  }
  updateEditiing(type: IOperator, content: IDict): void {
    if (type === this._editing.type) {
      this.editing.content = content;
    }
  }
  stopEdit(): void {
    this._editing.type = null;
    this._editing.content = null;
  }

  addPoint(position: IPosition, option?: { color: string }): string {
    const near = this.getPointByPosition(position);
    if (near) {
      return near;
    }
    const id = uuid();
    this._points.set(id, { position, option: option });
    return id;
  }
  removePoint(id: string): void {
    this._points.delete(id);
  }
  getPointByPosition(pos: IPosition): string | undefined {
    for (const [key, val] of this._points.entries()) {
      if (distance(val.position, pos) < 0.05 * this._gridSize) {
        return key;
      }
    }
  }
  getPointById(id: string): IPoint | undefined {
    return this._points.get(id);
  }

  addLine(start: IPosition, end: IPosition): string {
    const id = uuid();
    this._lines.set(id, { start, end });
    return id;
  }
  removeLine(id: string): void {
    this._lines.delete(id);
  }
  getLineById(id: string): ILine | undefined {
    return this._lines.get(id);
  }
  getLineByControlPoint(pointId: string): string[] {
    const lines: string[] = [];
    for (const [key, val] of this._lines.entries()) {
      if (val.controlPoints && val.controlPoints.includes(pointId)) {
        lines.push(key);
      }
    }
    return lines;
  }

  private _points: Map<string, IPoint>;
  private _lines: Map<string, ILine>;
  private _gridSize: number;
  private _editing: { type: IOperator | null; content: IDict | null } = {
    type: null,
    content: null
  };
}
