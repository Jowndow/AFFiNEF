import { MenuSeparator } from '@affine/component';

import { DocsService } from '@affine/core/modules/doc';
import { EditorService } from '@affine/core/modules/editor';
import { TemplateDocService } from '@affine/core/modules/template-doc';
import {
  TemplateListMenu,
  TemplateListMenuAdd,
} from '@affine/core/modules/template-doc/view/template-list-menu';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import { PageRootBlockComponent } from '@blocksuite/affine/blocks/root';
import type { Store } from '@blocksuite/affine/store';
import {
  AiIcon,
  EdgelessIcon,
  TemplateColoredIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import {
  forwardRef,
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAsyncCallback } from '../../components/hooks/affine-async-hooks';
import * as styles from './starter-bar.css';

const Badge = forwardRef<
  HTMLLIElement,
  HTMLAttributes<HTMLLIElement> & {
    icon: React.ReactNode;
    text: string;
    active?: boolean;
  }
>(function Badge({ icon, text, className, active, ...attrs }, ref) {
  return (
    <li
      data-active={active}
      className={clsx(styles.badge, className)}
      ref={ref}
      {...attrs}
    >
      <span className={styles.badgeText}>{text}</span>
      <span className={styles.badgeIcon}>{icon}</span>
    </li>
  );
});

const StarterBarNotEmpty = ({ doc }: { doc: Store }) => {
  const t = useI18n();

  const templateDocService = useService(TemplateDocService);
  const docsService = useService(DocsService);
  const editorService = useService(EditorService);

  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const isTemplate = useLiveData(
    useMemo(
      () => templateDocService.list.isTemplate$(doc.id),
      [doc.id, templateDocService.list]
    )
  );

  const handleSelectTemplate = useAsyncCallback(
    async (templateId: string) => {
      await docsService.duplicateFromTemplate(templateId, doc.id);
      track.doc.editor.starterBar.quickStart({ with: 'template' });
    },
    [doc.id, docsService]
  );

  const startWithEdgeless = useCallback(() => {
    const record = docsService.list.doc$(doc.id).value;
    record?.setPrimaryMode('edgeless');
    editorService.editor.setMode('edgeless');
  }, [doc.id, docsService.list, editorService.editor]);

  const onTemplateMenuOpenChange = useCallback((open: boolean) => {
    if (open) track.doc.editor.starterBar.openTemplateListMenu();
    setTemplateMenuOpen(open);
  }, []);

  const startWithAI = useCallback(() => {
    const std = editorService.editor.editorContainer$.value?.std;
    if (!std) return;

    const rootBlockId = std.host.store.root?.id;
    if (!rootBlockId) return;

    const rootComponent = std.view.getBlock(rootBlockId);
    if (!(rootComponent instanceof PageRootBlockComponent)) return;

    const { id, created } = rootComponent.focusFirstParagraph();
    if (created) {
      const subscription = std.view.viewUpdated.subscribe(v => {
        if (v.id === id) {
          subscription.unsubscribe();
        }
      });
    } else {
    }
  }, [editorService.editor]);

  const showTemplate = !isTemplate;

  if (!showTemplate) {
    return null;
  }

  
};

export const StarterBar = ({ doc }: { doc: Store }) => {
  const [isEmpty, setIsEmpty] = useState(doc.isEmpty);
  const templateDocService = useService(TemplateDocService);

  const isTemplate = useLiveData(
    useMemo(
      () => templateDocService.list.isTemplate$(doc.id),
      [doc.id, templateDocService.list]
    )
  );

  useEffect(() => {
    return doc.isEmpty$.subscribe(value => {
      setIsEmpty(value);
    });
  }, [doc]);

  if (!isEmpty || isTemplate) return null;

  return <StarterBarNotEmpty doc={doc} />;
};
