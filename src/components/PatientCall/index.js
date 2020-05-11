import themes from '../../theme';

const {
  vendor: {
    react: React,
    antd: { Select },
    classnames: classNames,
  },
} = platform;

let timer = null;

const PatientCall = ({ wsData, theme }) => {
  const styles = _.get(themes, theme || 'light');
  const htmlFontSize = parseInt(window.getComputedStyle(document.getElementsByTagName('html')[0]).fontSize);

  setTimeout(() => {
    let animatPosition = document.getElementById(`patientCallAnimate${_.get(wsData, 'id')}`);
    let offset = 0;
    let frameCount = 0;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    timer = setInterval(() => {
      offset += -(16 * htmlFontSize);
      animatPosition.style.backgroundPosition = `${offset}px 0px`;
      frameCount++;

      if (frameCount >= 44) {
        offset = 0;
        frameCount = 0;
      }
    }, 40);

  }, 200);

  return (
    <div>
      <div className={styles.patientCallAnimate} id={`patientCallAnimate${_.get(wsData, 'id')}`}></div>
      <div className={styles.callingPatInfo}>
        <span>{_.get(wsData, 'content.bedCode')}床</span>
        <span>{_.get(wsData, 'content.patName')}</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span className={styles.callingSpan}>呼叫</span>
      </div>
    </div>
  )
};

export default PatientCall;
