import { LibNode, Messenger, ParamType } from '@/LibNode';
import { MessageHandler, Message } from '@/events';

export interface ParamDescriptor {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'enum';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: any;
  enumValues?: string[];
  group?: string;
}

export interface LibParam extends LibNode, Messenger {
  getValue: () => any;
  setValue: (value: any) => void;

  // UI integration
  descriptor: ParamDescriptor;
  onChange?: (callback: MessageHandler<Message>) => () => void;
}

export { type ParamType };
