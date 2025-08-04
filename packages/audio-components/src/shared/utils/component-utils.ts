// component-utils.ts - Shared utilities for components
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
    const parent = attributes.$this.closest('sampler-element') as any;
    if (parent?.nodeId) return parent.nodeId;

    // Find nearest sampler-element and check both nodeId property and node-id attribute
    const nearest = document.querySelector('sampler-element') as any;
    if (nearest?.nodeId) return nearest.nodeId;

    // Fallback to node-id attribute
    return nearest?.getAttribute('node-id') || '';
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
      // Try to connect immediately
      connect();

      // Listen for sampler-ready events
      const handleReady = (e: CustomEvent) => {
        if (e.detail.nodeId === findNodeId()) connect();
      };
      document.addEventListener('sampler-ready', handleReady as EventListener);

      // Also try connecting periodically for timing issues
      const interval = setInterval(() => {
        if (!connected) connect();
      }, 100);

      return () => {
        document.removeEventListener(
          'sampler-ready',
          handleReady as EventListener
        );
        clearInterval(interval);
      };
    };
  };

  return { connect, createMountHandler };
};
