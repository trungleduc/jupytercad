import { v4 as uuid } from 'uuid';

export interface IPosition {
  x: number;
  y: number;
}

export interface ILine {
  start: IPosition;
  end: IPosition;
}

export class SketcherModel {
  constructor() {
    this._points = new Map();
    this._lines = new Map();
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
  private _points: Map<string, IPosition>;
  private _lines: Map<string, ILine>;
}
