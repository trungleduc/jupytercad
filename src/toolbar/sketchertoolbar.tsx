import { Button } from '@jupyterlab/ui-components';
import * as React from 'react';

import { ToolbarModel } from './model';
import { SketcherDialog } from '../sketcher/sketcherdialog';

interface IProps {
  toolbarModel: ToolbarModel;
}

export class SketcherToolbarReact extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  render(): React.ReactNode {
    return (
      <div style={{ paddingLeft: '10px', display: 'flex' }}>
        <Button
          className={'jp-Button jp-mod-minimal jp-ToolbarButtonComponent'}
          style={{ color: 'var(--jp-ui-font-color1)' }}
          onClick={async () => {
            const dialog = new SketcherDialog({
              toolbarModel: this.props.toolbarModel
            });
            await dialog.launch();
          }}
        >
          NEW SKETCH
        </Button>
      </div>
    );
  }
}
