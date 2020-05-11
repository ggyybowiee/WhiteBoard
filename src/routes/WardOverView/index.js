import themes from '../../theme';

const {
  vendor: {
    react: React,
    dva: { connect },
    qs,
    lodash: _,
    antd: { Button, Table, Input, Carousel, Modal, Spin, notification },
    classnames: classNames,
  },
  layouts: {
    TableLayout,
  },
  utils: {
    createSimpleRestModel: {
      createSimpleRestActions,
    },
    request: { getApi, putApi, postApi },
  },
} = platform;

const getWardDynamicInfo = (wardCode) => {
  return getApi('/emr/wardInfo', {
    wardCode,
    startTime: moment().format('YYYY-MM-DD'),
    endTime: moment().format('YYYY-MM-DD'),
  });
};

const getSpecialInspection = (wardCode) => {
  return getApi('/emr/specialInspection', {
    wardCode,
    startTime: moment().format('YYYY-MM-DD'),
    endTime: moment().format('YYYY-MM-DD'),
  });
}

const getNursingInfo = (wardCode) => {
  return getApi('/emr/nursingInfo', {
    wardCode,
    startTime: moment().format('YYYY-MM-DD'),
    endTime: moment().format('YYYY-MM-DD'),
  });
}

const getCurrentShifts = (wardCode, shiftName) => {
  return getApi('/hospital/hosUserShift', {
    wardCode,
    shiftName
  });
}

const getWardSchedule = (wardCode) => {
  return getApi('/emr/wardSchedule', {
    wardCode,
  });
}

const getWardNote = (wardCode) => {
  return getApi('/emr/wardNote', {
    wardCode,
  });
}

const getEarlyWarning = (wardCode) => {
  return getApi('/emr/earlyWarning', {
    wardCode,
  });
}

function strLen(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);

    //单字节加1   
    if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
      len++;
    } else {
      len += 2;
    }
  }

  return len;  
}

function dataTransfer(data, onePageRow, oneRowBedNum, dataType) {
  let pages = [];

  while (data.length > 0) {
    let page = { mount: 0, data: [] };
    while (page.mount < onePageRow) {
      const data0 = data[0];
      if (!data0) {
        break;
      }

      if (dataType === 'earlyWarning') {
        createPageByEarlyWarning(data0, page);        
      } else {
        createPage(data0, page);
      }
    }
    pages.push(page);
  }

  function createPage(data0, page) {
    const line = data0.total === 0 ? 1 : Math.ceil(data0.list.length / oneRowBedNum);
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

  function createPageByEarlyWarning(data0, page) {
    const line = Math.ceil(data0.list.length / oneRowBedNum) + 1;
    const otherMount = onePageRow - page.mount - 1;

    if (line < otherMount) {
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

      if (arrB.length > 0) {
        data.unshift(itemB);
      }
    }
  }

  return _.map(pages, 'data');
}

function handleDisplayInfoMap(displayInfoMap, onePageRow, oneRowBedNum, wardOverviewConfig, dataType) {
  let wardInfos = [];
  let earlyWarningEvent = ["输液即将完成", "输液滴速异常", "输液暂停", "需要立即翻身"];
  const configEvent = _.chain(wardOverviewConfig[dataType])
    .sortBy(['orderIndex'])
    .map(item => {
      return item.itemName;
    })
    .value();

  if (_.isArray(displayInfoMap) && displayInfoMap.length === 0) {
    return [];
  }

  wardInfos = _.chain(displayInfoMap)
    .toPairs()
    .filter(([key, value]) => {
      return _.includes(dataType === 'earlyWarning' ? earlyWarningEvent : configEvent, key);
    })
    .map(([key, value]) => {
      return {
        grand: key,
        total: value.length,
        list: value,
        orderIndex: _.indexOf((dataType === 'earlyWarning' ? earlyWarningEvent : configEvent), key),
      };
    })
    .sortBy(['orderIndex'])
    .value();

  return dataTransfer(wardInfos, onePageRow, oneRowBedNum, dataType);;
}

@connect((state) => ({
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentShift: _.get(state, 'whiteboard.currentShift'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
}))
export default class wardOverView extends React.Component {

  state = {
    editable: false,
    turnVisible: false,
    modalData: null,
    mounted: false,
    totalInhosNum: 0,
    finalWardInfoData: [],
    finalSpecialInspectionData: [],
    finalNursingInfoData: [],
    finalEarlyWarningData: [],
    note: '',
    handOverStr: '',
    nurseDataSource: [],
    doctorDataSource: [],
    htmlFontSize: parseInt(window.getComputedStyle(document.getElementsByTagName('html')[0]).fontSize),
  }

  wardOverViewInterval = null;

  componentDidMount() {

    const { location: { search } } = this.props;

    const query = qs.parse(search, { ignoreQueryPrefix: true });

    this.setState({
      editable: _.get(query, 'editable'),
    });

    if (this.props.whiteBoardConfig) {
      this.getWardOverView();

      if (!_.get(query, 'editable')) {
        this.refreshWardOverView(_.get(this.props.whiteBoardConfig, 'config.basicConfig'));
      }

      let timer = null;

      platform.event.subscribe('earlyWarning', (value) => {
        if (!value) {
          return
        }
        
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }

        timer = setTimeout(() => {
          this.refreshEarlyWarningData();
        }, 2000);
      });
    }
  }

  componentWillUnmount = () => {
    this.clearWardOverViewInterval();
  }

  clearWardOverViewInterval = () => {
    if (this.wardOverViewInterval) {
      clearInterval(this.wardOverViewInterval);
      this.wardOverViewInterval = null;
    }
  }

  getWardOverView = () => {
    const { htmlFontSize } = this.state;
    const { currentShift, currentWardInfo, whiteBoardConfig } = this.props;

    const wdi = getWardDynamicInfo(_.get(currentWardInfo, 'wardCode'));
    const si = getSpecialInspection(_.get(currentWardInfo, 'wardCode'));
    const ni = getNursingInfo(_.get(currentWardInfo, 'wardCode'));
    const cs = getCurrentShifts(_.get(currentWardInfo, 'wardCode'), _.get(currentShift, 'shiftName'));
    const ws = getWardSchedule(_.get(currentWardInfo, 'wardCode'));
    const wn = getWardNote(_.get(currentWardInfo, 'wardCode'));
    const ew = getEarlyWarning(_.get(currentWardInfo, 'wardCode'));
    
    Promise.all([wdi, si, ni, cs, ws, wn, ew]).then((responses) => {
      const wardDynamicInfoData = responses[0];
      const specialInspectionData = responses[1];
      const nursingInfoData = responses[2];
      const currentShiftsData = responses[3];
      const wardScheduleData = responses[4];
      const wardNoteData = responses[5];
      const earlyWarningData = responses[6];

      // 病区动态
      if (!this.wardInfoContent) {
        return;
      }
      const wardDynamicInfoOnePageRow = Math.floor((_.get(this.wardInfoContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
      const wardDynamicInfoOneRowBedNum = Math.floor((_.get(this.wardInfoContent, 'offsetWidth') - (10.1875 + 0.5 + 4) * htmlFontSize) / (4.25 * htmlFontSize));

      // 特殊检查
      if (!this.specialInspectionContent) {
        return;
      }
      const specialInspectionOnePageRow = Math.floor((_.get(this.specialInspectionContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
      const specialInspectionOneRowBedNum = Math.floor(((0.31 * window.innerWidth) - (10.1875 + 0.5 + 4) * htmlFontSize) / (4.25 * htmlFontSize));

      // 护理内容
      if (!this.nursingInfoContent) {
        return;
      }
      const nursingInfoOnePageRow = Math.floor((_.get(this.nursingInfoContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.8125 * htmlFontSize));
      const nursingInfoOneRowBedNum = Math.floor(((0.31 * window.innerWidth) - (10.1875 + 0.5 + 4) * htmlFontSize) / (4.25 * htmlFontSize));

      // 预警事件
      if (!this.nursingInfoContent) {
        return;
      }

      const earlyWarningOnePageRow = Math.floor((_.get(this.nursingInfoContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.3125 * htmlFontSize));
      const earlyWarningOneRowBedNum = Math.floor(((0.31 * window.innerWidth) - (0.5 + 4 + 2.4) * htmlFontSize) / (4.25 * htmlFontSize));

      // 排班信息
      const nurseDataSource = _.map(_.get(currentShiftsData, 'queryResult'), (item) => {
        return _.assign(item, {
          nurseName: _.get(_.find(_.get(wardScheduleData, 'nurseScheduleList'), sub => {
            return sub.teamCode === item.teamCode;
          }), 'nurseName') || '',
        });
      });

      const doctorDataSource = [
        {
          shift: '一线',
          doctor: _.get(wardScheduleData, 'firstOnCallDocName'),
        },
        {
          shift: '二线',
          doctor: _.get(wardScheduleData, 'secondOnCallDocName'),
        },
        {
          shift: '三线',
          doctor: _.get(wardScheduleData, 'thirdOnCallDocName'),
        },
      ];

      // 重要通知
      const handOverStr = _.get(wardNoteData, 'note');
      
      this.setState({
        totalInhosNum: _.get(wardDynamicInfoData, 'totalInhosNum'),
        finalWardInfoData: handleDisplayInfoMap(_.get(wardDynamicInfoData, 'displayInfoMap') || [], wardDynamicInfoOnePageRow, wardDynamicInfoOneRowBedNum, _.get(whiteBoardConfig, 'config.wardOverviewConfig'), 'wardInfosToShow'),
        finalSpecialInspectionData: handleDisplayInfoMap(_.get(specialInspectionData, 'displayInfoMap') || [], specialInspectionOnePageRow, specialInspectionOneRowBedNum, _.get(whiteBoardConfig, 'config.wardOverviewConfig'), 'specialInspectionsToShow'),
        finalNursingInfoData: handleDisplayInfoMap(_.get(nursingInfoData, 'displayInfoMap') || [], nursingInfoOnePageRow, nursingInfoOneRowBedNum, _.get(whiteBoardConfig, 'config.wardOverviewConfig'), 'nursingContentsToShow'),
        finalEarlyWarningData: handleDisplayInfoMap(_.get(earlyWarningData, 'displayInfoMap') || [], earlyWarningOnePageRow, earlyWarningOneRowBedNum, _.get(whiteBoardConfig, 'config.wardOverviewConfig'), 'earlyWarning'),
        nurseDataSource,
        doctorDataSource,
        note: (handOverStr && handOverStr.indexOf("\n") > -1) ? handOverStr.split("\n") : [handOverStr],
        handOverStr,
        mounted: true,
      });

    });
  }

  refreshEarlyWarningData = () => {
    const { htmlFontSize } = this.state;
    const { currentWardInfo, whiteBoardConfig } = this.props;

    getEarlyWarning(_.get(currentWardInfo, 'wardCode')).then(res => {
      // 预警事件
      if (!this.nursingInfoContent) {
        return;
      }

      const earlyWarningOnePageRow = Math.floor((_.get(this.nursingInfoContent, 'offsetHeight') - 1.5 * htmlFontSize) / (3.3125 * htmlFontSize));
      const earlyWarningOneRowBedNum = Math.floor(((0.31 * window.innerWidth) - (0.5 + 4 + 2.4) * htmlFontSize) / (4.25 * htmlFontSize));

      this.setState({
        finalEarlyWarningData: handleDisplayInfoMap(_.get(res, 'displayInfoMap') || [], earlyWarningOnePageRow, earlyWarningOneRowBedNum, _.get(whiteBoardConfig, 'config.wardOverviewConfig'), 'earlyWarning'),
      });
    });
  }

  refreshWardOverView = (basicConfig) => {

    if (this.wardOverViewInterval) {
      return;
    }

    this.wardOverViewInterval = setInterval(() => {
      this.getWardOverView();
    }, (_.get(basicConfig, 'refreshInterval')) * 1000);

  }

  textareaChange = (e) => {
    this.setState({
      note: e.target.value,
      handOverStr: e.target.value,
    });
  }

  saveWardNode = () => {
    const { currentWardInfo, dispatch } = this.props;
    const { note } = this.state;
      
    let noteStr = note;
    if (_.isArray(note)) {
      noteStr = note.join('\n');
    }
    
    dispatch({
      type: 'wardOverView/setWardNote',
      payload: {
        wardCode: _.get(currentWardInfo, 'wardCode'),
        note: noteStr,
      }
    }).then(() => {
      notification.success({
        message: '保存成功',
        description: '',
      });
    });
  }

  saveWardSchedule = () => {
    const { nurseDataSource, doctorDataSource } = this.state;
    const { currentWardInfo, dispatch } = this.props;

    const WardSchedule = {
      wardCode: _.get(currentWardInfo, 'wardCode'),
      firstOnCallDocName: _.get(_.find(doctorDataSource, item => item.shift === '一线'), 'doctor') || '',
      secondOnCallDocName: _.get(_.find(doctorDataSource, item => item.shift === '二线'), 'doctor') || '',
      thirdOnCallDocName: _.get(_.find(doctorDataSource, item => item.shift === '三线'), 'doctor') || '',
      nurseScheduleList: _.map(nurseDataSource, item => {
        return {
          nurseName: item.nurseName,
          teamCode: item.teamCode
        }
      }),
    }

    dispatch({
      type: 'wardOverView/setWardSchedule',
      payload: WardSchedule,
    }).then(() => {
      notification.success({
        message: '保存成功',
        description: '',
      });
    });

  }

  doctorInputChange = (record, e) => {
    const { doctorDataSource } = this.state;

    const tempDocDataSource = _.map(doctorDataSource, (item) => {
      if (item.shift === record.shift) {
        return _.assign(item, {
          doctor: e.target.value,
        });
      }
      return item;
    });

    this.setState({
      doctorDataSource: tempDocDataSource,
    });
  }

  nurseInputChange = (record, e) => {
    const { nurseDataSource } = this.state;

    const tempNurseDataSource = _.map(nurseDataSource, (item) => {
      if (item.teamCode === record.teamCode) {
        return _.assign(item, {
          nurseName: e.target.value,
        });
      }
      return item;
    });

    this.setState({
      nurseDataSource: tempNurseDataSource,
    });
  }

  turn = (item) => {
    this.setState({
      turnVisible: true,
      modalData: item,
    });
  }

  handleCancel = () => {
    this.setState({
      turnVisible: false,
    });
  }

  handleOk = () => {
    const { dispatch } = this.props;
    const { modalData } = this.state;

    dispatch({
      type: 'alarmEvent/getTurn',
      payload: {
        mac: _.get(modalData, 'mac'),
      }
    }).then(() => {
      this.getWardOverView();
    });

    this.setState({
      turnVisible: false,
    });
  }

  renderWardNote = () => {
    const { whiteBoardConfig } = this.props;
    const { note, handOverStr, editable } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    return (
      <div className={styles.topPart}>
        <div className={styles.commonHeader}>
          <span className={styles.lineLeft}></span>
          <span className={styles.title}>
            <span className={styles.leftDot}></span>重要通知<span className={styles.rightDot}></span>
          </span>
          <span className={styles.lineRight}></span>
          {
            editable ? (<Button className={styles.canEditBtn} onClick={this.saveWardNode}>保存</Button>) : null
          }
        </div>
        <div className={styles.content}>
          {!editable ? (
            <div className={styles.divStyle}>
              {
                _.map(note, (item) => {
                  return (<div className={styles.text} key={item}>{item}</div>)
                })
              }
            </div>) : (
              <div className={styles.textareaStyle}>
                <textarea onChange={this.textareaChange} value={handOverStr}></textarea>
              </div>
            )}
        </div>
      </div>
    )
  }

  render() {
    const { whiteBoardConfig } = this.props;
    const { editable, finalWardInfoData, totalInhosNum, finalSpecialInspectionData, finalNursingInfoData, doctorDataSource, nurseDataSource, mounted, finalEarlyWarningData, turnVisible, modalData } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');
    const nurseColumns = [
      {
        key: 'teamName',
        title: '班组',
        dataIndex: 'teamName',
        align: 'center',
        width: '10%',
        render: (text, record) => (
          <span>
            {text}
          </span>
        ),
      },
      {
        key: 'bedRange',
        title: '床位',
        dataIndex: 'bedRange',
        align: 'center',
        width: '22%',
        render: (text, record) => (
          <span>
            {text}
          </span>
        ),
      },
      {
        key: 'nurseName',
        title: '责护',
        dataIndex: 'nurseName',
        align: 'center',
        width: '18%',
        render: (text, record) => (
          <span>
            {editable ? (
              <Input size="small" placeholder={text} onChange={(e) => { this.nurseInputChange(record, e); }} defaultValue={text}/>
            ) : (text)}
          </span>
        ),
      },
    ]

    const doctorColumns = [
      {
        key: 'shift',
        title: '值班',
        dataIndex: 'shift',
        align: 'center',
        width: '10%',
        render: (text, record) => (
          <span>
            {text}
          </span>
        ),
      },
      {
        key: 'doctor',
        title: '医生',
        dataIndex: 'doctor',
        align: 'center',
        width: '20%',
        render: (text, record) => (
          <span>
            {editable ? (
              <Input size="small" placeholder={text} onChange={(e) => { this.doctorInputChange(record, e); }} defaultValue={text}/>
            ) : text}
          </span>
        ),
      },
    ]

    return (
      <div className={styles.wardOverViewWrap}>
        {!mounted && (
          <div className={styles.loadingStyle}>
            <Spin size="large" tip="正在加载，请稍后..."></Spin>
          </div>
        )}
        <div className={styles.leftContent}>
          <div className={styles.header}>
            <div className={styles.leftText}>
              病区动态
            </div>
            <div className={styles.rightText}>
              <span>住院总数</span>
              <span>{totalInhosNum}</span>
            </div>
          </div>
          <div className={styles.content} ref={ref => (this.wardInfoContent = ref)}>
            {
              finalWardInfoData.length > 0 ? (
                <Carousel 
                  autoplay={true}
                  initialSlide={0}
                  touchMove
                  autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
                >
                  {
                    _.map(finalWardInfoData, (item) => {
                      return (
                        <div className={styles.commonHeightDiv}>
                          {
                            _.map(item, (sub) => {
                              return (
                                <div key={sub.grand}>
                                  <div className={styles.contentWrap}>
                                    <div className={styles.leftLabel}>
                                      <span style={{ letterSpacing: strLen(sub.grand) > 8 ? '-5px' : '0' }}>{sub.grand}</span>
                                      <span>{sub.total}</span>
                                    </div>
                                    <div className={styles.rightLabel}>
                                      {
                                        _.map(sub.list, (bed) => {
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
        </div>
        <div className={styles.centerContent}>
          <div className={styles.topPart}>
            <div className={styles.header}>
              护理内容
            </div>
            <div className={styles.content} ref={ref => (this.nursingInfoContent = ref)}>
              {
                finalNursingInfoData.length > 0 ? (
                  <Carousel 
                    autoplay={true} 
                    initialSlide={0}
                    touchMove
                    autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
                  >
                    {
                      _.map(finalNursingInfoData, (item) => {
                        return (
                          <div className={styles.commonHeightDiv}>
                            {
                              _.map(item, (sub) => {
                                return (
                                  <div style={{ height: '100%' }} key={sub.grand}>
                                    <div className={styles.contentWrap}>
                                      <div className={styles.leftLabel}>
                                        <span style={{ letterSpacing: strLen(sub.grand) > 8 ? '-5px' : '0' }}>{sub.grand}</span>
                                        <span>{sub.total}</span>
                                      </div>
                                      <div className={styles.rightLabel}>
                                        {
                                          _.map(sub.list, (bed) => {
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
          </div>
          <div className={styles.bottomPart}>
            <div className={styles.header}>
              特殊检查
            </div>
            <div className={styles.content} ref={ref => (this.specialInspectionContent = ref)}>
             {
                finalSpecialInspectionData.length > 0 ? (
                  <Carousel 
                    autoplay={true} 
                    initialSlide={0}
                    touchMove
                    autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
                  >
                    {
                      _.map(finalSpecialInspectionData, (item) => {
                        return (
                          <div className={styles.commonHeightDiv}>
                            {
                              _.map(item, (sub) => {
                                return (
                                  <div key={sub.grand}>
                                    <div className={styles.contentWrap}>
                                      <div className={styles.leftLabel}>
                                        <span style={{ letterSpacing: strLen(sub.grand) > 8 ? '-5px' : '0' }}>{sub.grand}</span>
                                        <span>{sub.total}</span>
                                      </div>
                                      <div className={styles.rightLabel}>
                                        {
                                          _.map(sub.list, (bed) => {
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
                ):null
             }
            </div>
          </div>
        </div>
        <div className={styles.rightContent}>
          <div className={classNames(styles.earlyWarning, {
            [styles.noEarlyWarning]: finalEarlyWarningData.length === 0,
          })}>
            <div className={classNames(styles.commonHeader, {
              [styles.header]: finalEarlyWarningData.length === 0,
            })}>
              <span className={styles.lineLeft}></span>
              <span className={styles.title}>
                <span className={styles.leftDot}></span>预警事件<span className={styles.rightDot}></span>
              </span>
              <span className={styles.lineRight}></span>
            </div>
            <div className={styles.content}>
            {
              finalEarlyWarningData.length > 0 ? (
                <Carousel
                  autoplay={true}
                  initialSlide={0}
                  touchMove
                  autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
                >
                  {
                    _.map(finalEarlyWarningData, (item) => {
                      return (
                        <div className={styles.commonHeightDiv}>
                          {
                            _.map(item, (sub) => {
                              return (
                                <div key={sub.grand}>
                                  <div className={classNames(styles.itemTitle, {
                                    [styles.infusionFinishing]: sub.grand === '输液即将完成',
                                    [styles.infusionSpeedException]: sub.grand === '输液滴速异常',
                                    [styles.infusionPause]: sub.grand === '输液暂停',
                                    [styles.needTurn]: sub.grand === '需要立即翻身',
                                  })}>
                                    {sub.grand}
                                  </div>
                                  <div className={styles.showItem}>
                                    {
                                      _.map(sub.list, (bed) => {
                                        if (sub.grand === '需要立即翻身') {
                                          return (
                                            <span onClick={() => this.turn(bed)} style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[bed.nursingLevel] }}>{bed.bedCode.substring(0, 3)}</span>
                                          )
                                        }
                                        return (
                                          <span style={{ backgroundColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[bed.nursingLevel] }}>{bed.bedCode.substring(0, 3)}</span>
                                        )
                                      })
                                    }
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
              ):null
            }
            </div>
          </div>
          {
            finalEarlyWarningData.length === 0 && this.renderWardNote()
          }
          
          <div className={styles.bottomPart}>
            <Carousel
              autoplay={true}
              initialSlide={0}
              touchMove
              autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}
            >
              <div>
                <div className={styles.commonHeader}>
                  <span className={styles.lineLeft}></span>
                  <span className={styles.title}>
                    <span className={styles.leftDot}></span>今日排班<span className={styles.rightDot}></span>
                  </span>
                  <span className={styles.lineRight}></span>
                  {
                    editable ? (<Button className={styles.canEditBtn} onClick={this.saveWardSchedule}>保存</Button>) : null
                  }
                </div>
                <div className={styles.content}>
                  <div className={styles.tabWrap}>
                    <Table
                      bordered
                      dataSource={nurseDataSource}
                      columns={nurseColumns}
                      size="small"
                      pagination={false}
                      className={styles.leftTableStyle}
                    />

                    <Table
                      bordered
                      dataSource={doctorDataSource}
                      columns={doctorColumns}
                      size="small"
                      pagination={false}
                      className={styles.rightTableStyle}
                    />
                  </div>
                </div>
              </div>
              {
                finalEarlyWarningData.length !== 0 && this.renderWardNote()
              }
            </Carousel>
            
          </div>
        </div>

        <Modal
          visible={turnVisible}
          keyboard={false}
          maskClosable={false}
          closable={false}
          centered
          footer={false}
          width="36rem" style={{ top: '20rem' }}
        >
          <div>
            <div className={styles.patInfo}>
              <span>{_.get(modalData, 'bedCode')}床</span>
              <span>{_.get(modalData, 'patName')}</span>
            </div>
            <p className={styles.patAction}>完成翻身?</p>
            <div style={{ textAlign: 'center' }}>
              <a onClick={() => this.handleCancel()} className={styles.cancelButton}>取消</a>
              <a onClick={() => this.handleOk()} className={styles.okButton}>确认</a>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}