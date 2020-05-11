import themes from '../../theme';

const {
  vendor: {
    react: React,
    dva: { connect },
    antd: { Select, Radio, Spin, Carousel },
    moment,
    lodash: _,
    classnames: classNames,
  },
  layouts: {
    TableLayout,
  },
  utils: {
    request: { getApi },
  },
} = platform;

const { Filters } = TableLayout;
const Option = Select.Option;

const getTaskRemindsVitalType = (wardCode, teamCode, recordDate) => {
  return getApi('/windranger/Mnis/taskReminds/vital/type', {
    wardCode,
    teamCode,
    recordDate,
  });
}

const getTaskRemindsVitalPatient = (wardCode, teamCode, recordDate) => {
  return getApi('/windranger/Mnis/taskReminds/vital/pat', {
    wardCode,
    teamCode,
    recordDate,
  });
}

const getTaskRemindsEvalType = (wardCode, teamCode, currentDate) => {
  return getApi('/windranger/Mnis/taskReminds/eval/type', {
    wardCode,
    teamCode,
    startTime: currentDate,
    endTime: currentDate,
  });
}

const getTaskRemindsEvalPatient = (wardCode, teamCode, currentDate) => {
  return getApi('/windranger/Mnis/taskReminds/eval/pat', {
    wardCode,
    teamCode,
    startTime: currentDate,
    endTime: currentDate,
  });
}

const getOrdersType = (wardCode, teamCode, currentDate) => {
  return getApi('/windranger/mnis/orders/stat/type', {
    wardCode,
    teamCode,
    beginTime: currentDate,
    endTime: currentDate,
  });
}

const getOrdersPatient = (wardCode, teamCode, currentDate) => {
  return getApi('/windranger/mnis/orders/stat/pat', {
    wardCode,
    teamCode,
    beginTime: currentDate,
    endTime: currentDate,
  });
}

const getServerTime = () => {
  return getApi('/sys/server/time');
};

const isLatestTime = (currentTime, compareTime) => {
  if (Math.abs(moment(currentTime).diff(moment(compareTime))) < 2.0 * 3600 * 1000) {
    return true;
  }

  return false;
}

function handleDataByType(data, onePageRow, oneRowBedNum, type) {
  let pages = [];

  while (data.length > 0) {
    let page = { mount: 0, data: [] };
    while (page.mount < onePageRow) {
      const data0 = data[0];
      if (!data0) {
        break;
      }
      createPage(data0, page, type);
    }
    pages.push(page);
  }

  function createPage(data0, page, type) {
    const nursingTypeProps = {
      vitalByType: 'bedCodes',
      vitalByPatient: 'bindItems',
      evalByType: 'bedCodes',
      evalByPatient: 'bindItems',
      orderByType: 'bedExeDetails',
      orderByPatient: 'exeDetails',
    }

    const line = data0[nursingTypeProps[type]].length === 0 ? 1 : Math.ceil(data0[nursingTypeProps[type]].length / oneRowBedNum);
    const otherMount = onePageRow - page.mount;

    if (line <= otherMount) {
      page.data.push(data0);
      page.mount += line;
      data.shift();
    } else {
      const arrA = data0.list.slice(0, otherMount * oneRowBedNum);
      const arrB = data0.list.slice(otherMount * oneRowBedNum);
      const itemA = { ...data0, list: arrA };
      const itemB = { ...data0, list: arrB };
      page.mount = onePageRow;
      page.data.push(itemA);
      data.shift();
      data.unshift(itemB);
    }
  }

  return _.map(pages, 'data');
}

@connect((state) => ({
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentShift: _.get(state, 'whiteboard.currentShift'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
}))
export default class NursingPlan extends React.Component {

  state = {
    mounted: false,
    htmlFontSize: parseInt(window.getComputedStyle(document.getElementsByTagName('html')[0]).fontSize),
    vitalSignType: 'byVitalSign',
    riskType: 'byRisk',
    orderType: 'byOrder',
    timeList: [],
    defaultRecordTime: { key: '' },
    finalTaskRemindsVitalTypeData: [],
    finalTaskRemindsVitalPatientData: [],
    finalTaskRemindsEvalTypeData: [],
    finalTaskRemindsEvalPatientData: [],
    finalOrdersTypeData: [],
    finalOrdersPatientData: [],
  }

  nuringPlanInterval = null;

  componentDidMount() {
    const { dispatch, whiteBoardConfig, currentWardInfo } = this.props;

    if (whiteBoardConfig) {
      dispatch({
        type: 'nursingPlan/getVitalConfig',
        payload: {
          wardCode: _.get(currentWardInfo, 'wardCode')
        }
      }).then(res => {
        const timeList = _.chain(_.get(res, 'config.timesInterval').split(','))
          .map(function (item) {
            const hour = item.length === 1 ? '0' + item : item;
            return {
              label: `${hour}:00`,
              key: hour + ':00:00',
            };
          })
          .value();
        
        this.getNursingPlanData(timeList);
        this.refreshNursingPlanData(_.get(whiteBoardConfig, 'config.basicConfig'), timeList);
      });
    }
  }

  componentWillUnmount = () => {
    if (this.nuringPlanInterval) {
      clearInterval(this.nuringPlanInterval);
      this.nuringPlanInterval = null;
    }
  }

  getNursingPlanData = (timeList, recordTime) => {
    const { htmlFontSize } = this.state;
    const { currentShift, currentWardInfo } = this.props;

    getServerTime().then(response => {
      let currentTimestamp = moment(response).valueOf();
      const date = moment(currentTimestamp).format('YYYY-MM-DD');
      const currentTime = moment(currentTimestamp).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
      let defaultRecordTime = recordTime;

      if (!recordTime) {
        for (let i = 0; i < timeList.length; i++) {
          if (isLatestTime(currentTime, `${date} ${timeList[i].key}`)) {
            defaultRecordTime = timeList[i];
            break;
          }
        }
      }

      const vt = getTaskRemindsVitalType(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'), `${date} ${defaultRecordTime.key}`);
      const vp = getTaskRemindsVitalPatient(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'), `${date} ${defaultRecordTime.key}`);
      const et = getTaskRemindsEvalType(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'), date);
      const ep = getTaskRemindsEvalPatient(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'), date);
      const ot = getOrdersType(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'), date);
      const op = getOrdersPatient(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'teamCode'), date);

      Promise.all([vt, vp, et, ep, ot, op]).then((responses) => {
        const taskRemindsVitalTypeData = responses[0];
        const taskRemindsVitalPatientData = responses[1];
        const taskRemindsEvalTypeData = responses[2];
        const taskRemindsEvalPatientData = responses[3];
        const ordersTypeData = responses[4];
        const ordersPatientData = responses[5];
  
        // 体征
        if (!this.vitalContent) {
          return;
        }
  
        const vitalContentByVitalOnePageRow = Math.floor((_.get(this.vitalContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
        const vitalContentByVitalOneRowBedNum = Math.floor((_.get(this.vitalContent, 'offsetWidth') - (5.5 + 0.5 + 4) * htmlFontSize) / (4.25 * htmlFontSize));
  
        const vitalContentByPatientOnePageRow = Math.floor((_.get(this.vitalContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
        const vitalContentByPatientOneRowBedNum = Math.floor((_.get(this.vitalContent, 'offsetWidth') - (3.75 + 0.5 + 4) * htmlFontSize) / (6 * htmlFontSize));
  
        // 风险
        if (!this.evalContent) {
          return;
        }
  
        const evalContentByRiskOnePageRow = Math.floor((_.get(this.evalContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
        const evalContentByRiskOneRowBedNum = Math.floor((_.get(this.evalContent, 'offsetWidth') - (5.5 + 0.5 + 4) * htmlFontSize) / (4.25 * htmlFontSize));
  
        const evalContentByPatientOnePageRow = Math.floor((_.get(this.vitalContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
        const evalContentByPatientOneRowBedNum = Math.floor((_.get(this.vitalContent, 'offsetWidth') - (3.75 + 0.5 + 4) * htmlFontSize) / (6 * htmlFontSize));
  
        // 医嘱
        if (!this.orderContent) {
          return;
        }
  
        const orderContentByOrderOnePageRow = Math.floor((_.get(this.orderContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
        const orderContentByOrderOneRowBedNum = Math.floor((_.get(this.orderContent, 'offsetWidth') - (7.5 + 0.5 + 4) * htmlFontSize) / (4.25 * htmlFontSize));
  
        const orderContentByPatientOnePageRow = Math.floor((_.get(this.orderContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
        const orderContentByPatientOneRowBedNum = Math.floor((_.get(this.orderContent, 'offsetWidth') - (3.75 + 0.5 + 4) * htmlFontSize) / (8 * htmlFontSize));
  
        this.setState({
          timeList,
          defaultRecordTime,
          mounted: true,
          finalTaskRemindsVitalTypeData: handleDataByType(taskRemindsVitalTypeData, vitalContentByVitalOnePageRow, vitalContentByVitalOneRowBedNum, 'vitalByType'),
          finalTaskRemindsVitalPatientData: handleDataByType(taskRemindsVitalPatientData, vitalContentByPatientOnePageRow, vitalContentByPatientOneRowBedNum, 'vitalByPatient'),
          finalTaskRemindsEvalTypeData: handleDataByType(taskRemindsEvalTypeData, evalContentByRiskOnePageRow, evalContentByRiskOneRowBedNum, 'evalByType'),
          finalTaskRemindsEvalPatientData: handleDataByType(taskRemindsEvalPatientData, evalContentByPatientOnePageRow, evalContentByPatientOneRowBedNum, 'evalByPatient'),
          finalOrdersTypeData: handleDataByType(ordersTypeData, orderContentByOrderOnePageRow, orderContentByOrderOneRowBedNum, 'orderByType'),
          finalOrdersPatientData: handleDataByType(ordersPatientData, orderContentByPatientOnePageRow, orderContentByPatientOneRowBedNum, 'orderByPatient'),
        }); 
      });

    });
  }

  refreshNursingPlanData = (basicConfig, timeList) => {
    if (this.nuringPlanInterval) {
      return;
    }

    this.nuringPlanInterval = setInterval(() => {
      this.getNursingPlanData(timeList);
    }, (_.get(basicConfig, 'refreshInterval')) * 1000);

  }

  handleTimeChange = (value) => {
    this.setState({
      defaultRecordTime: value,
    });

    this.getNursingPlanData(this.state.timeList, value);
  }

  handleVitalSignTypeChange = (e) => {
    this.setState({
      vitalSignType: e.target.value,
    });
  }

  handleRiskTypeChange = (e) => {
    this.setState({
      riskType: e.target.value,
    });
  }

  handleOrderTypeChange = (e) => {
    this.setState({
      orderType: e.target.value,
    });
  }

  renderVitalContent = (vitalSignType) => {
    const { finalTaskRemindsVitalTypeData, finalTaskRemindsVitalPatientData } = this.state;
    const { whiteBoardConfig } = this.props;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    if (vitalSignType === 'byVitalSign') {
      return (
        <div className={styles.vitalSignByTypeWrap}>
          {
            finalTaskRemindsVitalTypeData.length > 0 ? (
              <Carousel
                autoplay={true}
                initialSlide={0}
                touchMove
                autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
              >
                {
                  _.map(finalTaskRemindsVitalTypeData, (item) => {
                    return (
                      <div className={styles.commonHeightDiv}>
                        {
                          _.map(item, (sub) => {
                            return (
                              <div key={sub.bindItemName}>
                                <div className={styles.contentWrap}>
                                  <div className={styles.leftLabel}>
                                    <span>{sub.bindItemName.substring(0, 2)}</span>
                                  </div>
                                  <div className={styles.rightLabel}>
                                    {
                                      _.map(sub.bedCodes, (bed) => {
                                        return (
                                          <span style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[bed.nursingLevel] }}>{bed.bedCode.substring(0, 3)}</span>
                                        )
                                      })
                                    }
                                  </div>
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
            ) : null
          }
        </div>
      )
    }

    return (
      <div className={styles.vitalSignByPatientWrap}>
        {
          finalTaskRemindsVitalPatientData.length > 0 ? (
            <Carousel
              autoplay={true}
              initialSlide={0}
              touchMove
              autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
            >
              {
                _.map(finalTaskRemindsVitalPatientData, (item) => {
                  return (
                    <div className={styles.commonHeightDiv}>
                      {
                        _.map(item, (sub) => {
                          return (
                            <div key={sub.bedCode}>
                              <div className={styles.contentWrap}>
                                <div className={styles.leftLabel}>
                                  <span style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[sub.nursingLevel] }}>{sub.bedCode.substring(0, 3)}</span>
                                </div>
                                <div className={styles.rightLabel}>
                                  {
                                    _.map(sub.bindItems, (value) => {
                                      return (
                                        <span>{value.substring(0, 3)}</span>
                                      )
                                    })
                                  }
                                </div>
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
          ) : null
        }
      </div>
    )
  }

  renderEvalContent = (riskType) => {
    const { finalTaskRemindsEvalTypeData, finalTaskRemindsEvalPatientData } = this.state;
    const { whiteBoardConfig } = this.props;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    if (riskType === 'byRisk') {
      return (
        <div className={styles.evalByTypeWrap}>
          {
            finalTaskRemindsEvalTypeData.length > 0 ? (
              <Carousel
                autoplay={true}
                initialSlide={0}
                touchMove
                autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
              >
                {
                  _.map(finalTaskRemindsEvalTypeData, (item) => {
                    return (
                      <div className={styles.commonHeightDiv}>
                        {
                          _.map(item, (sub) => {
                            return (
                              <div key={sub.bindItemName}>
                                <div className={styles.contentWrap}>
                                  <div className={styles.leftLabel}>
                                    <span>{sub.bindItemName.substring(0, 2)}</span>
                                  </div>
                                  <div className={styles.rightLabel}>
                                    {
                                      _.map(sub.bedCodes, (bed) => {
                                        return (
                                          <span style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[bed.nursingLevel] }}>{bed.bedCode.substring(0, 3)}</span>
                                        )
                                      })
                                    }
                                  </div>
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
            ) : null
          }
        </div>
      )
    }

    return (
      <div className={styles.evalByPatientWrap}>
        {
          finalTaskRemindsEvalPatientData.length > 0 ? (
            <Carousel
              autoplay={true}
              initialSlide={0}
              touchMove
              autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
            >
              {
                _.map(finalTaskRemindsEvalPatientData, (item) => {
                  return (
                    <div className={styles.commonHeightDiv}>
                      {
                        _.map(item, (sub) => {
                          return (
                            <div key={sub.bedCode}>
                              <div className={styles.contentWrap}>
                                <div className={styles.leftLabel}>
                                  <span style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[sub.nursingLevel] }}>{sub.bedCode.substring(0, 3)}</span>
                                </div>
                                <div className={styles.rightLabel}>
                                  {
                                    _.map(sub.bindItems, (value) => {
                                      return (
                                        <span>{value.substring(0, 3)}</span>
                                      )
                                    })
                                  }
                                </div>
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
          ) : null
        }
      </div>
    )
  }

  renderOrderContent = (orderType) => {
    const { finalOrdersTypeData, finalOrdersPatientData } = this.state;
    const { whiteBoardConfig } = this.props;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    if (orderType === 'byOrder') {
      return (
        <div className={styles.orderByTypeWrap}>
          {
            finalOrdersTypeData.length > 0 ? (
              <Carousel
                autoplay={true}
                initialSlide={0}
                touchMove
                autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
              >
                {
                  _.map(finalOrdersTypeData, (item) => {
                    return (
                      <div className={styles.commonHeightDiv}>
                        {
                          _.map(item, (sub) => {
                            return (
                              <div key={sub.execTypeCode}>
                                <div className={styles.contentWrap}>
                                  <div className={styles.leftLabel}>
                                    <span>{(sub.execTypeName).substring(0, 4)}</span>
                                  </div>
                                  <div className={styles.rightLabel}>
                                    {
                                      _.map(sub.bedExeDetails, (bed) => {
                                        return (
                                          <span style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[bed.nursingLevel]}}>{bed.bedCode.substring(0, 3)}</span>
                                        )
                                      })
                                    }
                                  </div>
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
            ) : null
          }
        </div>
      )
    }

    return (
      <div className={styles.orderByPatientWrap}>
        {
          finalOrdersPatientData.length > 0 ? (
            <Carousel
              autoplay={true}
              initialSlide={0}
              touchMove
              autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
            >
              {
                _.map(finalOrdersPatientData, (item) => {
                  return (
                    <div className={styles.commonHeightDiv}>
                      {
                        _.map(item, (sub) => {
                          return (
                            <div key={sub.bedCode}>
                              <div className={styles.contentWrap}>
                                <div className={styles.leftLabel}>
                                  <span style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[sub.nursingLevel] }}>{sub.bedCode.substring(0, 3)}</span>
                                </div>
                                <div className={styles.rightLabel}>
                                  {
                                    _.map(sub.exeDetails, (value) => {
                                      return (
                                        <span>{value.execTypeName.substring(0, 4)}</span>
                                      )
                                    })
                                  }
                                </div>
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
          ) : null
        }
      </div>
    )
  }

  render() {
    const { whiteBoardConfig } = this.props;
    const { vitalSignType, riskType, orderType, defaultRecordTime, timeList, mounted } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    return (
      <div className={styles.nursingPlanWrap}>
        {!mounted && (
          <div className={styles.loadingStyle}>
            <Spin size="large" tip="正在加载，请稍后..."></Spin>
          </div>
        )}
        <div className={styles.leftContent}>
          <div className={styles.header}>
            <div className={styles.leftText}>
              今日待测体征
            </div>
            <div className={styles.rightText}>
              <Select labelInValue size="large" value={{ key: defaultRecordTime.key }} onChange={this.handleTimeChange}>
                {
                  _.map(timeList, item => {
                    return (
                      <Option value={item.key}>{item.label}</Option>
                    )
                  })
                }
              </Select>
            </div>
          </div>
          <div className={styles.subHeader}>
            <Radio.Group value={vitalSignType} onChange={this.handleVitalSignTypeChange}>
              <Radio.Button value="byVitalSign">按体征类型汇总</Radio.Button>
              <span className={styles.line}></span>
              <Radio.Button value="byPatient">按病人排序</Radio.Button>
            </Radio.Group>
          </div>
          <div className={styles.content} ref={ref => (this.vitalContent = ref)}>
            { this.renderVitalContent(vitalSignType) }
          </div>
        </div>
        <div className={styles.centerContent}>
          <div className={styles.header}>
            今日待测风险
          </div>
          <div className={styles.subHeader}>
            <Radio.Group value={riskType} onChange={this.handleRiskTypeChange}>
              <Radio.Button value="byRisk">按风险类型汇总</Radio.Button>
              <span className={styles.line}></span>
              <Radio.Button value="byPatient">按病人排序</Radio.Button>
            </Radio.Group>
          </div>
          <div className={styles.content} ref={ref => (this.evalContent = ref)}>
            {this.renderEvalContent(riskType)}
          </div>
        </div>
        <div className={styles.rightContent}>
          <div className={styles.header}>
            今日待执行医嘱
          </div>
          <div className={styles.subHeader}>
            <Radio.Group value={orderType} onChange={this.handleOrderTypeChange}>
              <Radio.Button value="byOrder">按执行单汇总</Radio.Button>
              <span className={styles.line}></span>
              <Radio.Button value="byPatient">按病人排序</Radio.Button>
            </Radio.Group>
          </div>
          <div className={styles.content} ref={ref => (this.orderContent = ref)}>
            {this.renderOrderContent(orderType)}
          </div>
        </div>
      </div>
    );
  }
}
