import themes from '../../theme';
import * as COLUMNS from './columns.js';

const {
  vendor: {
    react: React,
    dva: { connect },
    moment,
    lodash: _,
    antd: { Button, Radio, DatePicker, Table, Spin },
    classnames: classNames,
  },
  layouts: {
    TableLayout,
  },
  utils: {
    createSimpleRestModel: {
      createSimpleRestActions,
    },
    request: { getApi },
  },
} = platform;

const { Filters } = TableLayout;

@connect((state) => ({
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
  currentTimestamp: _.get(state, 'whiteboard.currentTimestamp'),
}))
export default class SurgeryMonitor extends React.Component {

  state = {
    mounted: false,
    surgeryType: 'todaySurgery',
    currentDate: moment().format('YYYY-MM-DD'),
    surgeryMonitorContentOffsetHeight: 0,
    surgeryDataSource: [],
    surgeryRecordCount: [],
  }

  surgeryMonitorInterval = null;
  surgeryDic = {};

  componentDidMount() {
    const { whiteBoardConfig, currentTimestamp } = this.props;

    this.surgeryDic = {
      todaySurgery: moment(currentTimestamp).format('YYYY-MM-DD'),
      laterSurgery: moment(currentTimestamp).add(1, 'days').format('YYYY-MM-DD'),
      historySurgery: moment(currentTimestamp).subtract(1, 'days').format('YYYY-MM-DD'),
    };

    if (_.get(this.surgeryMonitorContent, 'offsetHeight')) {
      this.setState({
        currentDate: moment(currentTimestamp).format('YYYY-MM-DD'),
        surgeryMonitorContentOffsetHeight: (_.get(this.surgeryMonitorContent, 'offsetHeight') - 60),
      });
    }

    if (whiteBoardConfig) {
      this.getSurgeries();
      this.refreshSurgeries(_.get(whiteBoardConfig, 'config.basicConfig'));
    }
  }

  componentWillUnmount = () => {
    if (this.surgeryMonitorInterval) {
      clearInterval(this.surgeryMonitorInterval);
      this.surgeryMonitorInterval = null;
    }
  }

  getSurgeries = (date) => {
    const { dispatch, currentWardInfo, currentTimestamp } = this.props;
    const { currentDate } = this.state;

    const src = dispatch({
      type: 'surgery/getSurgeryRecordCount',
      payload: {
        wardCode: _.get(currentWardInfo, 'wardCode'),
        queryParam: {
          beginTime: moment(currentTimestamp).format('YYYY-MM-DD'),
          endTime: moment(currentTimestamp).add(1, 'days').format('YYYY-MM-DD'),
        }
      },
    });

    const sr = dispatch({
      type: 'surgery/getSurgeryRecords',
      payload: {
        wardCode: _.get(currentWardInfo, 'wardCode'),
        queryParam: {
          beginTime: date || currentDate,
          endTime: date || currentDate,
        }
      },
    });

    Promise.all([src, sr]).then((responses) => {
      const surgeryRecordCount = responses[0];
      const surgeryRecords = responses[1];

      this.setState({
        surgeryRecordCount,
        surgeryDataSource: _.sortBy(surgeryRecords, ['planStartTime']),
        mounted: true,
      });
    });
  }

  refreshSurgeries = (basicConfig) => {
    if (this.surgeryMonitorInterval) {
      return;
    }

    this.surgeryMonitorInterval = setInterval(() => {
      this.getSurgeries();
    }, (_.get(basicConfig, 'refreshInterval')) * 1000);

  }

  handleSurgeryTypeChange = (type) => {
    this.setState({
      surgeryType: type,
      currentDate: this.surgeryDic[type],
    });
    this.getSurgeries(this.surgeryDic[type]);
  }

  dateChange = (date, dateString) => {
    const { currentTimestamp } = this.props;
    if (!dateString) {
      dateString = moment(currentTimestamp).format('YYYY-MM-DD');
    }

    if (dateString === moment(currentTimestamp).format('YYYY-MM-DD')) {
      this.setState({
        surgeryType: 'todaySurgery',
      });
    } else if (moment(dateString).isBefore(moment(currentTimestamp))) {
      this.setState({
        surgeryType: 'historySurgery',
      });
    } else {
      this.setState({
        surgeryType: 'laterSurgery',
      });
    }

    this.setState({
      currentDate: dateString,
    });

    this.getSurgeries(dateString);
  }

  renderSurgery = (type) => {
    const { whiteBoardConfig } = this.props;
    const { surgeryMonitorContentOffsetHeight, surgeryDataSource } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');
    const getColumns = COLUMNS[type];

    return (
      <div className={styles.surgeryContent}>
        <Table
          dataSource={surgeryDataSource}
          columns={getColumns(styles)}
          size="small"
          pagination={false}
          className={styles.todaySurgeryTable}
          scroll={{ y: surgeryMonitorContentOffsetHeight }}
          rowClassName={
            (record, index) => record.status == 6 ? styles.abnormalOpacity : styles.normalOpacity
          }
        />
      </div>
    )
  }
  
  render() {
    const { whiteBoardConfig, currentTimestamp } = this.props;
    const { surgeryType, currentDate, surgeryRecordCount, mounted } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');
    const surgeryCount = _.chain(surgeryRecordCount)
                          .map(item => {
                            if (!_.isNil(item.planStartDate)) {
                              item.planStartDate = moment(item.planStartDate).format('YYYY-MM-DD');
                            }
                            return item;
                          })
                          .groupBy('planStartDate')
                          .value();

    return (
      <div className={styles.surgeryMonitorWrap}>
        {!mounted && (
          <div className={styles.loadingStyle}>
            <Spin size="large" tip="正在加载，请稍后..."></Spin>
          </div>
        )}
        <div className={styles.surgeryMonitorHeader}>
          <div className={styles.leftRadioGroup}>
            <a onClick={() => this.handleSurgeryTypeChange('todaySurgery')} className={classNames(styles.surgeryButton, {
              [styles.activeSurgeryButton]: surgeryType === 'todaySurgery',
            })}>
              今日手术（{_.get(surgeryCount[moment(currentTimestamp).format('YYYY-MM-DD')], '[0].count') || 0}）
            </a>
            <a onClick={() => this.handleSurgeryTypeChange('laterSurgery')} className={classNames(styles.surgeryButton, {
              [styles.activeSurgeryButton]: surgeryType === 'laterSurgery',
            })}>
              预手术（{_.get(surgeryCount[moment(currentTimestamp).add(1, 'days').format('YYYY-MM-DD')], '[0].count') || 0}）
            </a>
            <a onClick={() => this.handleSurgeryTypeChange('historySurgery')} className={classNames(styles.surgeryButton, {
              [styles.activeSurgeryButton]: surgeryType === 'historySurgery',
            })}>
              历史手术
            </a>
          </div>
          <div className={styles.rightDatePicker}>
            <DatePicker 
              onChange={this.dateChange} 
              value={moment(currentDate, 'YYYY-MM-DD')}
              size="large"
              disabledDate={(current) => {
                return !(current < moment(currentTimestamp).add(7, 'day') && current > moment(currentTimestamp).subtract(8, 'day'));
              }}
            />
          </div>
        </div>
        <div className={styles.surgeryMonitorContent} ref={ref => (this.surgeryMonitorContent = ref)}>
          {
            this.renderSurgery(surgeryType)
          }
        </div>
      </div>
    );
  }
}
