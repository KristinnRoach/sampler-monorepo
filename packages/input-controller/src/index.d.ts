export type NoteEvent = {
    type: 'noteon' | 'noteoff';
    note: number;
    velocity: number;
    channel: number;
    raw: any;
};
type NoteHandler = (event: NoteEvent) => void;
export type NoteTarget = {
    play: (note: number, velocity?: number) => void;
    release: (note: number) => void;
};
export declare class InputController {
    #private;
    init(): Promise<boolean>;
    onNoteOn(handler: NoteHandler): () => void;
    onNoteOff(handler: NoteHandler): () => void;
    registerNoteTarget(target: NoteTarget, channel?: number | 'all'): () => void;
    get initialized(): boolean;
}
export declare const inputController: InputController;
export {};
//# sourceMappingURL=index.d.ts.map