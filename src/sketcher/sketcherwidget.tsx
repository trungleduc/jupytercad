import { Button } from '@jupyterlab/ui-components';
import * as React from 'react';
import { drawLine, drawPoint } from './helper';
import { PanZoom } from './panzoom';
import { IPosition, SketcherModel } from './sketchermodel';

interface IProps {
  model: SketcherModel;
}
interface IState {
  mode?: 'POINT' | 'LINE';
  currentPointer?: IPosition;
}

export class SketcherReactWidget extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
    this._gridSize = props.model.gridSize;
  }

  componentDidMount(): void {
    setTimeout(() => {
      this.initiateEditor();
    }, 100);
  }

  get ctx(): CanvasRenderingContext2D | null {
    const canvas = this._canvasRef.current;
    if (!canvas) {
      return null;
    }
    return canvas.getContext('2d');
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
      canvas.addEventListener(ev as any, this.mousePanAnZoom)
    );
    canvas.addEventListener('wheel', this.mousePanAnZoom, { passive: false });

    canvas.addEventListener('mousedown', this.handleRightClick);
    canvas.addEventListener('click', this.handleLeftClick);
    canvas.addEventListener('mousemove', this.handleMouseMove);

    const ctx = canvas.getContext('2d')!;
    this._panZoom = new PanZoom(ctx, this._gridSize);
    this._panZoom.x = canvas.width / 2;
    this._panZoom.y = canvas.height / 2;
    requestAnimationFrame(this.update);
  }

  handleMouseMove = (e: MouseEvent) => {
    const model = this.props.model;
    const localPos = this.globalToLocalPos({ x: e.pageX, y: e.pageY });
    const worldPos = this.screenToWorldPos(localPos);
    switch (this.state.mode) {
      case 'LINE': {
        if (model.editing.type === 'LINE') {
          const startPointId = model.editing.content!['startPoint'];
          const tempLineId = model.editing.content!['tempLine'];

          const startPoint = model.getPointById(startPointId);
          // const endPoint = model.getPointById(endPointId);
          if (startPoint) {
            if (tempLineId) {
              model.removeLine(tempLineId);
            }
            const newTempLine = model.addLine(startPoint.position, worldPos);
            model.updateEditiing('LINE', {
              ...model.editing.content,
              tempLine: newTempLine
            });
          }
        }
        break;
      }
      case 'POINT': {
        break;
      }
      default:
        break;
    }
  };
  handleRightClick = (e: MouseEvent) => {
    if (e.button !== 2) {
      return;
    }
    const model = this.props.model;
    const localPos = this.globalToLocalPos({ x: e.pageX, y: e.pageY });
    const worldPos = this.screenToWorldPos(localPos);
    const pointId = model.getPointByPosition(worldPos);
    if (pointId) {
      const selectedLines = model.getLineByControlPoint(pointId);
      selectedLines.forEach(id => model.removeLine(id));
      model.removePoint(pointId);
    }
  };

  handleLeftClick = (e: MouseEvent) => {
    if (!this._canvasRef.current) {
      return;
    }
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    const { model } = this.props;
    const mousePosition = this.globalToLocalPos({ x: e.pageX, y: e.pageY });
    const worldPos = this.screenToWorldPos(mousePosition);
    switch (this.state.mode) {
      case 'LINE': {
        if (model.editing.type === 'LINE') {
          model.addPoint(worldPos, { color: '#ffffff00' });
          const lineId = model.editing.content!['tempLine'];
          const line = model.getLineById(lineId)!;
          const midpoint = {
            x: (line.start.x + line.end.x) / 2,
            y: (line.start.y + line.end.y) / 2
          };
          const mid = model.addPoint(midpoint, { color: 'red' });
          line.controlPoints = [mid];
          model.stopEdit();
        } else {
          const startPoint = model.addPoint(worldPos, { color: '#ffffff00' });
          model.startEdit('LINE', { startPoint });
        }
        break;
      }
      case 'POINT': {
        model.addPoint(worldPos);
        break;
      }
      default:
        break;
    }
  };

  mousePanAnZoom = (e: MouseEvent) => {
    if (!this._canvasRef.current) {
      return;
    }

    const localPos = this.globalToLocalPos({ x: e.pageX, y: e.pageY });
    this._mouse.x = localPos.x;
    this._mouse.y = localPos.y;

    this._mouse.button =
      e.type === 'mousedown' && e.button === 2
        ? true
        : e.type === 'mouseup'
        ? false
        : this._mouse.button;
    if (e.type === 'wheel') {
      this._mouse.wheel += -(e as WheelEvent).deltaY;
      e.preventDefault();
    }
    const currentPos = this.screenToWorldPos(this._mouse);
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
    const worldCoord = this.screenToWorldPos({ x, y });
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
    drawPoint(ctx, newScreenPos, 'crimson');
  };

  draw = () => {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    const { model } = this.props;
    const panZoom = this._panZoom;
    model.points.forEach((val, key) => {
      const newScreenPos = panZoom.toScreen(val.position);
      const color = val.option?.color;
      drawPoint(ctx, newScreenPos, color);
    });
    model.lines.forEach(val => {
      const screenStart = panZoom.toScreen(val.start);
      const screenEnd = panZoom.toScreen(val.end);
      drawLine(ctx, screenStart, screenEnd, 'red', 1);
    });
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
    this.drawGrid(this._gridSize);
    this.drawPointer(mouse.x, mouse.y);
    this.draw();
    requestAnimationFrame(this.update);
  };

  globalToLocalPos = (global: IPosition): IPosition => {
    const bounds = this._canvasRef.current!.getBoundingClientRect();
    const x = global.x - bounds.left - scrollX;
    const y = global.y - bounds.top - scrollY;
    return { x, y };
  };
  screenToWorldPos = (screen: IPosition): IPosition => {
    let worldPos = this._panZoom!.toWorld(screen, true);
    const nearPoint = this.props.model.getPointByPosition(worldPos);
    if (nearPoint) {
      const p = this.props.model.getPointById(nearPoint)!;
      worldPos = p.position;
    }
    return worldPos;
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
            className={`jp-Button jp-mod-minimal jp-ToolbarButtonComponent jp-mod-styled ${
              this.state.mode === 'POINT' ? 'highlight' : ''
            }`}
            style={{ color: 'const(--jp-ui-font-color1)' }}
            onClick={async () => {
              if (this.state.mode !== 'POINT') {
                this.setState(old => ({ ...old, mode: 'POINT' }));
              } else {
                this.setState(old => ({ ...old, mode: undefined }));
              }
            }}
          >
            POINT
          </Button>
          <Button
            className={`jp-Button jp-mod-minimal jp-ToolbarButtonComponent jp-mod-styled ${
              this.state.mode === 'LINE' ? 'highlight' : ''
            }`}
            style={{ color: 'const(--jp-ui-font-color1)' }}
            onClick={async () => {
              if (this.state.mode !== 'LINE') {
                this.setState(old => ({ ...old, mode: 'LINE' }));
              } else {
                this.setState(old => ({ ...old, mode: undefined }));
              }
            }}
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
  private _gridSize: number; //grid size in pixels
  private _scaleRate = 1.02;
  private _topLeft = { x: 0, y: 0 }; // top left position of canvas in world coords.
  private _divRef = React.createRef<HTMLDivElement>();
  private _canvasRef = React.createRef<HTMLCanvasElement>();
  private _panZoom: PanZoom;
  // private _lightTheme =
  //   document.body.getAttribute('data-jp-theme-light') === 'true';
}
