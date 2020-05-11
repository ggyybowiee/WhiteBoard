import styles from './index.css';

const {
  vendor: {
    react: React,
  },
} = platform;

export default class BlankBox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={styles.content} style={{ display: this.props.show === 'true' ? 'block' : 'none' }}>
        <div className={`${styles.boxWrapper} ${styles[this.props.type]}`} />
        <span className={styles.text}>{this.props.text}</span>
      </div>
    );
  }
}
