import { LibNode, Messenger, ParamType } from '@/LibNode';
import { MessageHandler, Message } from '@/events';

export interface ParamDescriptor {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'enum';

  // Aligned with AudioParam properties
  minValue?: number;
  maxValue?: number;
  defaultValue: any;

  // Additional properties
  step?: number;
  enumValues?: string[];
  group?: string;

  // Optional automation rate
  automationRate?: 'a-rate' | 'k-rate';
}

export interface LibParam extends LibNode, Messenger {
  getValue: () => any;
  setValue: (value: any) => void;

  // UI integration
  descriptor: ParamDescriptor;
  onChange?: (callback: MessageHandler<Message>) => () => void;
}

export { type ParamType };
