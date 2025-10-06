// src/frameworks/shared/types.ts
import { KnobConfig } from '../../elements/primitives/KnobElement';

/**
 * Framework-agnostic props interface for knob presets and shared components.
 * This interface extends the core KnobConfig but excludes framework-specific
 * properties like refs, event handlers, and styling classes.
 */
export interface SharedKnobComponentProps extends Partial<KnobConfig> {
  // UI props that are framework-agnostic
  label?: string;
  valueFormatter?: (value: number) => string;

  // Display configuration
  displayValue?: boolean;

  // Tooltip support
  title?: string;

  // Core preset-compatible properties
  preset?: string; // Will be typed more specifically by consumers
  size?: number;
  color?: string;
  value?: number;

  // Note: Framework-specific properties like:
  // - ref (varies between React.Ref vs (el: KnobElement) => void)
  // - className/class (React vs SolidJS naming)
  // - style (React.CSSProperties vs string | Record<string, string>)
  // - onChange (framework-specific event handling)
  // are intentionally excluded to maintain framework-agnosticism
}

// Re-export core types for convenience
export type {
  KnobConfig,
  KnobChangeEventDetail,
  KnobFactoryOptions,
} from '../../elements/primitives/KnobElement';
