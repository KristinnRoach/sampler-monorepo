import { Swapy, SwapyHandle, SwapyItem, SwapySlot } from 'swapy-solid';

const SwapyTest = () => {
  return (
    <div style={{ border: '2px solid black', padding: '20px' }}>
      <h2>Swapy Test</h2>
      <p>Drag and drop the items below:</p>
      <Swapy>
        <SwapySlot>
          <SwapyItem itemId='item-1'>
            <div
              style={{
                padding: '10px',
                border: '1px solid gray',
                margin: '5px',
              }}
            >
              Item 1{/* <SwapyHandle class='handle'>⇅</SwapyHandle> */}
            </div>
          </SwapyItem>
        </SwapySlot>
        <SwapySlot>
          <SwapyItem itemId='item-2'>
            <div
              style={{
                padding: '10px',
                border: '1px solid gray',
                margin: '5px',
              }}
            >
              Item 2{/* <SwapyHandle class='handle'>⇅</SwapyHandle> */}
            </div>
          </SwapyItem>
        </SwapySlot>

        <SwapySlot>
          <SwapyItem itemId='item-3'>
            <div
              style={{
                padding: '10px',
                border: '1px solid gray',
                margin: '5px',
              }}
            >
              Item 3<SwapyHandle class='handle'>⇅</SwapyHandle>
            </div>
          </SwapyItem>
        </SwapySlot>
      </Swapy>
    </div>
  );
};

export default SwapyTest;

/* 

      <Swapy>
        <SwapySlot>
          <SwapyItem>Content or Component</SwapyItem>
        </SwapySlot>
        <SwapySlot slotId='unique-slot-id-1'>
          <SwapyItem itemId='unique-item-id-1'>
            <div>Content or Component</div>
            <SwapyHandle class='handle' />
          </SwapyItem>
        </SwapySlot>
      </Swapy>

      */
