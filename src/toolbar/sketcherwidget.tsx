import { Dialog } from '@jupyterlab/apputils';
import { Button } from '@jupyterlab/ui-components';
import * as React from 'react';

import { IDict } from '../types';
import { ToolbarModel } from './model';

interface IProps {}
interface IState {
  mode?: 'POINT' | 'LINE';
}

const GRID_SIZE = 50;

class SketcherReactWidget extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {};
    console.log(this._actPoint);
  }

  componentDidMount(): void {
    setTimeout(() => {
      this.initiateEditor();
    }, 100);
  }

  initiateEditor(): void {
    const currentDiv = this._divRef.current;
    if (!currentDiv) {
      return;
    }

    const rect = currentDiv.getBoundingClientRect();
    const canvas = this._canvasRef.current!;

    if (rect?.width && rect?.height) {
      canvas.height = rect.height - 30; // Remove the height of the toolbar
      canvas.width = rect.width;
    }
    const width = canvas.width;
    const height = canvas.height;
    const context = canvas.getContext('2d')!;

    // const gridSizeOverTwo = gridSize / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    this._canvasState = { width, height, centerX, centerY };
    context.lineWidth = 0.5;
    context.strokeStyle = this._lightTheme ? '#BBB' : '#999';

    for (let x = centerX + GRID_SIZE; x <= width; x += GRID_SIZE) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }

    for (let x = centerX - GRID_SIZE; x >= 0; x -= GRID_SIZE) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }

    for (let y = centerY + GRID_SIZE; y <= height; y += GRID_SIZE) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }

    for (let y = centerY - GRID_SIZE; y >= 0; y -= GRID_SIZE) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }

    context.stroke();

    context.beginPath();

    context.lineWidth = 2;
    context.strokeStyle = this._lightTheme ? '#999' : '#BBB';

    context.moveTo(centerX, 0);
    context.lineTo(centerX, height);

    context.moveTo(0, centerY);
    context.lineTo(width, centerY);

    context.stroke();

    canvas.addEventListener('mousedown', this.mouseDownListener);
    canvas.addEventListener('mousemove', this.mouseMoveListener);
    canvas.addEventListener('mouseover', this.mouseOverListener, false);
  }

  updateMousePos = evt => {
    const canvas = this._canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const X = (evt.clientX - rect.left - this._canvasState.centerX) / GRID_SIZE;
    const Y = (evt.clientY - rect.top - this._canvasState.centerY) / GRID_SIZE;
    this._mousePosition = { X, Y };
    // console.log(this._mousePosition);
  };

  mouseDownListener = e => {
    e.preventDefault();
    e.stopPropagation();
    // const clickPosX = this._mousePosition.X;
    // const clickPosY = this._mousePosition.Y;
  };
  mouseMoveListener = (e: MouseEvent) => {
    this.updateMousePos(e);
    if(this._actPoint){
      this._actPoint.translate(this._mousePosition.X, this._mousePosition.Y)
    }
  };

  mouseOverListener = evt => {
    this.addPoint();
    this.draw();
  };

  addPoint = () => {
    if(this._mousePosition){
      const point = {
        x: this._mousePosition.X,
        y: this._mousePosition.Y,
        control: [],
        over: false,
        selected: false,
        translate: (x, y) => {
          point.x = x;
          point.y = y;
        }
      };
      this._points.push(point);
      this._actPoint = point;

    }
  };

  draw = () => {
    this.drawLines();
  };

  drawLines = () => {
    for (let p = 1; p < this._points.length; p++) {
      this.drawLine(p - 1, p);
    }
  };

  drawLine = (p1, p2) => {
    const canvas = this._canvasRef.current!;
    const context = canvas.getContext('2d')!;
    //Start new path for every line
    context.beginPath();

    //Set line width and color
    context.lineWidth = 1;
    context.strokeStyle = 'blue';

    const startPointX =
      this._points[p1].x * GRID_SIZE + this._canvasState.centerX;
    const startPointY =
      this._points[p1].y * GRID_SIZE + this._canvasState.centerY;

    const endPointX =
      this._points[p2].x * GRID_SIZE + this._canvasState.centerX;
    const endPointY =
      this._points[p2].y * GRID_SIZE + this._canvasState.centerY;
    let controlPointX_1, controlPointY_1, controlPointX_2, controlPointY_2;
    if (this._points[p1].control.length != 0) {
      controlPointX_1 =
        this._points[p1].control[0].x * GRID_SIZE + this._canvasState.centerX;
      controlPointY_1 =
        this._points[p1].control[0].y * GRID_SIZE + this._canvasState.centerY;
    } else {
      controlPointX_1 = startPointX;
      controlPointY_1 = startPointY;
    }

    if (this._points[p2].control.length != 0) {
      controlPointX_2 =
        this._points[p2].control[1].x * GRID_SIZE + this._canvasState.centerX;
      controlPointY_2 =
        this._points[p2].control[1].y * GRID_SIZE + this._canvasState.centerY;
    } else {
      controlPointX_2 = endPointX;
      controlPointY_2 = endPointY;
    }

    context.moveTo(startPointX, startPointY);
    context.bezierCurveTo(
      controlPointX_1,
      controlPointY_1,
      controlPointX_2,
      controlPointY_2,
      endPointX,
      endPointY
    );

    //Draw it!
    context.stroke();
  };

  render(): React.ReactNode {
    return (
      <div
        className="jpcad-sketcher-Sketcher"
        ref={this._divRef}
        style={{ overflow: 'hidden', width: '100%', height: '100%' }}
      >
        <div className=" lm-Widget jp-Toolbar jpcad-sketcher-Sketcher-Toolbar">
          <Button
            className={'jp-Button jp-mod-minimal jp-ToolbarButtonComponent'}
            style={{ color: 'const(--jp-ui-font-color1)' }}
            onClick={async () => {
              console.log('clicked');
            }}
          >
            POINT
          </Button>
          <Button
            className={'jp-Button jp-mod-minimal jp-ToolbarButtonComponent'}
            style={{ color: 'const(--jp-ui-font-color1)' }}
            onClick={async () => {}}
          >
            LINE
          </Button>
        </div>
        <canvas
          className="jpcad-sketcher-Sketcher-Canvas"
          ref={this._canvasRef}
        ></canvas>
      </div>
    );
  }
  private _mousePosition: { X: number; Y: number };
  private _points: any[] = [];
  private _actPoint: any;
  private _canvasState: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  private _divRef = React.createRef<HTMLDivElement>();
  private _canvasRef = React.createRef<HTMLCanvasElement>();
  private _lightTheme =
    document.body.getAttribute('data-jp-theme-light') === 'true';
}

export interface ISketcherDialogOptions {
  toolbarModel: ToolbarModel;
}

export class SketcherDialog extends Dialog<IDict> {
  constructor(options: ISketcherDialogOptions) {
    const body = <SketcherReactWidget />;
    super({ title: 'Sketcher', body, buttons: [] });
    this.addClass('jpcad-sketcher-SketcherDialog');
    // console.log('this.node.firstChild', this.node.firstChild);

    // const observer = new MutationObserver((e) => {
    //   console.log('mutations:', e);
    // });
    // observer.observe( this.node.firstChild!, {attributes:true});
    // this.node.firstChild!.addEventListener('resize', ()=>{
    //   console.log('eee');

    // })
  }
}
