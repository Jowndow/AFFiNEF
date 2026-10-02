import { getInlineEditorByModel } from '@blocksuite/affine-rich-text';
import type { AffineInlineEditor } from '@blocksuite/affine-shared/types';
import { DisposableGroup } from '@blocksuite/global/disposable';
import {
  TextSelection,
  type UIEventStateContext,
  WidgetComponent,
} from '@blocksuite/std';
import { InlineEditor } from '@blocksuite/std/inline';
import debounce from 'lodash-es/debounce';

import { AFFINE_SLASH_MENU_TRIGGER_KEY } from './consts';
import { SlashMenuExtension } from './extensions';
import { SlashMenu } from './slash-menu-popover';
import type { SlashMenuConfig, SlashMenuContext, SlashMenuItem } from './types';
import { buildSlashMenuItems } from './utils';
let globalAbortController = new AbortController();

function closeSlashMenu() {
  globalAbortController.abort();
}

const showSlashMenu = ({
  context,
  config,
  container = document.body,
  abortController = new AbortController(),
  configItemTransform,
}: {
  context: SlashMenuContext;
  config: SlashMenuConfig;
  container?: HTMLElement;
  abortController?: AbortController;
  configItemTransform: (item: SlashMenuItem) => SlashMenuItem;
}) => {
  globalAbortController = abortController;

  const inlineEditor = getInlineEditorByModel(
    context.std,
    context.model
  );

  if (!inlineEditor) {
    return;
  }

  const disposables = new DisposableGroup();

  abortController.signal.addEventListener(
    'abort',
    () => disposables.dispose(),
    { once: true }
  );

  const slashMenu = new SlashMenu(
    inlineEditor,
    abortController
  );

  slashMenu.context = context;

  // This is likely the expensive operation.
  slashMenu.items = buildSlashMenuItems(
    typeof config.items === 'function'
      ? config.items(context)
      : config.items,
    context,
    configItemTransform
  );

  disposables.add(() => slashMenu.remove());

  container.append(slashMenu);

  return slashMenu;
};


export class AffineSlashMenuWidget extends WidgetComponent {
  private readonly _getInlineEditor = (evt: CompositionEvent | InputEvent) => {
    if (evt.target instanceof HTMLElement) {
      const editor = (
        evt.target.closest('.inline-editor') as {
          inlineEditor?: AffineInlineEditor;
        }
      )?.inlineEditor;
      if (editor instanceof InlineEditor) {
        return editor;
      }
    }

    const textSelection = this.host.selection.find(TextSelection);
    if (!textSelection) return;

    const model = this.host.store.getBlock(textSelection.blockId)?.model;
    if (!model) return;

    return getInlineEditorByModel(this.std, model);
  };

  private readonly _handleInput = (
    inlineEditor: InlineEditor,
    isCompositionEnd: boolean
  ) => {
    const inlineRangeApplyCallback = (callback: () => void) => {
      // the inline ranged updated in compositionEnd event before this event callback
      if (isCompositionEnd) {
        callback();
      } else {
        const subscription = inlineEditor.slots.inlineRangeSync.subscribe(
          () => {
            subscription.unsubscribe();
            callback();
          }
        );
      }
    };

    if (this.block?.model.flavour !== 'affine:page') {
      console.error('SlashMenuWidget should be used in RootBlock');
      return;
    }

    inlineRangeApplyCallback(() => {
      const textSelection = this.host.selection.find(TextSelection);
      if (!textSelection) return;

      const block = this.host.view.getBlock(textSelection.blockId);
      if (!block) return;
      const model = block.model;

      if (this.config.disableWhen?.({ model, std: this.std })) return;

      const inlineRange = inlineEditor.getInlineRange();
      if (!inlineRange) return;

      const textPoint = inlineEditor.getTextPoint(inlineRange.index);
      if (!textPoint) return;

      const [leafStart, offsetStart] = textPoint;

      const text = leafStart.textContent
        ? leafStart.textContent.slice(0, offsetStart)
        : '';

      if (!text.endsWith(AFFINE_SLASH_MENU_TRIGGER_KEY)) return;

      closeSlashMenu();
      showSlashMenu({
        context: {
          model,
          std: this.std,
        },
        config: this.config,
        configItemTransform: this.configItemTransform,
      });
    });
  };

  private readonly _onCompositionEnd = (ctx: UIEventStateContext) => {
    const event = ctx.get('defaultState').event as CompositionEvent;

    if (event.data !== AFFINE_SLASH_MENU_TRIGGER_KEY) return;

    const inlineEditor = this._getInlineEditor(event);
    if (!inlineEditor) return;

    this._handleInput(inlineEditor, true);
  };

  private readonly _onBeforeInput = (ctx: UIEventStateContext) => {
    const event = ctx.get('defaultState').event;

    if (!(event instanceof InputEvent)) return;
    if (event.data === null || event.isComposing) return;
    if (!event.data.includes(AFFINE_SLASH_MENU_TRIGGER_KEY)) return;

    const inlineEditor = this._getInlineEditor(event);
    if (!inlineEditor) return;

    requestAnimationFrame(() => {
      this._handleInput(inlineEditor, true);
    });
  };


  get config() {
    return this.std.get(SlashMenuExtension).config;
  }

  // TODO(@L-Sun): Remove this when moving each config item to corresponding blocks
  // This is a temporary way for patching the slash menu config
  configItemTransform: (item: SlashMenuItem) => SlashMenuItem = item => item;

  override connectedCallback() {
    super.connectedCallback();

    this.handleEvent('beforeInput', this._onBeforeInput);
    this.handleEvent('compositionEnd', this._onCompositionEnd);
  }
}
