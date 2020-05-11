
import themes from '../../theme';
import { NURSING_LEVEL, MOVE_LEVEL, minutesToHour } from './const.js';

const {
  vendor: {
    react: React,
    dva: { connect },
    lodash: _,
    classnames: classNames,
    antd: { Row, Col, Carousel, Spin},
  },
  layouts: {
    TableLayout,
  },
  utils: {
    createSimpleRestModel: {
      createSimpleRestActions,
    },
  },
} = platform;

const { Filters } = TableLayout;
const ogg = require('./match.ogg');

@connect((state) => ({
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
}))
export default class Earlysense extends React.PureComponent {

  state = {
    mounted: false,
    earlySenseCardlist: [],
  };

  earlySenseInterval = null;

  componentDidMount() {

    if (this.props.whiteBoardConfig) {
      this.getEarlySenseCardlist();
      this.refreshEarlySenseCardlist(_.get(this.props.whiteBoardConfig, 'config.basicConfig'));
    }

  }

  componentWillUnmount = () => {

    if (this.earlySenseInterval) {
      clearInterval(this.earlySenseInterval);
      this.earlySenseInterval = null;
    }

  }

  getEarlySenseCardlist = () => {
    const { dispatch, currentWardInfo } = this.props;

    // 床位列表
    dispatch({
      type: 'bedList/getBedList',
      payload: {
        wardCode: _.get(currentWardInfo, 'wardCode'),
      },
    }).then((bedListResponse) => {
      const bedList = bedListResponse;

      // 卧床监控列表
      dispatch({
        type: 'earlysense/getVitalList',
        payload: {
          bedList,
          queryParams: {
            num: 20,
            offset: 0,
            countAll: true,
            orderBy: 'bedCode.asc',
            wardCode: _.get(currentWardInfo, 'wardCode'),
          }
        },
      }).then((response) => {
        let isAlert = false;
        isAlert = _.some(response, item => ((item.hrAlert || item.rrAlert || item.moveAlert || item.notInbedAlert || item.turnoverAlert) && !item.currentVoiceOn) || isAlert);
  
        if (this.audio) {
          isAlert ? this.audio.play() : this.audio.pause();
        }
  
        this.setState({
          earlySenseCardlist: _.chunk(response, 3 * 4),
          mounted: true,
        });
      });
    });
  }

  refreshEarlySenseCardlist = (basicConfig) => {
    if (this.earlySenseInterval) {
      return;
    }

    this.earlySenseInterval = setInterval(() => {
      this.getEarlySenseCardlist();
    }, (_.get(basicConfig, 'refreshInterval')) * 1000);

  }

  renderCardWrap = (sub) => {
    const { whiteBoardConfig } = this.props;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    const isVisible = (tail, property) => _.chain(whiteBoardConfig).get(`config.bedListConfig.${tail}`).find(item => item.itemCode === property).value();

    return (
      <div className={styles.cardWrapPaddingAndFlex}>
        <div className={classNames(styles.cardWrap, {
          [styles.alertCardWrap]: sub.hrAlert || sub.rrAlert || sub.moveAlert || sub.turnoverAlert,
        })}>
          <div className={styles.topRightColorBlock} style={{ borderBottomColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[sub.nurseLevel], borderRightColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[sub.nurseLevel] }}></div>
          <div className={styles.bedNumBox}>
            <span className={styles.bedNum}><b>{sub.bedCode}&nbsp;{sub.patientName}</b></span>
            <span className={styles.nurseLevel}><b>{sub.nurseLevelChinese}级</b></span>
          </div>

          {
            sub.inBed !== 0 ? (
              <div>
                <div className={styles.centerContent}>
                  <Row gutter={16} className={styles.marginTop}>
                    <Col className="gutter-row" span={12} style={{ textAlign: 'center' }}>
                      {
                        sub.hrAlert === 0 ? (<span className={[styles.hrValue, styles.commonValue].join(' ')}>{sub.hr}</span>
                        ) : (
                            <span className={[styles.hrValueExp, styles.commonValue].join(' ')}>{sub.hr}</span>
                          )}
                    </Col>
                    <Col className="gutter-row" span={12} style={{ textAlign: 'center' }}>
                      {
                        sub.rrAlert === 0 ? (
                          <span className={[styles.rrValue, styles.commonValue].join(' ')}>{sub.rr}</span>
                        ) : (
                            <span className={[styles.rrValueExp, styles.commonValue].join(' ')}>{sub.rr}</span>
                          )
                      }
                    </Col>
                  </Row>
                </div>

                <div className={styles.bottomContent}>
                  <Row gutter={16}>
                    <Col className="gutter-row" span={12} style={{ textAlign: 'center' }}>
                      <span className={styles.vitalLabel}>
                        活动
                      {
                          sub.moveAlert === 0 ? (
                            <span className={styles.moveValue}>{sub.moveLevel}</span>
                          ) : (
                              <span className={styles.moveValueExp}>{sub.moveLevel}</span>
                            )
                        }
                      </span>
                    </Col>
                    <Col className="gutter-row" span={12} style={{ textAlign: 'center' }}>
                      {
                        sub.turnoverAlert === 0 ? (
                          <span className={styles.vitalLabel}>翻身 <span className={styles.turnValue}>{sub.nextTurn} </span></span>
                        ) : (
                            <span className={styles.turnValueExp}>请立即翻身</span>
                          )
                      }
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              <div>
                <span className={styles.notInBedCode}>{sub.bedCode}</span>
                <span className={styles.notInBedTime}>离床&nbsp;{minutesToHour(sub.timeInBed)[0]}时{minutesToHour(sub.timeInBed)[1]}分</span>
              </div>
            )
          }
        </div>
      </div>
    );
  }

  render() {
    const { whiteBoardConfig } = this.props;
    const { earlySenseCardlist, mounted } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    return (
      <div className={styles.earlySenseWrap}>
        <audio ref={ref => { this.audio = ref; }} autoplay loop>
          <source src={ogg} muted />
          您的浏览器不支持HTML5中的音频播放功能，请升级您的浏览器。
        </audio>
        {!mounted && (
          <div className={styles.loadingStyle}>
            <Spin size="large" tip="正在加载，请稍后..."></Spin>
          </div>
        )}
        {
          earlySenseCardlist.length > 0 ? (
            <Carousel autoplay={true} autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}>
              {
                _.map(earlySenseCardlist, (item) => {
                  return (
                    <div className={styles.cardItemFlex} key={item.bedCode}>
                      {
                        _.map(item, (sub) => {
                          return this.renderCardWrap(sub)
                        })
                      }
                    </div>
                  )
                })
              }
            </Carousel>
          ) : (
            <div>
              <Row type="flex">
                <Col span={24} style={{ textAlign: 'center', padding: 20 }}>
                  <span>暂无数据</span>
                </Col>
              </Row>
            </div>
          )
        }
      </div>
    );
  }
}
