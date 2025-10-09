// components/SampleListSection.tsx
import { Component, createSignal, For } from 'solid-js';
import { db, SavedSample } from '../db/samplelib/sampleIdb';

interface SampleListSectionProps {
  onSampleSelect: (sample: SavedSample) => void;
}

const SampleListSection: Component<SampleListSectionProps> = (props) => {
  const [samples, setSamples] = createSignal<SavedSample[]>([]);
  const [loading, setLoading] = createSignal(false);

  const loadSamples = async () => {
    setLoading(true);
    try {
      const allSamples = await db.samples
        .orderBy('createdAt')
        .reverse()
        .toArray();
      setSamples(allSamples);
    } catch (error) {
      console.error('Failed to load samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sample: SavedSample, event: Event) => {
    event.stopPropagation();
    try {
      await db.samples.delete(sample.id!);
      loadSamples();
    } catch (error) {
      console.error('Failed to delete sample:', error);
    }
  };

  // Load samples on mount
  loadSamples();

  return (
    <div>
      {loading() ? (
        <div>Loading...</div>
      ) : (
        <For each={samples()}>
          {(sample) => (
            <div
              class='sample-item'
              onclick={() => props.onSampleSelect(sample)}
            >
              <div class='sample-info'>
                <div class='sample-name'>{sample.name}</div>
                <div class='sample-date'>
                  {sample.createdAt?.toLocaleDateString()}
                </div>
              </div>
              <button
                class='delete-button'
                onclick={(e) => handleDelete(sample, e)}
                title={`Delete ${sample.name}`}
              >
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z' />
                </svg>
              </button>
            </div>
          )}
        </For>
      )}
      {samples().length === 0 && !loading() && (
        <div class='no-samples'>No saved samples</div>
      )}
    </div>
  );
};

export default SampleListSection;
