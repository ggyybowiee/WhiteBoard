import themes from '../../theme';
import { NURSING_LEVEL } from './const.js';

const {
  vendor: {
    react: React,
    dva: { connect },
    lodash: _,
    antd: { Carousel, Spin },
    classnames: classNames,
  },
  layouts: { TableLayout },
  utils: {
    createSimpleRestModel: { createSimpleRestActions },
  },
} = platform;

@connect(state => ({
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
}))
export default class Infusion extends React.PureComponent {
  timeIds = [];
  currentPageNum = 0;

  constructor(props) {
    super(props);

    this.state = {
      infusionList: [],
      mounted: false,
    };

    this.styles = _.get(
      themes,
      _.get(this.props.whiteBoardConfig, 'config.basicConfig.themeColor') || 'light'
    );
  }

  nursingLevelShowType = '0';

  componentDidMount() {
    this.getInfusion();
    this.getInfusionConfig();
    this.refresh();

    if (this.props.whiteBoardConfig) {
      this.nursingLevelShowType =
        _.get(this.props.whiteBoardConfig, 'config.bedListConfig.nursingLevelShowType') || '0';
    }
  }

  componentWillUnmount() {
    this.timeIds.forEach(timeId => clearInterval(timeId));
    this.currentPageNum = 0;
  }

  getInfusion = () => {
    const { dispatch, currentWardInfo } = this.props;

    dispatch({
      type: 'infusion/getInfusionInfo',
      payload: {
        deptCode: _.get(currentWardInfo, 'wardCode'),
        isInfusion: 3,
      },
    }).then(res => {
      this.setState({
        list: this.restList(res),
        infusionList: _.chunk(res, 5 * 7),
        mounted: true,
      });
    });
  };

  refresh = () => {
    this.timeIds[0] = this.refreshInfusion();
  };

  refreshInfusion() {
    return setInterval(this.getInfusion, this.state.refreshInterval || 15000);
  }

  getInfusionConfig = () => {
    const { dispatch, whiteBoardConfig } = this.props;

    dispatch({
      type: 'infusion/getInfusionConfig',
    }).then(res => {
      this.setState({
        pageTurningTime:
          _.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') ||
          +_.get(res, 'pageTurningTime.configValue') ||
          5, // 多页自动切换频率
        refreshInterval: _.get(whiteBoardConfig, 'config.basicConfig.refreshInterval') * 1000,
        showSpeedOrTime: _.get(res, 'showSpeedOrTime.configValue') === 'S', // 显示输液滴速还是剩余时间(S:滴速,T:时间)
        showNurseLevelColorIcon: _.get(res, 'showNurseLevelColorIcon.configValue'), // 是否显示护理等级图例
        showPatientGender: _.get(res, 'showPatientGender.configValue') === '1', // 是否显示患者性别(0:不显示,1:显示)

        showLefBedDoubleColumn: _.get(res, 'showLefBedDoubleColumn.configValue') === '1', // 是否显示两列报警床位(0:不显示,1:显示)
        showNurseLevelSummary: _.get(res, 'showNurseLevelSummary.configValue'), // 是否显示护理等级统计人数

        showPatientAdmitdate: _.get(res, 'showPatientAdmitdate.configValue'), // 是否显示患者住院日期(0:不显示,1:显示)
        showPatientAge: _.get(res, 'showPatientAge.configValue') === '1', //是否显示患者年龄(0:不显示,1:显示)
        patientDangerColor:
          _.get(whiteBoardConfig, 'config.basicConfig.dangerLevelColor.危') ||
          _.get(res, 'patientDangerColor.configValue'), // 病危颜色值
        patientSeriousColor:
          _.get(whiteBoardConfig, 'config.basicConfig.dangerLevelColor.重') ||
          _.get(res, 'patientSeriousColor.configValue'), // 病重颜色值
        showPatientSerious: _.get(res, 'showPatientSerious.configValue'), // 是否显示病重(倒三角形)
        showNurseLevelIcon: _.get(res, 'showNurseLevelIcon.configValue'), // 是否显示护理等级(0:不显示,1:显示)
        showPatientDanger: _.get(res, 'showPatientDanger.configValue'), // 是否显示病危（米字型）
        showPatientHospitalNo: _.get(res, 'showPatientHospitalNo.configValue') === '1', // 是否显示患者住院号(0:不显示,1:显示)
        showBatteryLowPower: _.get(res, 'showBatteryLowPower.configValue') === '1', // 是否显示低电报警图标(0:不显示,1:显示)
      });
    });
  };

  renderNursingLevel = data => {
    const { whiteBoardConfig } = this.props;
    const tendLevel = _.get(data, 'bedPatientInfo.tendLevel');

    return this.isVisible('nursingInfosToShow', 'nursingLevel') ? (
      <div>
        {this.nursingLevelShowType == '0' && (
          <div
            className={this.styles.topRightWord}
            style={{
              color: _.get(whiteBoardConfig, `config.basicConfig.nursingLevelColor[${tendLevel}]`),
            }}
          >
            {NURSING_LEVEL[tendLevel]}
          </div>
        )}
        {this.nursingLevelShowType == '1' && (
          <div
            className={this.styles.topRightColorBlock}
            style={{
              borderBottomColor: _.get(
                whiteBoardConfig,
                `config.basicConfig.nursingLevelColor[${tendLevel}]`
              ),
              borderRightColor: _.get(
                whiteBoardConfig,
                `config.basicConfig.nursingLevelColor[${tendLevel}]`
              ),
            }}
          />
        )}
      </div>
    ) : null;
  };

  isVisible = (tail, property) =>
    _.chain(this.props.whiteBoardConfig)
      .get(`config.bedListConfig.${tail}`)
      .find(item => item.itemCode === property)
      .value();

  renderInfusionCardWrap = data => {
    const { whiteBoardConfig } = this.props;
    const {
      showSpeedOrTime,
      showPatientGender,
      showPatientAge,
      showPatientHospitalNo,
      showBatteryLowPower,
    } = this.state;
    const { inmPerBagInfo, bedPatientInfo } = data;

    const status = _.get(data, 'inmPerBagInfo.infusion_status');
    const percent = _.get(data, 'inmPerBagInfo.latestInmPercent');
    const age = _.get(data, 'bedPatientInfo.age');
    const inHospitalNo = _.get(data, 'bedPatientInfo.inHospitalNo');
    const sex = _.get(data, 'bedPatientInfo.sex');
    const patientName = _.get(data, 'bedPatientInfo.patientName');
    const usePrivateName = _.get(whiteBoardConfig, 'config.bedListConfig.usePrivateName');
    const bedCodeRegex = _.get(whiteBoardConfig, 'config.basicConfig.bedCodeRegex');

    const justShowBedCode =
      inmPerBagInfo.latestRestCapacity < 5 && inmPerBagInfo.capacityAlarmStatus !== 0;
    const isNStatus = status && (status === 'F' || status === 'S');
    const lowBattery = +data.restKwh <= 10 && !isNStatus && showBatteryLowPower;
    const speedAlarm = inmPerBagInfo.speedAlarmStatus > 0 && data.isDropSpeedAlarm;
    const currentBedCode = (data.aliasCode || data.bedCode).match(bedCodeRegex);
    const currentPatientName = usePrivateName ? this.restPatientName(patientName) : patientName;

    return (
      <div className={this.styles.cardWrapPaddingAndFlex}>
        <div className={this.styles.cardWrap}>
          {this.renderNursingLevel(data)}
          {lowBattery && <i className={this.styles.lowBatteryIcon} />}
          {justShowBedCode ? (
            <div className={this.styles.justShowBedCode}>
              <span className={this.styles.bedCode}>{data.aliasCode || data.bedCode}</span>
              <span className={this.styles.hintMessage}>输液即将完成</span>
            </div>
          ) : (
            <>
              <div className={this.styles.cardLeft}>
                <div className={this.styles.bedCodeWrap}>
                  <div className={this.styles.bedCodeSubWrap}>
                    <span className={this.styles.bedCode}>{currentBedCode}</span>
                  </div>
                </div>
                {bedPatientInfo && (
                  <div className={this.styles.patientInfo}>
                    <span className={this.styles.patientName}>{currentPatientName}</span>

                    <div>
                      {showPatientGender && <span>{sex === 'F' ? '女' : '男'}</span>}
                      {showPatientAge && <span style={{ marginLeft: '1rem' }}>{age}</span>}
                    </div>
                    {showPatientHospitalNo && <span>{inHospitalNo}</span>}
                  </div>
                )}
              </div>
              <div className={this.styles.cardRight}>
                {status && !isNStatus && (
                  <div className={this.styles.bottleCapacity}>
                    {status === 'W' ? 0 : inmPerBagInfo.spec_capacity}ml
                  </div>
                )}
                <div className={this.styles.bottleOutlineWrap}>
                  <div className={this.styles.bottleWrap}>
                    <div
                      className={classNames(this.styles.infusionStatusWrap, {
                        [this.styles.search]: status === 'B' && +data.monitorTime > 20,
                        [this.styles.waiting]: status === 'W',
                        [this.styles.leaving]: status === 'L',
                        [this.styles.suspend]: status === 'P',
                        [this.styles.wash]: speedAlarm && inmPerBagInfo.speedAlarmStatus === 3,
                      })}
                    />
                    <div
                      className={classNames(this.styles.bottleRestVol, {
                        [this.styles.nonVol]: status !== 'I',
                        [this.styles.speedAlarmVol]: speedAlarm,
                        [this.styles.smallRestCapacityVol]: inmPerBagInfo.latestRestCapacity < 10,
                      })}
                      style={{ height: `${status === 'I' && (percent <= 10 ? 10 : percent)}%` }}
                    />
                    <div className={this.styles.bottleText}>
                      <div className={this.styles.monitorRestCapacity}>
                        <span className={this.styles.restCapacityNum}>
                          {Math.floor(inmPerBagInfo.latestRestCapacity)}
                        </span>
                        <span style={{ lineHeight: 1 }}>ml</span>
                      </div>
                      <div className={this.styles.monitorRestTime}>
                        <i
                          className={classNames({
                            [this.styles.timeIcon]: !speedAlarm && !showSpeedOrTime,
                            [this.styles.dropRedIcon]: speedAlarm,
                            [this.styles.dropIcon]: showSpeedOrTime,
                          })}
                        />
                        <span
                          className={classNames(this.styles.monitorRestNum, {
                            [this.styles.textRed]: speedAlarm,
                          })}
                        >
                          {speedAlarm || showSpeedOrTime
                            ? inmPerBagInfo.latestDropSpeed
                            : inmPerBagInfo.latestRestTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  restPatientName = name => {
    if (name) {
      return `${name[0]}*${name[name.length - 1]}`;
    }
  };

  restList = data => {
    let list = [];

    if (!Array.isArray(data)) {
      return list;
    }

    data.forEach((item, index) => {
      let _item = {};
      const { inmPerBagInfo, bedPatientInfo } = item;

      _item = {
        aliasCode: item.aliasCode,
        bedCode: item.bedCode ? item.bedCode.toString().substr(0, 8) : '',
        status: inmPerBagInfo.infusion_status,
        restCapacity: parseFloat(inmPerBagInfo.latestRestCapacity),
      };

      if (bedPatientInfo) {
        _item.patientName = bedPatientInfo.patientName;
      }

      if (
        ['I', 'B', 'M', 'L', 'P', 'W', 'R', 'C'].indexOf(_item.status) > -1 ||
        _item.patientName
      ) {
        list.push(_item);
      }
    });

    return list;
  };

  calcRule = (data, showLefBedDoubleColumn) => {
    if (!Array.isArray(data)) {
      return null;
    }
    const ruleCollection = {};
    const _data = data.slice().sort((a, b) => a.restCapacity - b.restCapacity);

    _data.forEach((item, index, array) => {
      const { restCapacity: vol, aliasCode, bedCode } = item;
      let normal_num = Math.floor(vol);

      const bottleItem = {
        aliasCode,
        bedCode,
        value: vol,
        style: {
          fontSize: '2.8rem',
        },
      };

      if ((vol >= normal_num || Math.floor(vol) === normal_num) && vol < normal_num + 1) {
        if (item.status !== 'I' || vol < 0 || normal_num > 10) return;

        const isLongCode = (row, item) => {
          return (
            row.length === 1 &&
            ((row[0].aliasCode || row[0].bedCode).length > 2 ||
              (item.aliasCode || item.bedCode).length > 2)
          );
        };

        const isAvailable = (row, item) => {
          if (row.length === 0 && !showLefBedDoubleColumn) {
            return true;
          }
          if (isLongCode(row, item)) {
            return false;
          }
          return row.length >= 0 && row.length < 2 && showLefBedDoubleColumn;
        };

        let intVol = Math.floor(vol);

        if (_.isEmpty(ruleCollection[intVol])) {
          ruleCollection[intVol] = [];
          bottleItem.style.textAlign = 'center';
        }

        const bottleStack = num => {
          // 相同刻度个数大于两个时，如果上一格为空则往上堆。
          if (!ruleCollection[num + 1]) {
            ruleCollection[num + 1] = [];
            bottleItem.style.textAlign = 'center';
            bottleItem.style = Object.assign(bottleItem.style, this.setStyle(num + 1));
            ruleCollection[num + 1].push(bottleItem);
          } else if (
            !isLongCode(ruleCollection[num + 1], item) &&
            ruleCollection[num + 1].length < 2 &&
            showLefBedDoubleColumn
          ) {
            ruleCollection[num + 1][0].style.textAlign = 'left';
            bottleItem.style.textAlign = 'right';
            bottleItem.style = Object.assign(bottleItem.style, this.setStyle(num + 1));
            ruleCollection[num + 1].push(bottleItem);
          } else {
            // 上一行的同一刻度已经超过两个
            bottleStack(num + 1);
          }
        };

        // 相同刻度个数大于两个时，如果上一格为空则往上堆。
        if (!isAvailable(ruleCollection[intVol], item)) {
          bottleStack(intVol);
        } else {
          bottleItem.style = Object.assign(bottleItem.style, this.setStyle(intVol));
          if (ruleCollection[intVol].length === 1 && showLefBedDoubleColumn) {
            ruleCollection[intVol][0].style.textAlign = 'left';
            bottleItem.style.textAlign = 'right';
          }
          ruleCollection[intVol].push(bottleItem);
        }
        // 新算法 end
      }
    });
    return ruleCollection;

    // return ruleData;
  };

  setStyle = num => {
    const ruleHeight = this.ruleInnerWrap.clientHeight;
    const fontHeight = ruleHeight / 10;
    let bottom = '';
    let colorText = '';
    bottom = num * fontHeight;

    if (num < 5) {
      colorText = '#f21259';
    } else {
      colorText = '#e000e0';
    }

    return {
      lineHeight: `${fontHeight}px`,
      color: colorText,
      bottom: `${bottom}px`,
    };
  };

  render() {
    const { mounted, infusionList, list, showLefBedDoubleColumn, pageTurningTime } = this.state;
    const ruleData = this.calcRule(list, showLefBedDoubleColumn);

    return (
      <div
        className={this.styles.infusionListWrap}
      >
        <div className={this.styles.left}>
          <div className={this.styles.ruleWrap}>
            <div className={this.styles.ruleInnerWrap} ref={ref => (this.ruleInnerWrap = ref)}>
              {_.map(ruleData, (row, rowIndex) => (
                <div className={this.styles.ruleRow} key={`ruleRow-${rowIndex}`}>
                  {_.map(row, (item, index) => (
                    <div
                      className={this.styles.innerItem}
                      key={`innerItem-${index}`}
                      style={item.style}
                    >
                      <span>{item.aliasCode || item.bedCode}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={this.styles.tipsWrap}>
            <div className={this.styles.tipItem}>
              <span className={this.styles.dropErrorIcon} />
              <span className={this.styles.tipText}>滴速异常</span>
            </div>
            <div className={this.styles.tipItem}>
              <span className={this.styles.lowRestIcon} />
              <span className={this.styles.tipText}>低于10ml</span>
            </div>
            <div className={this.styles.tipItem}>
              <span className={this.styles.timeIcon} />
              <span className={this.styles.tipText}>剩余分钟</span>
            </div>
            <div className={this.styles.tipItem}>
              <span className={this.styles.speedIcon} />
              <span className={this.styles.tipText}>输液滴速</span>
            </div>
          </div>
        </div>
        <div className={this.styles.right}>
          {!mounted && (
            <div className={this.styles.loadingStyle}>
              <Spin size="large" tip="正在加载，请稍后..." />
            </div>
          )}
          {
            infusionList.length > 0 ? (
              <Carousel autoplay={true} initialSlide={0} autoplaySpeed={pageTurningTime * 1000}>
                {_.map(infusionList, item => {
                  return (
                    <div className={this.styles.cardFlex}>
                      {_.map(item, sub => {
                        return this.renderInfusionCardWrap(sub);
                      })}
                    </div>
                  );
                })}
              </Carousel>
            ) : null
          }
        </div>
      </div>
    );
  }
}
