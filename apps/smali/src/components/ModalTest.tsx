import { createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';

function ModalTest() {
  const [isOpen, setIsOpen] = createSignal(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <div>
      <button id='testbutton' onClick={openModal}>
        Open Modal
      </button>

      {isOpen() && (
        <Portal mount={document.querySelector('#testbutton')!}>
          <div style={modalOverlayStyle} onClick={closeModal}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <h2>Modal Title</h2>
              <p>This is a simple modal dialog in SolidJS.</p>
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed' as const,
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  'background-color': 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  'justify-content': 'center',
  'align-items': 'center',
};

const modalContentStyle = {
  'background-color': 'white',
  padding: '20px',
  'border-radius': '8px',
  'box-shadow': '0 2px 10px rgba(0, 0, 0, 0.1)',
};

export default ModalTest;
