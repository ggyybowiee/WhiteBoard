import themes from '../../theme';
import { NURSING_LEVEL, GENDER, DANGER_LEVEL, EVALUATE_RISK_COLOR_LEVEL } from './const.js';

const {
  vendor: {
    react: React,
    dva: { connect },
    lodash: _,
    moment,
    antd: { Carousel, Row, Col, Spin },
    classnames: classNames,
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

@connect((state) => ({
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentShift: _.get(state, 'whiteboard.currentShift'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
  evaluateNature: _.get(state, 'dictionary.map.evaluateNature'),
}))
export default class BedList extends React.Component {

  state = {
    mounted: false,
    bedList: [],
  };

  nursingLevelShowType = '0';
  bedListInterval = null;

  componentDidMount() {

    if (this.props.whiteBoardConfig) {
      this.getBedList();
      this.refreshBedList(_.get(this.props.whiteBoardConfig, 'config.basicConfig'));
      this.nursingLevelShowType = _.get(this.props.whiteBoardConfig, 'config.bedListConfig.nursingLevelShowType') || '0';
    }

  }

  componentWillUnmount = () => {

    if (this.bedListInterval) {
      clearInterval(this.bedListInterval);
      this.bedListInterval = null;
    }

  }

  getBedList = () => {
    const { dispatch, currentWardInfo } = this.props;

    // 床位列表
    dispatch({
      type: 'bedList/getBedList',
      payload: {
        wardCode: _.get(currentWardInfo, 'wardCode'),
      },
    }).then((res) => {
      this.setState({
        bedList: _.chunk(res, 5 * 7),
        mounted: true,
      });
    });

  }

  refreshBedList = (basicConfig) => {
    if (this.bedListInterval) {
      return;
    }

    this.bedListInterval = setInterval(() => {
      this.getBedList();
    }, (_.get(basicConfig, 'refreshInterval')) * 1000);

  }

  getEvaluateNatureAbbreviation = (nature) => {
    const { evaluateNature } = this.props;

    return _.get(_.find(evaluateNature, item => {
      return item.code === nature;
    }), 'abbreviation') || '';

  }

  renderBedCardWrap = (sub) => {
    const { whiteBoardConfig } = this.props;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    const isVisible = (tail, property) => _.chain(whiteBoardConfig).get(`config.bedListConfig.${tail}`).find(item => item.itemCode === property).value();

    return (
      <div className={styles.bedCardWrapPaddingAndFlex} key={sub.bedCode}>
        <div className={styles.bedCardWrap}>
          {
            isVisible('nursingInfosToShow', 'nursingLevel') ? (<div>
              {this.nursingLevelShowType == '0' && (
                <div className={styles.topRightWord} style={{ color: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[sub.nurseLevel] }}>{NURSING_LEVEL[sub.nurseLevel]}</div>
              )}
              {this.nursingLevelShowType == '1' && (
                <div className={styles.topRightColorBlock} style={{ borderBottomColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[sub.nurseLevel], borderRightColor: _.get(whiteBoardConfig, 'config.basicConfig.nursingLevelColor')[sub.nurseLevel] }}></div>
              )}
            </div>) : null
          }
          <div className={styles.topContent}>
            <div className={styles.firstRow}>
              <span className={styles.bedCodeStyle}>{sub.bedCode}</span>
              <span className={styles.patNameStyle}>{sub.patName}</span>
              <span className={styles.dangerLevelStyle} style={{ color: _.get(whiteBoardConfig, 'config.basicConfig.dangerLevelColor')[DANGER_LEVEL[sub.dangerLevel]] }}>
                { isVisible('nursingInfosToShow', 'dangerLevel') ? DANGER_LEVEL[sub.dangerLevel] : null }
              </span>
            </div>
            <div className={styles.secondRow}>
              <span className={styles.inhosCodeStyle}>
                { isVisible('patientInfosToShow', 'inhosCode') ? sub.inhosCode : null }
              </span>
              <span className={styles.genderStyle}>
                { isVisible('patientInfosToShow', 'gender') ? GENDER[sub.gender] : null }
              </span>
              <span className={styles.ageStyle}>
                { isVisible('patientInfosToShow', 'age') ? sub.age : null }
              </span>
            </div>
            <div className={styles.thirdRow}>
              <div className={styles.spanWrap}>
              {
                sub.evaluations && _.map(sub.evaluations, (evaluate) => {
                  if (evaluate.riskLevel !== '04') {
                    return (<span key={evaluate.inhosCode} style={{ backgroundColor: EVALUATE_RISK_COLOR_LEVEL[evaluate.riskLevel] }}>{this.getEvaluateNatureAbbreviation(evaluate.nature)}</span>)
                  }

                  return null;
                })
              }
              </div>
            </div>
          </div>
          <div className={styles.bottomContent}>
            <span>
              { isVisible('nursingInfosToShow', 'inDiag') ? sub.inDiag : null }
            </span>
            <span>
              { isVisible('patientInfosToShow', 'inDate') ? moment(sub.inDate).format('YYYY-MM-DD') : null }
            </span>
          </div>
        </div>
      </div>
    );
  }


  render() {
    const { whiteBoardConfig } = this.props;
    const { bedList, mounted } = this.state;
    const styles = _.get(themes, _.get(whiteBoardConfig, 'config.basicConfig.themeColor') || 'light');

    return (
      <div className={styles.bedListWrap}>
        {!mounted && (
          <div className={styles.loadingStyle}>
            <Spin size="large" tip="正在加载，请稍后..."></Spin>
          </div>
        )}
        {
          bedList.length > 0 ? (
          <Carousel autoplay={true} autoplaySpeed={_.get(whiteBoardConfig, 'config.basicConfig.flipOverInterval') * 1000}>
            {
              _.map(bedList, (item) => {
                return (
                  <div className={styles.bedCardFlex}>
                    {
                      _.map(item, (sub) => {
                        return this.renderBedCardWrap(sub)
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
