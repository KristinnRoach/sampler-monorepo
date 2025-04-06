import { Component, createSignal } from 'solid-js';
import styles from './styles.module.css';

const BoardComponent: Component = () => {
  const [grabbingBoard, setGrabbingBoard] = createSignal<boolean>(false);

  return (
    <div id='boardWrapper' class={styles.wrapper}>
      <div
        id='board'
        class={grabbingBoard() ? styles.boardDragging : styles.board}
      ></div>
    </div>
  );
};

export default BoardComponent;
