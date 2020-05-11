import themes from '../../theme';
import { MEWS_ALERT_LEVEL_DIC } from '../../components/MewsAlert/const.js';
import { ALERT_LEVEL, COLORS } from './const.js';
import PieChart from './PieChart';
import BarChart from './BarChart';

const {
  vendor: {
    react: React,
    dva: { connect },
    antd: { Select, Radio, Spin, Carousel, Row, Col },
    moment,
    lodash: _,
    classnames: classNames,
  },
  components: {
    Charts: { Pie },
  },
  layouts: {
    TableLayout,
  },
  utils: {
    request: { getApi },
  },
} = platform;

const { Filters } = TableLayout;

const getAbnormalEvent = (wardCode, teamCode) => {
  return getApi('/windranger/mnis/abnormalEvent/vitals', {
    wardCode,
    // teamCode,
  });
}

const getAlertLevel = (wardCode, teamCode) => {
  return getApi('/windranger/mews/stat/alertLevel', {
    wardCode,
    // teamCode,
  });
}

const getMewsPatientCount = (wardCode, teamCode) => {
  return getApi('/windranger/mews/count/patient', {
    wardCode,
    // teamCode,
  });
}

const getMewsPatientStatics = (wardCode, teamCode, beginTime, endTime) => {
  return getApi('/windranger/mews/stat/patient', {
    wardCode,
    // teamCode,
    beginTime,
    endTime,
  });
}

const getServerTime = () => {
  return getApi('/sys/server/time');
};

const handleData = (data) => {
  let finalData = [];

  finalData = _.chain(data)
               .map(item => {
                 return {
                   ...item,
                   transferVitalSigns: _.chunk(item.vitalSigns, 6),
                 };
               })
               .value();

  return finalData;
}

function handleDangerTypeData(data, onePageRow, oneRowBedNum) {
  if (data && _.get(data, 'bedCodes')) {
    return _.chunk(_.get(data, 'bedCodes'), onePageRow * oneRowBedNum);
  }

  return [];
}

function getDateFields(currentTimestamp) {
  let dateFields = [moment(currentTimestamp).format('DD/MM')]
  for (let i = 1; i < 7; i++) {
    dateFields.unshift(moment(currentTimestamp).subtract(i, 'days').format('DD/MM'));
  }
  return dateFields
}

@connect((state) => ({
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentShift: _.get(state, 'whiteboard.currentShift'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
}))
export default class VitalSignEvent extends React.Component {

  state = {
    mounted: false,
    htmlFontSize: parseInt(window.getComputedStyle(document.getElementsByTagName('html')[0]).fontSize),
    finalAbnormalEventData: [],
    finalHighDangerData: [],
    finalMediumDangerData: [],
    finalLowDangerData: [],
    finalPieData: [],
    finalBarData: [],
    dateFields: [],
    pieColors: [],
    barColors: [],
  }

  vitalSignEventInterval = null;

  componentDidMount() {
    const { whiteBoardConfig } = this.props;

    if (whiteBoardConfig) {
      this.getVitalSignEventData();
      this.refreshVitalSignEventData(_.get(whiteBoardConfig, 'config.basicConfig'));
    }
  }

  componentWillUnmount = () => {
    if (this.vitalSignEventInterval) {
      clearInterval(this.vitalSignEventInterval);
      this.vitalSignEventInterval = null;
    }
  }

  getVitalSignEventData = () => {
    const { htmlFontSize } = this.state;
    const { currentShift, currentWardInfo } = this.props;

    getServerTime().then(response => {
      let currentTimestamp = moment(response).valueOf();
  
      const ae = getAbnormalEvent(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'));
      const al = getAlertLevel(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'));
      const mpc = getMewsPatientCount(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'));
      const mps = getMewsPatientStatics(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'), moment(currentTimestamp).subtract(6, 'days').format('YYYY-MM-DD'), moment(currentTimestamp).format('YYYY-MM-DD'));
  
      Promise.all([ae, al, mpc, mps]).then((responses) => {
        const abnormalEventData = responses[0];
        const alertLevelData = responses[1];
        const mewsPatientCountData = responses[2];
        const mewsPatientStaticsData = responses[3];
  
        // 高危
        if (!this.highDangerContent) {
          return;
        }
  
        const highDangerOnePageRow = Math.floor((_.get(this.highDangerContent, 'offsetHeight')) / (3.8125 * htmlFontSize));
        const highDangerOneRowBedNum = Math.floor((_.get(this.highDangerContent, 'offsetWidth') - 2 * htmlFontSize) / (4.25 * htmlFontSize));
  
        // 中危
        if (!this.mediumDangerContent) {
          return;
        }
  
        const mediumDangerOnePageRow = Math.floor((_.get(this.mediumDangerContent, 'offsetHeight')) / (3.8125 * htmlFontSize));
        const mediumDangerOneRowBedNum = Math.floor((_.get(this.mediumDangerContent, 'offsetWidth') - 2 * htmlFontSize) / (4.25 * htmlFontSize));
  
        // 低危
        if (!this.lowDangerContent) {
          return;
        }
  
        const lowDangeOnePageRow = Math.floor((_.get(this.lowDangerContent, 'offsetHeight')) / (3.8125 * htmlFontSize));
        const lowDangeOneRowBedNum = Math.floor((_.get(this.lowDangerContent, 'offsetWidth') - 2 * htmlFontSize) / (4.25 * htmlFontSize));

        // 饼图数据
        const finalPieData = _.chain(mewsPatientCountData)
                              .map(item => {
                                return {
                                  item: ALERT_LEVEL[item.alertLevel].text,
                                  count: item.count,
                                }
                              })
                              .value();
        const pieColors = _.chain(mewsPatientCountData)
                           .map(item => ALERT_LEVEL[item.alertLevel].color)
                           .value();
                           
        // 柱状图数据                     
        const finalBarData = _.chain(mewsPatientStaticsData)
                              .map(item => {

                                _.forEach(item.countDeatils, (value, key) => {
                                  item.countDeatils[moment(key).format('DD/MM')] = value;
                                  delete item.countDeatils[key];
                                });

                                return {
                                  ...item.countDeatils,
                                  name: ALERT_LEVEL[item.alertLevel].text,
                                }
                              })
                              .value();
        const barColors = _.chain(mewsPatientStaticsData)
                           .map(item => ALERT_LEVEL[item.alertLevel].color)
                           .value();
        const dateFields = getDateFields(currentTimestamp);
  
        this.setState({
          mounted: true,
          finalAbnormalEventData: handleData(abnormalEventData),
          finalHighDangerData: handleDangerTypeData(_.find(alertLevelData, item => item.alertLevel === 3), highDangerOnePageRow, highDangerOneRowBedNum),
          finalMediumDangerData: handleDangerTypeData(_.find(alertLevelData, item => item.alertLevel === 2), mediumDangerOnePageRow, mediumDangerOneRowBedNum),
          finalLowDangerData: handleDangerTypeData(_.find(alertLevelData, item => item.alertLevel === 1), lowDangeOnePageRow, lowDangeOneRowBedNum),
          finalPieData,
          finalBarData,
          dateFields,
          pieColors,
          barColors,
        });
      });
      
    });
  }

  refreshVitalSignEventData = (basicConfig) => {
    if (this.vitalSignEventInterval) {
      return;
    }

    this.vitalSignEventInterval = setInterval(() => {
      this.getVitalSignEventData();
    }, (_.get(basicConfig, 'refreshInterval')) * 1000);
  }

  renderVitalAbnormal = () => {
    const { whiteBoardConfig } = this.props;
    const { finalAbnormalEventData } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    return (
      <div className={styles.vitalAbnormalContent}>
        {
          finalAbnormalEventData.length > 0 ? (
            _.map(finalAbnormalEventData, item => {
              return (
                <div className={styles.vitalEvent} style={{ width: `calc(100% / ${finalAbnormalEventData.length})` }}>
                  <div className={styles.header}>
                    <div className={styles.leftText}>
                      <img src={require(`./icons/${item.event}.svg`)} />
                      <span>{item.eventName}</span>
                    </div>
                    <div className={styles.rightText}>
                      <span>单位: {item.units}</span>
                    </div>
                  </div>
                  <div className={styles.content}>
                    {
                      item.vitalSigns.length > 0 && (
                        <Carousel
                          autoplay={true}
                          initialSlide={0}
                          touchMove
                          autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
                        >
                          {
                            _.map(_.get(item, 'transferVitalSigns'), vital => {
                              return (
                                <div className={classNames(styles.commonHeightDiv, styles.pageStyle)}>
                                  {
                                    _.map(vital, (sub) => {
                                      return (
                                        <div className={styles.lineStyle} key={sub.inhosCode}>
                                          <div className={styles.leftShow}>
                                            <span style={{ minWidth: '3.5rem'}}>{sub.bedCode}床</span>
                                            <span style={{ minWidth: '5.5rem', textAlign: 'left' }}>{sub.patName}</span>
                                            <span style={{ minWidth: '2rem' }}>{sub.vitalSignsValues}</span>
                                          </div>
                                          <div className={styles.rightShow}>
                                            <span>{moment(sub.recordDate).format('HH:mm')}</span>
                                            <span>{moment(sub.recordDate).format('YYYY-MM-DD')}</span>
                                          </div>
                                        </div>
                                      )
                                    })
                                  }
                                </div>
                              )
                            })
                          }
                        </Carousel>
                      )
                    }
                  </div>
                </div>
              )
            })
          ) : null
        }
      </div>
    );
  }

  renderDangerContent = (data) => {
    const { whiteBoardConfig } = this.props;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    return(
      <div>
        {
          data.length > 0 ? (
            <Carousel autoplay={true} autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}>
              {
                _.map(data, (item) => {
                  return (
                    <div className={classNames(styles.commonHeightDiv, styles.pageStyle)}>
                      {
                        _.map(item, (bed) => {
                          return (
                            <span style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[bed.nursingLevel] }}>{bed.bedCode.substring(0, 3)}</span>
                          )
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
    )
  }

  render() {
    const { whiteBoardConfig } = this.props;
    const { htmlFontSize, dateFields, pieColors, barColors, mounted, finalHighDangerData, finalMediumDangerData, finalLowDangerData, finalPieData, finalBarData } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    return (
      <div className={styles.vitalSignEventWrap}>
        {!mounted && (
          <div className={styles.loadingStyle}>
            <Spin size="large" tip="正在加载，请稍后..."></Spin>
          </div>
        )}

        <div className={styles.vitalAbnormal}>
          <div className={styles.trapezoidalPage}>
            <span className={styles.vitalAbnormalText}>体征异常</span>
          </div>
          {this.renderVitalAbnormal()}
        </div>
        <div className={styles.earlyWarningRisk}>
          <div className={styles.trapezoidalPage}>
            <span className={styles.earlyWarningRiskText}>早期风险预警</span>
          </div>
          <div className={styles.earlyWarningRiskContent}>
            <div className={styles.dangerTypeItem}>
              <div className={styles.riskItem} style={{ width: 'calc(100% / 3)' }}>
                <div className={styles.riskItemHeader}>
                  <span className={styles.dangerTypeRound} style={{ backgroundColor: MEWS_ALERT_LEVEL_DIC[3].color }}></span>
                  <span>{MEWS_ALERT_LEVEL_DIC[3].text}</span>
                </div>
                <div className={styles.riskItemHeaderContent} ref={ref => (this.highDangerContent = ref)}>
                  {this.renderDangerContent(finalHighDangerData)}
                </div>
              </div>
              <div className={styles.riskItem} style={{ width: 'calc(100% / 3)' }}>
                <div className={styles.riskItemHeader}>
                  <span className={styles.dangerTypeRound} style={{ backgroundColor: MEWS_ALERT_LEVEL_DIC[2].color }}></span>
                  <span>{MEWS_ALERT_LEVEL_DIC[2].text}</span>
                </div>
                <div className={styles.riskItemHeaderContent} ref={ref => (this.mediumDangerContent = ref)}>
                  {this.renderDangerContent(finalMediumDangerData)}
                </div>
              </div>
              <div className={styles.riskItem} style={{ width: 'calc(100% / 3)' }}>
                <div className={styles.riskItemHeader}>
                  <span className={styles.dangerTypeRound} style={{ backgroundColor: MEWS_ALERT_LEVEL_DIC[1].color }}></span>
                  <span>{MEWS_ALERT_LEVEL_DIC[1].text}</span>
                </div>
                <div className={styles.riskItemHeaderContent} ref={ref => (this.lowDangerContent = ref)}>
                  {this.renderDangerContent(finalLowDangerData)}
                </div>
              </div>
            </div>
            <div className={styles.chartItem}>
              <div className={styles.mewsItem} style={{ width: 'calc(100% / 2)' }}>
                <div className={styles.mewsItemHeader}>
                  <span>MEWS风险比例</span>
                </div>
                <div className={styles.mewsItemHeaderContent}>
                  <PieChart
                    data={finalPieData}
                    colors={pieColors}
                    height={18.3 * htmlFontSize}
                  />
                </div>
              </div>
              <div className={styles.mewsItem} style={{ width: 'calc(100% / 2)' }}>
                <div className={styles.mewsItemHeader}>
                  <span>风险预警变化趋势</span>
                </div>
                <div className={styles.mewsItemHeaderContent}>
                  <BarChart
                    data={finalBarData}
                    colors={barColors}
                    fields={dateFields}
                    height={18.3 * htmlFontSize}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
