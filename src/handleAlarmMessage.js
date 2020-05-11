import PatientCall from './components/PatientCall';
import WarningWristband from './components/WarningWristband';
import MewsAlert from './components/MewsAlert';
import WarningLocation from './components/WarningLocation';
import { isJSON } from './utils/utils.js';

const {
  vendor: {
    lodash: _,
  },
  components: {
    ExModal,
  },
  app,
} = platform;

let singleModal = {};
let singleModalWsData = [];
let multipleModals = {};

const getMsgTypes = {
  patient_call: (data) => {
    return () => (
      <PatientCall wsData={data} theme={_.get(app._store.getState(), 'whiteboard.whiteBoardConfig.config.basicConfig.themeColor')}/>
    );
  },
  warning_wristband: (data) => {
    return () => (
      <WarningWristband wsData={data} theme={_.get(app._store.getState(), 'whiteboard.whiteBoardConfig.config.basicConfig.themeColor')}/>
    )
  },
  mews_alert: (data) => {
    return () => (
      <MewsAlert wsData={data} theme={_.get(app._store.getState(), 'whiteboard.whiteBoardConfig.config.basicConfig.themeColor')}/>
    )
  },
  warning_location: (data) => {
    return () => (
      <WarningLocation wsData={data} theme={_.get(app._store.getState(), 'whiteboard.whiteBoardConfig.config.basicConfig.themeColor')}/>
    )
  },
}

const modalProps = { 
  warning_location: (size, index, content) => {
    return {
      content,
      visible: true,
      style: {
        top: 0,
        paddingBottom: 0,
      },
      width: window.innerWidth,
      height: window.innerHeight,
      bodyStyle: {
        width: window.innerWidth,
        height: window.innerHeight,
        paddingLeft: '6.375rem',
        paddingRight: '6.375rem',
      },
      zIndex: 1000 + index,
    }
  },
  mews_alert: (size, index, content) => {
    return {
      content,
      visible: true,
      width: '68rem',
      style: {
        top: 200 - 30 * (size - 1 - index),
        transform: `scale(${1 - 0.08 * (size - 1 - index)})`,
        paddingBottom: 0,
      },
      zIndex: 1000 + index,
      mask: index === 0,
      maskClosable: false,
    }
  },
  otherwise: (size, index, content) => {
    return {
      content,
      visible: true,
      width: '36rem',
      style: {
        top: 200 - 30 * (size - 1 - index),
        transform: `scale(${1 - 0.08 * (size - 1 - index)})`,
        paddingBottom: 0,
      },
      mask: index === 0,
      maskClosable: false,
      zIndex: 1000 + index,
    }
  },
};

const getProps = (data, size, index, content) => { 
  const messageType = _.get(data, 'msgType');
  const getModalProps = modalProps[messageType] || modalProps.otherwise;

  return getModalProps(size, index, content);
};

const updateModal = (data) => {
  _.forEach(data, (value, key) => {
    const props = getProps(value, _.size(data), value.index, value.content);
    value.instance.update(props);
  });
}

function handleMultipleModalClick(data) {
  multipleModals[data.id].instance.destroy();
  delete multipleModals[data.id];

  multipleModals = _.chain(multipleModals)
                .toPairs()
                .sortBy((item) => {
                  return item[1].index;
                })
                .map(([key, item], index) => ([
                  key,
                  {
                    ...item,
                    index,
                  },
                ]))
                .fromPairs()
                .value();
  updateModal(multipleModals);
}

function handleSingleModalClick(data) {
  _.remove(singleModalWsData, item => item.id === data.id);

  if (_.isEmpty(singleModalWsData)) {
    singleModal.instance.destroy();
    singleModal = {};

    return;
  }

  singleModal.instance.update({
    visible: true,
    content: (getMsgTypes.warning_location)(singleModalWsData),
    style: {
      top: 0,
      paddingBottom: 0,
    },
    width: window.innerWidth,
    height: window.innerHeight,
    bodyStyle: {
      width: window.innerWidth,
      height: window.innerHeight,
      paddingLeft: '6.375rem',
      paddingRight: '6.375rem',
    },
    destroyOnClose: true,
  });
}

function openOrUpdateSingleModal(data) {
  let findCommonDeviceIdIndex = _.findIndex(singleModalWsData, item => _.get(item, 'content.deviceId') === _.get(data, 'content.deviceId'));

  if (findCommonDeviceIdIndex > -1) {
    singleModalWsData[findCommonDeviceIdIndex] = data;
    singleModal.instance.update({
      visible: true,
      content: getMsgTypes[data.msgType](singleModalWsData),
      style: {
        top: 0,
        paddingBottom: 0,
      },
      width: window.innerWidth,
      height: window.innerHeight,
      bodyStyle: {
        width: window.innerWidth,
        height: window.innerHeight,
        paddingLeft: '6.375rem',
        paddingRight: '6.375rem',
      },
      destroyOnClose: true,
    });

    return;
  }

  singleModalWsData.push(data);
  
  // 当singleModalWsData > 2，为了保证singleModal.instance的唯一性，先销毁，再重新open。
  if (_.get(singleModal, 'instance')) {
    singleModal.instance.destroy();
    singleModal = {};
  }

  singleModal = {
    id: data.id,
    msgType: data.msgType,
    instance: ExModal.open({
      title: null,
      visible: true,
      content: getMsgTypes[data.msgType](singleModalWsData),
      footer: null,
      closable: false,
      keyboard: false,
      mask: singleModalWsData.length === 0,
      maskClosable: false,
      maskStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      },
      destroyOnClose: true,
      style: {
        top: 0,
        paddingBottom: 0,
      },
      width: window.innerWidth,
      height: window.innerHeight,
      bodyStyle: {
        width: window.innerWidth,
        height: window.innerHeight,
        paddingLeft: '6.375rem',
        paddingRight: '6.375rem',
      },
    }),
  }
}

function openMutilpleModal(data) {
  const content = getMsgTypes[data.msgType](data);
  const props = {
    title: null,
    content,
    footer: null,
    closable: false,
    keyboard: false,
    mask: false,
    maskClosable: false,
    maskStyle: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    destroyOnClose: true,
  };

  if (multipleModals[data.id]) {
    multipleModals[data.id].content = content;
  } else {
    multipleModals[data.id] = {
      id: data.id,
      msgType: data.msgType,
      content,
      index: _.size(multipleModals),
      instance: ExModal.open(props),
    }
  }

  if (data.msgType === 'patient_call' && _.chain(window).get('music.callSpeaker').isFunction().value()) {
    music.callSpeaker(`${_.get(data, 'content.bedCode')}床, 呼叫`);
  }

  updateModal(multipleModals);
}

export const handleAlarmMessage = (data) => {
  if (!isJSON(data)) {
    return;
  }

  data = JSON.parse(data);

  const messageType = _.get(data, 'msgType');

  // 输液语音播报
  if (messageType === 'liquid_warn' && _.chain(window).get('music.callSpeaker').isFunction().value()) {
    music.callSpeaker(_.get(data, 'content.message'));
    platform.event.emmit({ type: 'earlyWarning', value: true });
    return;
  }

  // patient_answer为床头卡应答，event='00'为进入病区, 01离开病区
  const patientInWard = _.get(data, 'content.event') === '00';
  const otherCondition = _.includes(['mews_alert_cancel', 'patient_answer'], messageType);

  if (messageType && (patientInWard || otherCondition)) {
    handleMultipleModalClick(data);
    return;
  }

  if (messageType && messageType === 'warning_location_cancel') {
    handleSingleModalClick(data); 
    return;
  }

  if (!getMsgTypes[messageType]) {
    return;
  }

  if (messageType && messageType === 'warning_location') {
    openOrUpdateSingleModal(data);
    return;
  }

  openMutilpleModal(data);
}