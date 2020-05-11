import themes from '../../theme';

const {
  vendor: {
    react: React,
    antd: { Carousel, Icon },
    classnames: classNames,
  },
  app,
} = platform;

const computePosition = (alert) => {
  let originalSize = {
    width: 2045,
    height: 1252,
    scale: 2045 / 1252
  };

  let map = document.getElementById(alert.id);

  if (!map) {
    return;
  }

  let mapWidth  = map.clientWidth;
  let mapHeight = map.clientHeight;
  let mapBgScale = mapWidth  / mapHeight;
  let mapRealHeight = null;
  let mapRealWidth = null;
  let image = new Image();
  let imageSrc = map.getAttribute('src');

  imageSrc = imageSrc.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
  image.src = imageSrc;

  originalSize.width = image.width;
  originalSize.height = image.height;
  originalSize.scale = image.width / image.height;

  // 大小判定
  if (mapBgScale > originalSize.scale) {
    mapRealHeight = mapHeight;
    mapRealWidth = mapHeight * originalSize.scale;
    alert.scale = mapRealWidth / originalSize.width;
  } else {
    mapRealHeight = mapWidth  / originalSize.scale;
    mapRealWidth = mapWidth ;
    alert.scale = mapRealHeight / originalSize.height;
  }
  alert.offsetLeft = (mapWidth  - mapRealWidth) / 2;
  alert.offsetTop = (mapHeight - mapRealHeight) / 2;

  if (!alert.content.coordinate) {
    return
  }
  let coordinate = alert.content.coordinate.split(";");

  if (!!alert.scale) {
    let marginWidth = (map.parentElement.clientWidth - mapWidth ) / 2;
    alert.style = {
      position: 'absolute',
      display: 'block',
      left: coordinate[0] * alert.scale + alert.offsetLeft + marginWidth - 0 + 'px',
      top: coordinate[1] * alert.scale + alert.offsetTop - 0 + 'px'
    };
  } else {
    alert.style = '';
  }

  return alert;
}

export default class WarningLocation extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imgDataSource: {},
    };
  }

  componentDidMount() {
    const { wsData } = this.props;

    this.handleImgDataSource(wsData);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.wsData) {
      this.handleImgDataSource(nextProps.wsData);
    }
  }

  handleCancelClick = (data) => {
    app._store.dispatch({
      type: 'alarmEvent/cancelAlarm',
      payload: {
        queryParams: {
          deviceMac: _.get(data, 'content.deviceId'),
        }
      }
    });
  }

  handleImgDataSource = (wsData) => {
    let imgDataSource = {};

    setTimeout(() => {
      _.forEach(wsData, (value, key) => {
        imgDataSource[key] = computePosition(value)
      });

      this.setState({
        imgDataSource,
      });
    }, 200);
  }
  

  render() {
    const { wsData, theme } = this.props;
    const { imgDataSource } = this.state;
    const styles = _.get(themes, theme || 'light');
    
    return (
      <div className={styles.warningLocationWrap}>
        <Carousel
          autoplay={true}
          dots={false}
          touchMove
          initialSlide={_.size(wsData)}
          arrows
          nextArrow={(
            <div>
              <Icon type="caret-right" className={styles.arrowColor} />
            </div>
          )}
          prevArrow={(
            <div>
              <Icon type="caret-left" className={styles.arrowColor} />
            </div>
          )}
        >
          {
            _.map(wsData, (value, key) => {
              return (
                <div key={key}>
                  <div className={styles.headerPanel}>
                    <div className={styles.leftPart}>
                      <span className={classNames({
                        [styles.requestSupport]: _.get(value, 'content.alertTypeCode') === '01',
                        [styles.callHelp]: _.get(value, 'content.alertTypeCode') === '02',
                      })}>{_.get(value, 'content.bindingUserName')}</span>
                      <span>{_.get(value, 'content.alertType')}</span>
                    </div>
                    <div className={styles.rightPart}>
                      <div className={styles.timeAndWard}>
                        {_.get(value, 'content.alertTime')}&nbsp;<span className={styles.lineStyle}>|</span>&nbsp;{_.get(value, 'content.wardName')}
                      </div>
                      <div className={styles.location}>
                        {_.get(value, 'content.wardLocation')}&nbsp;<span className={styles.lineStyle}>-</span>&nbsp;{_.get(value, 'content.roomLocation')}
                      </div>
                    </div>
                  </div>
                  <div className={styles.mapPanel}>
                    <img src={_.get(value, 'content.mapUrl')} alt="平面图" id={_.get(value, 'id')} />
                    {
                      _.get(imgDataSource[key], 'style') && (
                        <div className={styles.spread} style={_.get(imgDataSource[key], 'style')}>
                          <span className={styles.spreadItem}></span>
                        </div>
                      )
                    }
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span onClick={() => this.handleCancelClick(value)} className={styles.cancelAlarm}>解除报警</span>
                  </div>
                </div>
              )
            })
          }
        </Carousel>
      </div>
      
    );
  }
}
