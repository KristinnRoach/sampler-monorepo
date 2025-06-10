// TODO: make sure this global typing is cool (how does it affect consuming apps?)

export interface ISampleMetadata {
  duration: number; // in seconds
  sampleRate: number;
  channels: number;
  // mimeType ?? encoding format ??
}

// Todo: compare and make adaptors between IdbSample and AppSample (internal app state)
export interface AppSample {
  id: string;
  isLoaded?: boolean; // todo: follow up

  name?: string;
  type?: 'tonal' | 'percussive' | 'texture'; // revisit later

  mimeType?: unknown; // encoding format ??

  audioBuffer?: AudioBuffer; // todo: clarify requirements and simplify
  float32arr?: Float32Array;
  arrayBuffer?: ArrayBuffer;

  url?: string;

  metadata?: ISampleMetadata; // could cram more things in metadata if standards allow
  dateAdded?: Date;
  extraInfo: unknown;
}

// type LoadedSample = AppSample & Required<Pick<AppSample, 'audioBuffer'>>;

export interface IdbSample {
  id: string; // Todo
  url: string; // Original URL or file path
  audioData: ArrayBuffer; // Serializable audio data // todo: check if optimal storage type / format
  dateAdded: Date; // Timestamp for cache management
  metadata: ISampleMetadata;
  isDefaultInitSample?: 0 | 1; // 0: false, 1: true. Used if no sample is provided
  isFromDefaultLib?: 0 | 1; // If from default library provided by the app
}
