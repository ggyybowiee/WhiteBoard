import themes from '../../theme';

const {
  vendor: {
    react: React,
    antd: { Select },
    classnames: classNames,
  },
  app,
} = platform;

const handleReceiveClick = (data) => {
  app._store.dispatch({
    type: 'alarmEvent/getReceive',
    payload: {
      deviceId: _.get(data, 'content.deviceId'),
    },
  });
}

let timer = null;

const WarningWristband = ({ wsData, theme }) => {
  const styles = _.get(themes, theme || 'light');
  const htmlFontSize = parseInt(window.getComputedStyle(document.getElementsByTagName('html')[0]).fontSize);
  
  setTimeout(() => {
    let animatPosition = document.getElementById(`warningWristbandAnimate${_.get(wsData, 'id')}`);
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

      if (frameCount >= 30) {
        offset = 0;
        frameCount = 0;
      }
    }, 40);

  }, 200);

  return (
    <div>
      <div className={styles.warningWristbandAnimate} id={`warningWristbandAnimate${_.get(wsData, 'id')}`}></div>
      <div className={styles.leavingPatInfo}>
        <span>{_.get(wsData, 'content.patInhosRecord.bedCode')}床</span>
        <span>{_.get(wsData, 'content.patInhosRecord.patName')}</span>
      </div>
      <p className={styles.leaveAction}>离开病区</p>
      <div style={{ textAlign: 'center' }}>
        <a onClick={() => handleReceiveClick(wsData)} className={styles.receiveButton}>收到</a>
      </div>
    </div>
  )
};

export default WarningWristband;