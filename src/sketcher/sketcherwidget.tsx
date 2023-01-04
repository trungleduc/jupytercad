
import { Button } from '@jupyterlab/ui-components';
import * as React from 'react';
import { drawPoint } from './helper';

import { PanZoom } from './panzoom';
import { IPosition, SketcherModel } from './sketchermodel';

interface IProps {
  model: SketcherModel
}
interface IState {
  mode?: 'POINT' | 'LINE';
  currentPointer?: IPosition;
}

const GRID_SIZE = 64;

export class SketcherReactWidget extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {};
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
    const canvas = this._canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = currentDiv.getBoundingClientRect();

    if (rect?.width && rect?.height) {
      canvas.height = rect.height - 30; // Remove the height of the toolbar
      canvas.width = rect.width;
    }

    ['mousedown', 'mouseup', 'mousemove'].forEach(ev =>
      canvas.addEventListener(ev as any, this.mouseEvents)
    );
    canvas.addEventListener('wheel', this.mouseEvents, { passive: false });
    const ctx = canvas.getContext('2d')!;
    this._panZoom = new PanZoom(ctx, this._gridSize);
    this._panZoom.x = canvas.width / 2;
    this._panZoom.y = canvas.height / 2;
    requestAnimationFrame(this.update);
  }

  mouseEvents = (e: MouseEvent) => {
    if (!this._canvasRef.current) {
      return;
    }

    const bounds = this._canvasRef.current.getBoundingClientRect();
    this._mouse.x = e.pageX - bounds.left - scrollX;
    this._mouse.y = e.pageY - bounds.top - scrollY;

    this._mouse.button =
      e.type === 'mousedown'
        ? true
        : e.type === 'mouseup'
        ? false
        : this._mouse.button;
    if (e.type === 'wheel') {
      this._mouse.wheel += -(e as WheelEvent).deltaY;
      e.preventDefault();
    }
    const currentPos = this.currentPointer();
    if (currentPos) {
      this.setState(old => ({
        ...old,
        currentPointer: {
          x: parseFloat((currentPos.x / this._gridSize).toFixed(2)),
          y: parseFloat((currentPos.y / this._gridSize).toFixed(2))
        }
      }));
    }
  };

  drawGrid = (gridScreenSize = 128) => {
    if (!this._canvasRef.current) {
      return;
    }
    const panZoom = this._panZoom;
    const canvas = this._canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const w = canvas.width;
    const h = canvas.height;
    const gridScale = gridScreenSize;
    let size = Math.max(w, h) / panZoom.scale + gridScale * 2;
    this._topLeft = panZoom.toWorld({ x: 0, y: 0 });
    const x = Math.floor(this._topLeft.x / gridScale) * gridScale;
    const y = Math.floor(this._topLeft.y / gridScale) * gridScale;
    if (size / gridScale > this._gridLimit) {
      size = gridScale * this._gridLimit;
    }

    panZoom.apply();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    for (let i = 0; i < size; i += gridScale) {
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i, y + size);
      ctx.moveTo(x, y + i);
      ctx.lineTo(x + size, y + i);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.stroke();
    ctx.closePath();

    this.drawCenter(size);
  };
  drawCenter = (size: number) => {
    const panZoom = this._panZoom;
    const canvas = this._canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const center = panZoom.toScreen({ x: 0, y: 0 });
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';

    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x, center.y + size);
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x, center.y - size);
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + size, center.y);
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x - size, center.y);
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.closePath();
  };

  drawPointer = (x: number, y: number) => {
    const panZoom = this._panZoom;
    const canvas = this._canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const worldCoord = panZoom.toWorld({ x, y }, true);

    panZoom.apply();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(worldCoord.x - (2 / panZoom.scale) * canvas.width, worldCoord.y);
    ctx.lineTo(worldCoord.x + (2 / panZoom.scale) * canvas.width, worldCoord.y);
    ctx.moveTo(
      worldCoord.x,
      worldCoord.y - (2 / panZoom.scale) * canvas.height
    );
    ctx.lineTo(
      worldCoord.x,
      worldCoord.y + (2 / panZoom.scale) * canvas.height
    );
    ctx.setTransform(1, 0, 0, 1, 0, 0); //reset the transform so the lineWidth is 1
    ctx.stroke();
    ctx.closePath();

    const newScreenPos = panZoom.toScreen(worldCoord);
    drawPoint(ctx, newScreenPos, 'crimson')
  };

  draw = () => {
    this.props.model.points.forEach((val, key) =>{

    })
  }

  update = () => {
    const canvas = this._canvasRef.current!;
    const currentDiv = this._divRef.current!;

    const ctx = canvas.getContext('2d')!;
    const mouse = this._mouse;
    const panZoom = this._panZoom;

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.globalAlpha = 1; // reset alpha

    const rect = currentDiv.getBoundingClientRect();

    if (canvas.width !== rect.width || canvas.height !== rect.height - 30) {
      canvas.height = rect.height - 30; // Remove the height of the toolbar
      canvas.width = rect.width;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (mouse.wheel !== 0) {
      let scale = 1;
      scale = mouse.wheel < 0 ? 1 / this._scaleRate : this._scaleRate;
      mouse.wheel *= 0.8;
      if (Math.abs(mouse.wheel) < 1) {
        mouse.wheel = 0;
      }
      panZoom.scaleAt(mouse.x, mouse.y, scale); //scale is the change in scale
    }
    if (mouse.button) {
      if (!mouse.drag) {
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        mouse.drag = true;
      } else {
        panZoom.x += mouse.x - mouse.lastX;
        panZoom.y += mouse.y - mouse.lastY;
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
      }
    } else if (mouse.drag) {
      mouse.drag = false;
    }
    this.drawGrid(this._gridSize);
    this.drawPointer(mouse.x, mouse.y);
    requestAnimationFrame(this.update);
  };
  currentPointer(): IPosition | undefined {
    return this._panZoom?.toWorld(this._mouse, true);
  }
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
        <div className="jpcad-sketcher-Sketcher-Statusbar">
          X: {this.state.currentPointer?.x} - Y: {this.state.currentPointer?.y}
        </div>
      </div>
    );
  }
  private _mouse = {
    x: 0,
    y: 0,
    button: false,
    wheel: 0,
    lastX: 0,
    lastY: 0,
    drag: false
  };
  private _gridLimit = 128;
  private _gridSize = GRID_SIZE; //grid size in pixels
  private _scaleRate = 1.02;
  private _topLeft = { x: 0, y: 0 }; // top left position of canvas in world coords.
  private _divRef = React.createRef<HTMLDivElement>();
  private _canvasRef = React.createRef<HTMLCanvasElement>();
  private _panZoom: PanZoom;
  // private _lightTheme =
  //   document.body.getAttribute('data-jp-theme-light') === 'true';
}

