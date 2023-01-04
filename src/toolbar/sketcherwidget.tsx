import { Dialog } from '@jupyterlab/apputils';
import { Button } from '@jupyterlab/ui-components';
import * as React from 'react';

import { IDict } from '../types';
import { ToolbarModel } from './model';

interface IProps {}
interface IState {
  mode?: 'POINT' | 'LINE';
}

class PanZoom {
  constructor(private ctx: CanvasRenderingContext2D) {
    this.x = 0;
    this.y = 0;
    this.scale = 1;
  }
  apply = () => {
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.x, this.y);
  };
  scaleAt = (x, y, sc) => {
    // x & y are screen coords, not world
    this.scale *= sc;
    this.x = x - (x - this.x) * sc;
    this.y = y - (y - this.y) * sc;
  };
  toWorld = (x: number, y: number, point: { x: number; y: number }) => {
    // converts from screen coords to world coords

    const inv = 1 / this.scale;
    point.x = (x - this.x) * inv;
    point.y = (y - this.y) * inv;
    return point;
  };
  x: number;
  y: number;
  scale: number;
}

class SketcherReactWidget extends React.Component<IProps, IState> {
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
    this._panZoom = new PanZoom(ctx);
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
  };

  drawGrid = (gridScreenSize = 128, adaptive = true) => {
    if (!this._canvasRef.current) {
      return;
    }
    const panZoom = this._panZoom;
    const canvas = this._canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let scale, gridScale, size, x, y;

    const w = canvas.width;
    const h = canvas.height;
    if (adaptive) {
      scale = 1 / panZoom.scale;
      gridScale = 2 ** (Math.log2(gridScreenSize * scale) | 0);
      size = Math.max(w, h) * scale + gridScale * 2;
      x = (((-panZoom.x * scale - gridScale) / gridScale) | 0) * gridScale;
      y = (((-panZoom.y * scale - gridScale) / gridScale) | 0) * gridScale;
    } else {
      gridScale = gridScreenSize;
      size = Math.max(w, h) / panZoom.scale + gridScale * 2;
      panZoom.toWorld(0, 0, this._topLeft);
      x = Math.floor(this._topLeft.x / gridScale) * gridScale;
      y = Math.floor(this._topLeft.y / gridScale) * gridScale;
      if (size / gridScale > this._gridLimit) {
        size = gridScale * this._gridLimit;
      }
    }
    panZoom.apply();
    ctx.lineWidth = 1;
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
  };

  drawPoint = (x: number, y: number) => {
    const panZoom = this._panZoom;
    const canvas = this._canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const worldCoord = panZoom.toWorld(x, y, { x: 0, y: 0 });
    panZoom.apply();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(
      worldCoord.x - (2 / panZoom.scale) * canvas.width,
      worldCoord.y
    );
    ctx.lineTo(
      worldCoord.x + (2 / panZoom.scale) * canvas.width,
      worldCoord.y
    );
    ctx.moveTo(worldCoord.x, worldCoord.y - (2 / panZoom.scale) * canvas.height);
    ctx.lineTo(worldCoord.x, worldCoord.y + (2 / panZoom.scale) * canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); //reset the transform so the lineWidth is 1
    ctx.stroke();
  };
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
    this.drawGrid(this._gridSize, false);
    this.drawPoint(mouse.x, mouse.y);
    requestAnimationFrame(this.update);
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
  private _gridSize = 64; //grid size in pixels
  private _scaleRate = 1.02;
  private _topLeft = { x: 0, y: 0 }; // top left position of canvas in world coords.
  private _divRef = React.createRef<HTMLDivElement>();
  private _canvasRef = React.createRef<HTMLCanvasElement>();
  private _panZoom: PanZoom;
  // private _lightTheme =
  //   document.body.getAttribute('data-jp-theme-light') === 'true';
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
