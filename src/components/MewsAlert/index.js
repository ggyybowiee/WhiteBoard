import themes from '../../theme';
import { MEWS_ALERT_LEVEL_DIC, GENDER_MAP, NURSE_LEVEL_DIC } from './const.js';

const {
  vendor: {
    react: React,
    dva: { connect },
    antd: { Select },
    classnames: classNames,
    moment,
  },
  app,
} = platform;

const getAdviceList = (nursingAdvise) => {
  if (!nursingAdvise) {
    return [];
  }

  return nursingAdvise.split('\n');
}

const handleAlertLater = (data) => {
  app._store.dispatch({
    type: 'alarmEvent/handleAlertLater',
    payload: {
      id: data.id,
      queryParams: {
        confirmed: false,
        needCopy: false,
      }
    },
  });
}

const handleAlert = (data) => {
  app._store.dispatch({
    type: 'alarmEvent/handleAlert',
    payload: {
      id: data.id,
      queryParams: {
        confirmed: true,
        needCopy: false,
      }
    },
  });
}

let timer = null;

const MewsAlert = ({ wsData, theme }) => {
  const styles = _.get(themes, theme || 'light');
  const htmlFontSize = parseInt(window.getComputedStyle(document.getElementsByTagName('html')[0]).fontSize);

  setTimeout(() => {
    let animatPosition = document.getElementById(`mewsAlertAnimate${_.get(wsData, 'id')}`);
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

      if (frameCount >= 14) {
        offset = 0;
        frameCount = 0;
      }
    }, 60);

  }, 200);

  return (
    <div>
      <div className={classNames(styles.mewsAlertAnimate, {
        [styles.lowDangerAnimate]: _.get(wsData, 'content.alertLevel') === 1,
        [styles.mediumDangerAnimate]: _.get(wsData, 'content.alertLevel') === 2,
        [styles.highDangerAnimate]: _.get(wsData, 'content.alertLevel') === 3,
      })} id={`mewsAlertAnimate${_.get(wsData, 'id')}`}>
        <span className={styles.mewsAlertText}>
          <label>{_.get(wsData, 'content.totalScore')}</label>
          <span>分</span>
        </span>
      </div>
      <div className={styles.mewsContent}>
        <div className={styles.mewsInfo}>
          <div className={styles.mewsAlertHeader}>
            <span>MEWS</span>
            <span style={{ color: MEWS_ALERT_LEVEL_DIC[_.get(wsData, 'content.alertLevel')].color }}>{MEWS_ALERT_LEVEL_DIC[_.get(wsData, 'content.alertLevel')].text}</span>
          </div>
          <p className={styles.mewsAlertTime}>
            {moment(_.get(wsData, 'content.alertTime')).format('YYYY-MM-DD HH:mm:ss')}
          </p>
          <div className={styles.mewsAlertVital}>
            {
              _.get(wsData, 'content.vitals') && _.map(_.get(wsData, 'content.vitals'), (item) => {
                return (
                  <div className={styles.mewsAlertVitalDetailPanel} key={item.id}>
                    <div className={styles.mewsAlertVitalDetailVital}>
                      <span>
                        {_.get(app._store.getState(), `dictionary.meaningMap.vitalItem.${item.vitalSign}`)} : {item.value}
                      </span>
                    </div>
                    <div className={styles.mewsAlertVitalDetailLine}></div>
                    <div className={styles.mewsAlertVitalDetailScore}>{item.score}</div>
                  </div>
                )
              })
            }
          </div>
        </div>
        <div className={styles.patientInfo}>
          <div className={styles.mewsAlertHeader}>
            <span>{_.get(wsData, 'content.bedCode')}床</span>
            <span>{_.get(wsData, 'content.patName')}</span>
          </div>
          <p className={styles.mewsHeaderPatPanel}>
            {_.get(wsData, 'content.age')}&nbsp;|&nbsp;{GENDER_MAP[_.get(wsData, 'content.gender')]}&nbsp;|&nbsp;{NURSE_LEVEL_DIC[_.get(wsData, 'content.nurseLevel')]}&nbsp;|&nbsp;
              <span className={styles.diagnoise}>{_.get(wsData, 'content.diagnoise')}</span>
          </p>
          <div className={styles.mewsAlertProcessPanel}>
            <ul>
              {
                _.get(wsData, 'content.nursingAdvice') && _.map(getAdviceList(_.get(wsData, 'content.nursingAdvice')), (item, index) => {
                  return (
                    <li key={`${item}${index}`}>
                      <span>●&nbsp;</span>
                      {item}
                    </li>
                  )
                })
              }
            </ul>
          </div>
        </div>
        <div></div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <a onClick={() => handleAlertLater(wsData)} className={styles.handleAlertLaterButton}>稍后提醒</a>
        <a onClick={() => handleAlert(wsData)} className={styles.handleAlertButton}>知道了</a>
      </div>
    </div>
  )
};

export default MewsAlert;