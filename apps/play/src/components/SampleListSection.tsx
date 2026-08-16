// components/SampleListSection.tsx
import { Component, createSignal, For, onCleanup, onMount } from 'solid-js';
import { db, SavedSample } from '../db/samplelib/sampleIdb';
import { loadDefaultSample } from '../utils/audio/currentSampleStorage';

interface SampleListSectionProps {
  onSampleSelect: (sample: SavedSample) => void;
}

const SampleListSection: Component<SampleListSectionProps> = (props) => {
  const [samples, setSamples] = createSignal<SavedSample[]>([]);
  const [loading, setLoading] = createSignal(false);

  const loadSamples = async () => {
    setLoading(true);
    try {
      const [defaultAudioData, savedSamples] = await Promise.all([
        loadDefaultSample(),
        db.samples.orderBy('createdAt').reverse().toArray(),
      ]);
      setSamples([
        { name: 'Default sample', audioData: defaultAudioData },
        ...savedSamples,
      ]);
    } catch (error) {
      console.error('Failed to load samples:', error);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    void loadSamples();
    document.addEventListener('sample:saved', loadSamples);
  });
  onCleanup(() => document.removeEventListener('sample:saved', loadSamples));

  const handleDelete = async (sample: SavedSample, event: Event) => {
    event.stopPropagation();
    try {
      await db.samples.delete(sample.id!);
      loadSamples();
    } catch (error) {
      console.error('Failed to delete sample:', error);
    }
  };

  const handleKeyDown = (sample: SavedSample, event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      props.onSampleSelect(sample);
    }
  };

  return (
    <div>
      {loading() ? (
        <div>Loading...</div>
      ) : (
        <For each={samples()}>
          {(sample) => (
            <div
              class='sample-item'
              role='button'
              tabindex='0'
              onclick={() => props.onSampleSelect(sample)}
              onkeydown={(e) => handleKeyDown(sample, e)}
            >
              <div class='sample-info'>
                <div class='sample-name'>{sample.name}</div>
                <div class='sample-date'>
                  {sample.createdAt?.toLocaleDateString() ?? 'Built in'}
                </div>
              </div>
              {sample.id !== undefined && (
                <button
                  type='button'
                  class='delete-button'
                  onclick={(e) => handleDelete(sample, e)}
                  title={`Delete ${sample.name}`}
                  aria-label={`Delete ${sample.name}`}
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z' />
                  </svg>
                </button>
              )}
            </div>
          )}
        </For>
      )}
    </div>
  );
};

export default SampleListSection;
