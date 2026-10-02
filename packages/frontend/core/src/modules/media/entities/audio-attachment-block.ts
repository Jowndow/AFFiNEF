
import { insertFromMarkdown } from '@affine/core/blocksuite/utils';
import { preprocessAudioBlobForTranscription } from '@affine/core/utils/opus-encoding';
import { DebugLogger } from '@affine/debug';
import track from '@affine/track';
import type { AttachmentBlockModel } from '@blocksuite/affine/model';
import type { AffineTextAttributes } from '@blocksuite/affine/shared/types';
import { type DeltaInsert, Text } from '@blocksuite/affine/store';
import { computed } from '@preact/signals-core';
import { Entity, LiveData } from '@toeverything/infra';
import { cssVarV2 } from '@toeverything/theme/v2';

import type { WorkspaceService } from '../../workspace';
import type { AudioMediaManagerService } from '../services/audio-media-manager';
import type { MeetingSettingsService } from '../services/meeting-settings';
import type { AudioMedia } from './audio-media';
import { AudioTranscriptionJob } from './audio-transcription-job';
import type { TranscriptionResult } from './types';

const logger = new DebugLogger('audio-attachment-block');

// BlockSuiteError: yText must not contain "\r" because it will break the range synchronization
function sanitizeText(text: string) {
  return text.replace(/\r/g, '');
}

function requireTranscriptionBlockProps(
) {
}

const colorOptions = [
  cssVarV2.text.highlight.fg.red,
  cssVarV2.text.highlight.fg.green,
  cssVarV2.text.highlight.fg.blue,
  cssVarV2.text.highlight.fg.yellow,
  cssVarV2.text.highlight.fg.purple,
  cssVarV2.text.highlight.fg.orange,
  cssVarV2.text.highlight.fg.teal,
  cssVarV2.text.highlight.fg.grey,
  cssVarV2.text.highlight.fg.magenta,
];

export class AudioAttachmentBlock extends Entity<AttachmentBlockModel> {
  private readonly refCount$ = new LiveData<number>(0);
  readonly audioMedia: AudioMedia;
  constructor(
    readonly audioMediaManagerService: AudioMediaManagerService,
    readonly workspaceService: WorkspaceService,
    readonly meetingSettingsService: MeetingSettingsService
  ) {
    super();
    const mediaRef = audioMediaManagerService.ensureMediaEntity(this.props);
    this.audioMedia = mediaRef.media;
    this.disposables.push(() => mediaRef.release());
    this.disposables.push(() => {
    });
  }

  // rendering means the attachment is visible in the editor
  // it is used to determine if we should show show the audio player on the sidebar
  rendering$ = this.refCount$.map(refCount => refCount > 0);
  expanded$ = new LiveData<boolean>(true);

  readonly transcriptionBlock$ = LiveData.fromSignal(
    computed(() => {
      // find the last transcription block
      for (const key of [...this.props.childMap.value.keys()].reverse()) {
        const block = this.props.store.getBlock$(key);
        
      }
      return null;
    })
  );

  hasTranscription$ = LiveData.computed(get => {
    const transcriptionBlock = get(this.transcriptionBlock$);
    if (!transcriptionBlock) {
      return null;
    }
    
  });


  mount() {
    

    this.refCount$.setValue(this.refCount$.value + 1);
  }

  unmount() {
    this.refCount$.setValue(this.refCount$.value - 1);
  }

  private createTranscriptionJob() {
    if (!this.props.props.sourceId) {
      throw new Error('No source id');
    }

  
    
  }

  private readonly runTranscription = async (retryFailed: boolean) => {
    
  };

  readonly resumeTranscription = () => this.runTranscription(false);

  readonly transcribe = () => this.runTranscription(true);

  private readonly fillTranscriptionResult = async (
    result: TranscriptionResult
  ) => {
    
  };
}
