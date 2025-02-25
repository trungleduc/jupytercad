import {
  IDict,
  IJupyterCadClientState,
  IJupyterCadModel
} from '@jupytercad/schema';
import { Dialog } from '@jupyterlab/apputils';
import * as React from 'react';

import { ObjectPropertiesForm } from './panelview/formbuilder';
import { focusInputField, removeStyleFromProperty } from './tools';

export interface IFormDialogOptions {
  schema: IDict;
  sourceData: IDict;
  title: string;
  cancelButton: (() => void) | boolean;
  syncData: (props: IDict) => void;
  syncSelectedPropField?: (
    id: string | null,
    value: any,
    parentType: 'dialog' | 'panel'
  ) => void;
  model: IJupyterCadModel;
}

export class FormDialog extends Dialog<IDict> {
  constructor(options: IFormDialogOptions) {
    let cancelCallback: (() => void) | undefined = undefined;
    if (options.cancelButton) {
      cancelCallback = () => {
        if (options.cancelButton !== true && options.cancelButton !== false) {
          options.cancelButton();
        }
        this.resolve(0);
      };
    }
    const filePath = options.model.filePath;
    const jcadModel = options.model;
    const body = (
      <div style={{ overflow: 'hidden' }}>
        <ObjectPropertiesForm
          parentType="dialog"
          filePath={`${filePath}::dialog`}
          sourceData={options.sourceData}
          schema={options.schema}
          syncData={options.syncData}
          cancel={cancelCallback}
          syncSelectedField={options.syncSelectedPropField}
        />
      </div>
    );
    let lastSelectedPropFieldId;
    const onClientSharedStateChanged = (
      sender: IJupyterCadModel,
      clients: Map<number, IJupyterCadClientState>
    ): void => {
      const remoteUser = jcadModel?.localState?.remoteUser;
      if (remoteUser) {
        const newState = clients.get(remoteUser);

        const id = newState?.selectedPropField?.id;
        const value = newState?.selectedPropField?.value;
        const parentType = newState?.selectedPropField?.parentType;
        if (parentType === 'dialog') {
          lastSelectedPropFieldId = focusInputField(
            `${filePath}::dialog`,
            id,
            value,
            newState?.user?.color,
            lastSelectedPropFieldId
          );
        }
      } else {
        if (lastSelectedPropFieldId) {
          removeStyleFromProperty(
            `${filePath}::dialog`,
            lastSelectedPropFieldId,
            ['border-color', 'box-shadow']
          );

          lastSelectedPropFieldId = undefined;
        }
      }
    };

    jcadModel?.clientStateChanged.connect(onClientSharedStateChanged);
    super({ title: options.title, body, buttons: [Dialog.cancelButton()] });
    this.addClass('jpcad-property-FormDialog');
  }
}
