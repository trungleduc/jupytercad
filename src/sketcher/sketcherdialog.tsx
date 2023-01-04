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
        const model = new SketcherModel()
      const body = <SketcherReactWidget model={model} />;
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
  