import themes from '../../theme';
import { handoverColumn } from './columns.js';

const {
  vendor: {
    react: React,
    dva: { connect },
    moment,
    lodash: _,
    antd: { Button, Radio, DatePicker, Table, Spin },
    classnames: classNames,
  },
} = platform;

@connect((state) => ({
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
  currentTimestamp: _.get(state, 'whiteboard.currentTimestamp'),
  handoverOperates: _.get(state, 'whiteboard.handoverOperates'),
  whiteBoardEvent: _.get(state, 'dictionary.map.whiteBoardEvent'),
  shiftInfo: _.get(state, 'whiteboard.shiftInfo'),
}))
export default class handoverManagement extends React.Component {

  state = {
    mounted: false,
    shiftType: '',
    eventType: 'all',
    currentDate: moment().format('YYYY-MM-DD'),
    handoverContentOffsetHeight: 0,
    handoverDataSource: [],
    handoverCountArr: [],
    startTime: `${moment().format('YYYY-MM-DD')} 00:00:00`,
    endTime: `${moment().add(1, 'days').format('YYYY-MM-DD')} 00:00:00`,
  }

  handoverInterval = null;

  componentDidMount() {
    const { whiteBoardConfig, currentTimestamp, handoverOperates } = this.props;

    if (_.get(this.handoverContent, 'offsetHeight')) {
      this.setState({
        currentDate: moment(currentTimestamp).format('YYYY-MM-DD'),
        handoverContentOffsetHeight: (_.get(this.handoverContent, 'offsetHeight') - 60),
      });
    }

    if (handoverOperates) {
      this.setState({
        shiftType: _.get(handoverOperates, 'shiftType'),
        currentDate: _.get(handoverOperates, 'currentDate'),
        eventType: _.get(handoverOperates, 'eventType'),
      });
    }

    if (whiteBoardConfig) {
      this.getHandoverData({
        date: _.get(handoverOperates, 'currentDate'),
        sType: _.get(handoverOperates, 'shiftType'),
        eype: _.get(handoverOperates, 'eventType'),
      });

      this.refreshHandoverData(_.get(whiteBoardConfig, 'config.basicConfig'));
    }
  }

  componentWillUnmount = () => {
    const { shiftType, currentDate, eventType } = this.state;
    if (this.handoverInterval) {
      clearInterval(this.handoverInterval);
      this.handoverInterval = null;
    }

    this.props.dispatch({
      type: 'whiteboard/updateState',
      payload: {
        handoverOperates: {
          shiftType,
          currentDate,
          eventType,
        }
      },
    });
  }

  getHandoverData = ({ date, sType, eType }) => {
    const { dispatch, currentWardInfo, whiteBoardEvent, shiftInfo } = this.props;
    const { currentDate, shiftType, eventType } = this.state;

    let startTime = `${date || currentDate} 00:00:00`;
    let endTime = `${moment(date || currentDate).add(1, 'days').format('YYYY-MM-DD')} 00:00:00`;
    let findShift = null;
    const finalType = _.isUndefined(sType) ? shiftType : sType;

    if (finalType) {
      findShift = _.find(shiftInfo, function (item) {
        return item.shiftName === finalType;
      });

      if (findShift) {
        startTime = `${date || currentDate} ${moment(findShift.startTime).format("HH:mm:ss")}`;
        endTime = `${moment(date || currentDate).add(1, 'days').format('YYYY-MM-DD')} ${moment(findShift.startTime).format("HH:mm:ss")}`;
      }
    }

    const wsc = dispatch({
      type: 'handoverManagement/getWardShiftCounts',
      payload: {
        teamCode: _.get(findShift, 'teamCode') || '',
        wardCode: _.get(currentWardInfo, 'wardCode'),
        startTime,
        endTime,
      },
    });

    const ws = dispatch({
      type: 'handoverManagement/getWardShifts',
      payload: {
        eventKeys: [eType || eventType],
        teamCode: _.get(findShift, 'teamCode') || '',
        wardCode: _.get(currentWardInfo, 'wardCode'),
        startTime,
        endTime,
      },
    });

    Promise.all([wsc, ws]).then((responses) => {
      const wardShiftCounts = responses[0];
      const wardShifts = responses[1];

      const whiteBoardConfigWithIndex = _.map(whiteBoardEvent, (item, index) => ({ ...item, index }));
      const finalHandoverCountArr = _.chain(wardShiftCounts)
        .map(function (item) {
          const findObj = _.find(whiteBoardConfigWithIndex, function (data) {
            return item.event === data.code;
          });

          return {
            ...findObj,
            count: item.count,
            isDanger: _.includes(['dangerD', 'dangerS', 'qj', 'sw'], findObj.code),
          };
        })
        .sortBy('index')
        .value() || [];

      this.setState({
        mounted: true,
        handoverCountArr: finalHandoverCountArr,
        handoverDataSource: wardShifts,
        startTime,
        endTime,
      });
    });
  }

  refreshHandoverData = (basicConfig) => {
    if (this.handoverInterval) {
      return;
    }

    this.handoverInterval = setInterval(() => {
      this.getHandoverData({});
    }, (_.get(basicConfig, 'refreshInterval')) * 1000);
  }

  handleHandoverTypeChange = (type) => {
    this.setState({
      eventType: 'all',
      shiftType: type,
    });

    this.getHandoverData({ sType: type, eType: 'all' });
  }

  handleItemTypeChange = (item) => {
    const { shiftInfo, currentWardInfo } = this.props;
    const { startTime, endTime, shiftType } = this.state;

    if (item.count === 0) {
      return;
    }

    const findShift = _.find(shiftInfo, function (item) {
      return item.shiftName === shiftType;
    });

    this.props.dispatch({
      type: 'handoverManagement/getWardShifts',
      payload: {
        eventKeys: [item.code],
        teamCode: _.get(findShift, 'teamCode') || '',
        wardCode: _.get(currentWardInfo, 'wardCode'),
        startTime,
        endTime,
      },
    }).then(res => {
      this.setState({
        eventType: item.code,
        handoverDataSource: res,
      });
    });
  }

  dateChange = (date, dateString) => {
    const { currentTimestamp } = this.props;

    if (!dateString) {
      dateString = moment(currentTimestamp).format('YYYY-MM-DD');
    }

    this.setState({
      currentDate: dateString,
      eventType: 'all',
    });

    this.getHandoverData({ date: dateString, eType: 'all' });
  }

  render() {
    const { whiteBoardConfig, currentTimestamp, shiftInfo } = this.props;
    const { shiftType, currentDate, mounted, eventType, handoverContentOffsetHeight, handoverDataSource, handoverCountArr } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    return (
      <div className={styles.handoverWrap}>
        {!mounted && (
          <div className={styles.loadingStyle}>
            <Spin size="large" tip="正在加载，请稍后..."></Spin>
          </div>
        )}
        <div className={styles.handoverHeader}>
          <div className={styles.leftRadioGroup}>
            <a onClick={() => this.handleHandoverTypeChange('')} className={classNames(styles.handoverButton, {
              [styles.activeHandoverButton]: shiftType === '',
            })}>
              全天汇总
            </a>
            {
              _.map(shiftInfo, (item) => {
                return(
                  <a onClick={() => this.handleHandoverTypeChange(item.shiftName)} className={classNames(styles.handoverButton, {
                    [styles.activeHandoverButton]: shiftType === item.shiftName,
                  })}>
                    {item.shiftName}班
                  </a>
                )
              })
            }
          </div>
          <div className={styles.rightDatePicker}>
            <span className={styles.handoverLog}>交班日志</span>
            <DatePicker
              onChange={this.dateChange}
              value={moment(currentDate, 'YYYY-MM-DD')}
              size="large"
              disabledDate={(current) => {
                return !(current < moment(currentTimestamp).add(0, 'day') && current > moment(currentTimestamp).subtract(3, 'day'));
              }}
            />
          </div>
        </div>
        <div className={styles.handoverItemWrap}>
          {
            _.map(handoverCountArr, item => {
              return (
                <div className={classNames(styles.itemStyle, {
                  [styles.dangerItem]: item.isDanger,
                  [styles.noCountItem]: item.count === 0,
                  [styles.activeItem]: item.code === eventType,
                })} onClick={() => this.handleItemTypeChange(item)}>
                  <span>{item.name}</span>
                  <span>{item.count === 0 ? '-' : item.count}</span>
                </div>
              )
            })
          }
        </div>
        <div className={styles.handoverContent} ref={ref => (this.handoverContent = ref)}>
          <Table
            dataSource={handoverDataSource}
            columns={handoverColumn}
            size="small"
            pagination={false}
            scroll={{ y: handoverContentOffsetHeight }}
          />
        </div>
      </div>
    );
  }
}
