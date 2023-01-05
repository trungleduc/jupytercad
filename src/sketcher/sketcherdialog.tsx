import { Dialog } from '@jupyterlab/apputils';
import * as React from 'react';
import { ToolbarModel } from "../toolbar/model";
import { IDict } from '../types';
import { SketcherModel } from './sketchermodel';
import { SketcherReactWidget } from "./sketcherwidget";

export interface ISketcherDialogOptions {
    toolbarModel: ToolbarModel;
  }
  
  export class SketcherDialog extends Dialog<IDict> {
    constructor(options: ISketcherDialogOptions) {
        const model = new SketcherModel({gridSize: 64})
      const body = <SketcherReactWidget model={model} />;
      super({ title: 'Sketcher', body, buttons: [] });
      this.addClass('jpcad-sketcher-SketcherDialog');
    }
  }
  