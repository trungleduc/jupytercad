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

export interface ICircle {
  center: IPosition;
  radius: number;
  controlPoints?: string[];
}

export type IOperator = 'POINT' | 'LINE' | 'CIRCLE';

export interface ISketcherModel {
  gridSize: number;
  points: Map<string, IPoint>;
  lines: Map<string, ILine>;
  circles: Map<string, ICircle>;
  editing: { type: IOperator | null; content: IDict | null };

  startEdit(type: IOperator, content: IDict): void;
  updateEditiing(type: IOperator, content: IDict): void;
  stopEdit(): void;

  addPoint(position: IPosition, option?: { color: string }): string;
  removePoint(id: string): void;
  getPointByPosition(pos: IPosition): string | undefined;
  getPointById(id: string): IPoint | undefined;

  addLine(start: IPosition, end: IPosition): string;
  removeLine(id: string): void;
  getLineById(id: string): ILine | undefined;
  getLineByControlPoint(pointId: string): string[];

  addCircle(center: IPosition, radius: number): void
  removeCircle(id: string): void
  getCircleById(id: string): ICircle | undefined
  getCircleByControlPoint(id: string): string[]
  save(): void
}
