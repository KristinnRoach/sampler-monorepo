import styles from './App.module.css';
import VoiceTest from './testComponents/VoiceTest';

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
      <VoiceTest />
    </div>
  );
}
