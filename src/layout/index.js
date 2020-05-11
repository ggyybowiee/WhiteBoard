// import styles from './index.less';
import routers from './router';
import themes from '../theme';

const {
  vendor: {
    react: React,
    dva: { connect },
    moment,
    lodash: _,
    dvaRouter: { Route, Link },
    antd: { Icon, Layout, Modal, Button },
    classnames: classNames,
  },
  utils: {
    request: { getApi },
  },
} = platform;

const { Header, Content, Footer } = Layout;

const getServerTime = () => {
  return getApi('/sys/server/time');
};

function timeToSec(time) {
  const hour = time.split(':')[0];
  const min = time.split(':')[1];
  const sec = time.split(':')[2];

  return `${Number(hour * 3600)}${Number(min * 60)}${Number(sec)}`;
};

const timeToToday = (fullTime) => {
  const time = moment(fullTime).format('HH:mm:ss');
  const date = moment().format('YYYY-MM-DD');

  return moment(`${date} ${time}`);
};

const timeToRange = ({ startTime: start, endTime: end }) => {
  let startTime = timeToToday(start);
  let endTime = timeToToday(end);

  if (startTime.isAfter(endTime)) {
    endTime = endTime.add(1, 'days');
  }

  return [startTime, endTime];
};

const getCurrentShift = (shiftInfo, serverTime) => {
  const now = moment(serverTime);

  const correct = _.find(shiftInfo, (item) => {
    const [start, end] = timeToRange(item);

    return (now.isSame(start) || now.isAfter(start)) && now.isBefore(end);
  });
  
  return correct || _.head(shiftInfo);
};

@connect((state) => ({
  app: _.get(state, 'global.app'),
  modules: _.chain(state)
    .get('permissions.currentPermissions')
    .find({ code: _.get(state, 'global.app') })
    .get('modules[0].routes')
    .value(),
  hospitalInfo: _.get(state, 'sysHospitalInfo.hospitalInfo'),
  whiteBoardConfig: _.get(state, 'whiteboard.whiteBoardConfig'),
  currentWardInfo: _.get(state, 'whiteboard.currentWardInfo'),
  shiftInfo: _.get(state, 'whiteboard.shiftInfo'),
  currentShift: _.get(state, 'whiteboard.currentShift'),
}))
export default class BasicLayout extends React.Component {
  state = {
    theme: 'light',
  }

  timer = null;

  componentDidMount() {

    const weekDay = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    let serverTimestamp = '';

    getServerTime().then(response => {
      serverTimestamp = moment(response).valueOf();
    });

    if (this.timer) {
      clearInterval(this.timer);
      return;
    }

    this.timer = setInterval(() => {
      const serverTime = moment(serverTimestamp);
      this.dateNode.innerHTML = serverTime.format("YYYY-MM-DD");
      this.weekNode.innerHTML = weekDay[serverTime.day()];
      this.timeNode.innerHTML = serverTime.format("HH:mm:ss");

      this.props.dispatch({
        type: 'whiteboard/updateState',
        payload: {
          currentShift: getCurrentShift(this.props.shiftInfo || [], serverTimestamp),
          currentTimestamp: serverTimestamp,
        },
      });

      serverTimestamp += 1000;
    }, 1000);
  
    // document.getElementsByTagName('html')[0].style.fontWeight = 'bold';

  }

  componentWillUnmount = () => {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.whiteBoardConfig && !_.isEqual(nextProps.whiteBoardConfig, this.props.whiteBoardConfig)) {
      this.setState({
        theme: _.get(nextProps, 'whiteBoardConfig.config.basicConfig.themeColor'),
      });
    }

    if (nextProps.shiftInfo && !_.isEqual(nextProps.shiftInfo, this.props.shiftInfo)) {
      getServerTime().then(response => {
        const serverTimeSecond = timeToSec(moment(response).format('HH:mm:ss'));
        this.props.dispatch({
          type: 'whiteboard/updateState',
          payload: {
            currentShift: getCurrentShift(nextProps.shiftInfo, serverTimeSecond),
          },
        });
      });
    }
  }
  
  renderModule = () => {
    const { app, modules } = this.props;
    
    return _.map(modules, item => {
      const path = `/${app}${item.path}`;
      const router = _.get(routers, item.content) || routers.otherwise;
      const Comp = router.component;

      return (
        <Route path={path} component={(props) => <Comp {...props} currentModule={item} />} exact={router.exact} />
      );
    });
  }

  renderNatigation = () => {
    const { app, modules, location: { pathname, search } } = this.props;
    const { theme } = this.state;
    const styles = _.get(themes, (theme || 'light'));
    return (
      <div
        className={styles.nav}
      >
        {
          _.map(modules, item => (
            <Link
              key={item.code}
              className={styles.navItem}
              to={`/${app}${item.path}${search ? search: ''}`}
              id={`/${app}${item.path}`}
            >
              <span className={classNames(styles.navItemBlock, {
                [styles.active]: `${pathname}${search ? search : ''}` === `/${app}${item.path}${search ? search : ''}`,
              })}>
                <Icon type={_.get(item, 'icon')} style={{ fontSize: '24px' }}/>
                <span>{item.name}</span>
              </span>
            </Link>
          ))
        }
      </div>
    );
  }

  render() {
    const { hospitalInfo, currentWardInfo, currentShift, modules } = this.props;
    const { theme } = this.state;
    const styles = _.get(themes, (theme || 'light'));
    const isFullScreen = _.get(modules, 'length') !== 1;

    return (
      <Layout
        className={styles.wrap}
      >
        <Header className={classNames(styles.header, styles.layoutHeader)}>
          <div className={styles.headerLeft}>
            <img src={_.get(hospitalInfo, 'hosIconPath')}/>
            <span>{_.get(hospitalInfo, 'hosDisplayName')}</span>
            <span>{_.get(currentWardInfo, 'wardName')} {_.get(currentShift, 'shiftName')}班</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.headerCenter}>
              <span ref={ref => (this.dateNode = ref)}></span>
              <span ref={ref => (this.weekNode = ref)}></span>
              <span ref={ref => (this.timeNode = ref)}></span>
            </span>
            <span className={styles.line}> | </span>
            <span className={styles.logo}></span>
          </div>
        </Header>
        <Content
          className={classNames(styles.content, {
            [styles.isFullScreen]: !isFullScreen,
          })}
        >
          {this.renderModule()}
        </Content>
        {
          isFullScreen && (
            <Footer className={styles.footer}>
              {this.renderNatigation()}
            </Footer>
          )
        }
      </Layout>
    );
  }
}
