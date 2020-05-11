import menu from './menu';
import router from './router';
import models from './models';
import services from './services';
import formatters from './formatters';
import { handleAlarmMessage } from './handleAlarmMessage.js';
import { isJSON } from './utils/utils.js';

const {
  vendor: {
    lodash: _,
  },
  utils: {
    websocket: { handleMessage },
  },
  app,
} = platform;

const { wsLoop } = require('./ws');
const { init } = require('./macWithToken');

const moduleDefine = {
  name: 'whiteboard',
  info: {
    title: '小白板',
    group: '业务类应用',
    symbol: 'Whiteboard',
    icon: 'http://127.0.0.1:3000/assets/images/icons/COMS.png',
    version: '1.0.0',
    description: '护理小白板电视/平板显示端',
    layout: 'horizontal',
  },
  menu,
  routers: router,
  models,
  services,
  formatters,
  dependecies: ['hospital'],
};

const handleInitedData = (wardCode) => {
  wsLoop(wardCode);

  handleMessage({
    listenTo: 'sys',
    name: 'global',
    handler: (data) => {
      if (!isJSON(data)) {
        return;
      }

      const wsWhiteBoardData = JSON.parse(data);
      const isWhiteboardData = _.isObject(wsWhiteBoardData) && _.get(wsWhiteBoardData, 'msgType') == 'whiteBoard';

      if (!isWhiteboardData) {
        return;
      }

      app._store.dispatch({
        type: 'whiteboard/updateState',
        payload: {
          whiteBoardConfig: {
            config: _.get(wsWhiteBoardData, 'content'),
          },
        },
      });

      init({resetTimerFlag: true});
    },
  })

  window.sendAlarmMessage = handleAlarmMessage;

  // 报警
  handleMessage({
    listenTo: 'ldm',
    name: 'alarm',
    handler: handleAlarmMessage,
  });
}

platform.app.registerModule(moduleDefine).then(() => {
  window.parent.postMessage('ready', '*');

  window.addEventListener('message', function (event) {
    if (event.data.token) {
      init(event.data).then(wardCode => {
        if (wardCode) {
          handleInitedData(wardCode);
        }
      });
    }
  }, false);

  init({}).then(wardCode => {
    if (wardCode) {
      handleInitedData(wardCode);
    }
  });
});
