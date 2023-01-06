import { v4 as uuid } from 'uuid';

import { IDict, IJupyterCadDoc } from '../types';
import { IJCadObject } from '../_interface/jcad';
import { distance } from './helper';
import {
  ICircle,
  ILine,
  IOperator,
  IPoint,
  IPosition,
  ISketcherModel
} from './types';

export class SketcherModel implements ISketcherModel {
  constructor(options: { gridSize: number; sharedModel?: IJupyterCadDoc }) {
    this._gridSize = options.gridSize;
    this._sharedModel = options.sharedModel;
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
  get circles(): Map<string, ICircle> {
    return this._circles;
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

  addCircle(center: IPosition, radius: number): void {
    const id = uuid();
    this._circles.set(id, { center, radius });
    return id;
  }
  removeCircle(id: string): void {
    this._circles.delete(id);
  }
  getCircleById(id: string): ICircle | undefined {
    return this._circles.get(id);
  }
  getCircleByControlPoint(id: string): string[] {
    const circles: string[] = [];
    for (const [key, val] of this._circles.entries()) {
      if (val.controlPoints && val.controlPoints.includes(id)) {
        circles.push(key);
      }
    }
    return circles;
  }
  save(): void {
    const newSketch: IJCadObject = {
      shape: 'Sketcher::SketchObject',
      name: 'NewSketch' + this._int,
      visible: true,
      parameters: {
        Geometry: [
          {
            CenterX: 15.616811,
            NormalZ: 1,
            AngleXU: 0,
            Radius: 15.294874,
            TypeId: 'Part::GeomCircle',
            CenterY: 25.640715,
            CenterZ: 0,
            NormalY: 0,
            NormalX: 0
          }
        ]
      }
    };
    this._int += 1;
    this._sharedModel?.addObject(newSketch);
  }
  private _int = 0;
  private _points: Map<string, IPoint> = new Map();
  private _lines: Map<string, ILine> = new Map();
  private _circles: Map<string, ICircle> = new Map([]);
  private _gridSize: number;
  private _editing: { type: IOperator | null; content: IDict | null } = {
    type: null,
    content: null
  };
  private _sharedModel?: IJupyterCadDoc;
}
