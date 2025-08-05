// LoadButton.ts - Example of optimized component for UI integration

import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';
import { createFindNodeId } from '../../../shared/utils/component-utils';
import {
  BEM_CLASSES,
  createButtonStyle,
  createComponentStyle,
} from '../../../shared/styles/optimized-component-styles';

const { div, button } = van.tags;

/**
 * LoadButton component with UI integration support
 *
 * Features:
 * - Uses CSS custom properties for theming
 * - Uses BEM classes for consistent styling
 * - Provides size and variant attributes
 * - Easy to style from consuming applications
 */
export const LoadButton = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const size = attributes.attr('size', 'md'); // 'sm', 'md', 'lg'
  const variant = attributes.attr('variant', 'secondary'); // 'primary', 'secondary'
  const disabled = attributes.attr('disabled', '');
  const status = van.state('Ready');

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const loadSample = async () => {
    const nodeId = findNodeId();
    if (!nodeId) {
      status.val = 'Sampler not found';
      return;
    }
    const sampler = getSampler(nodeId);
    if (!sampler) {
      status.val = 'Sampler not found';
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';

    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;

      if (files && files.length > 0) {
        const file = files[0];
        status.val = `Loading: ${file.name}...`;

        try {
          const arrayBuffer = await file.arrayBuffer();
          await sampler.loadSample(arrayBuffer);
          status.val = `Loaded: ${file.name}`;
        } catch (error) {
          status.val = `Error: ${error}`;
        }
      }
    };

    fileInput.click();
  };

  return div(
    {
      class: createComponentStyle({
        inline: true,
        disabled: !!disabled.val,
      }),
      'data-component': 'load-button',
      'data-target-node-id': () => targetNodeId.val,
    },
    button(
      {
        class: () =>
          createButtonStyle({
            primary: variant.val === 'primary',
            small: size.val === 'sm',
            disabled: !!disabled.val,
          }),
        onclick: loadSample,
        disabled: () => !!disabled.val,
        'aria-label': 'Load audio sample',
      },
      'Load Sample'
    ),
    div(
      {
        class: `${BEM_CLASSES.COMPONENT}__status`,
        'aria-live': 'polite',
      },
      () => status.val
    )
  );
};

// Export with different sizing options as separate functions
export const SmallLoadButton = (attributes: ElementProps) => {
  // Create new attributes with size set to 'sm'
  const extendedAttributes = Object.assign({}, attributes, {
    attr: (name: string, defaultValue: string) => {
      if (name === 'size') return van.state('sm');
      return attributes.attr(name, defaultValue);
    },
  });
  return LoadButton(extendedAttributes);
};

export const LargeLoadButton = (attributes: ElementProps) => {
  const extendedAttributes = Object.assign({}, attributes, {
    attr: (name: string, defaultValue: string) => {
      if (name === 'size') return van.state('lg');
      return attributes.attr(name, defaultValue);
    },
  });
  return LoadButton(extendedAttributes);
};

export const PrimaryLoadButton = (attributes: ElementProps) => {
  const extendedAttributes = Object.assign({}, attributes, {
    attr: (name: string, defaultValue: string) => {
      if (name === 'variant') return van.state('primary');
      return attributes.attr(name, defaultValue);
    },
  });
  return LoadButton(extendedAttributes);
};
