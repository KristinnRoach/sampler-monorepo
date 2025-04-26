import { NodeProps } from 'reactflow';
interface KeyboardNodeData {
    onNoteOn?: (midiNote: number, velocity?: number) => void;
    onNoteOff?: (midiNote: number) => void;
    registerMethods?: (methods: any) => void;
}
declare const KeyboardNode: ({ data, isConnectable }: NodeProps<KeyboardNodeData>) => import("react/jsx-runtime").JSX.Element;
export default KeyboardNode;
//# sourceMappingURL=KeyboardNode.d.ts.map