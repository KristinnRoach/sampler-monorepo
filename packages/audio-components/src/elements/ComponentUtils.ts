// ComponentUtils.ts - Shared utilities for components
import { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';

/**
 * Creates a function to find the target node ID for a component.
 * Follows the priority: explicit target-node-id > parent sampler > nearest sampler
 */
export const createFindNodeId =
  (attributes: ElementProps, targetNodeId: State<string>) => () => {
    if (targetNodeId.val) return targetNodeId.val;

    // Find parent sampler-element
    const parent = attributes.$this.closest('sampler-element');
    if (parent) return parent.getAttribute('data-node-id');

    // Find nearest sampler-element
    const nearest = document.querySelector('sampler-element');
    return nearest?.getAttribute('data-node-id') || '';
  };

/**
 * Creates a reusable connection handler for sampler components
 */
export const createSamplerConnection = (
  findNodeId: () => string,
  getSampler: (nodeId: string) => any,
  onConnect: (sampler: any) => void
) => {
  let connected = false;

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      onConnect(sampler);
    }
  };

  const createMountHandler = (attributes: ElementProps) => {
    return () => {
      connect();
      const handleReady = (e: CustomEvent) => {
        if (e.detail.nodeId === findNodeId()) connect();
      };
      document.addEventListener('sampler-ready', handleReady as EventListener);
      return () =>
        document.removeEventListener(
          'sampler-ready',
          handleReady as EventListener
        );
    };
  };

  return { connect, createMountHandler };
};
