import styles from './App.module.css';
// import VoiceTest from './testComponents/VoiceTest';
//import GrainTest from './testComponents/GrainTest';
import Test from './SourcePlayer/Test';

export default function App() {
  return (
    <div
      className={styles.app}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        padding: '1rem',
        gap: '2rem',
      }}
    >
      {/* <VoiceTest /> */}
      {/* <GrainTest /> */}
      <Test />
    </div>
  );
}
