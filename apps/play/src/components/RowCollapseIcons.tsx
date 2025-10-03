import { Component } from 'solid-js';

const RowCollapseIcons: Component = () => {
  return (
    <>
      <div class='row-collapse-icon' data-row='1' style='grid-area: space' />
      <div class='row-collapse-icon' data-row='2' style='grid-area: feedback' />
      <div class='row-collapse-icon' data-row='3' style='grid-area: lfo' />
      <div class='row-collapse-icon' data-row='4' style='grid-area: keyboard' />
    </>
  );
};

export default RowCollapseIcons;
