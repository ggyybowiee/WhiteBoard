const {
  vendor: {
    lodash: _,
  },
  utils: {
    websocket: { create, handleMessage },
  },
  app,
} = platform;

let ws;
let ldmWs;
export const wsLoop = (wardCode) => {
  const initData = {
    msgType: "whiteBoard",
    args: {
      wardCode,
    }
  };

  ws = create({
    nameSpace: 'sys',
    url: `ws://${location.host}/ws/sys/websocket`,
    onOpen: () => {
      console.log('sys Open~');
      ws.send(JSON.stringify(initData));
    },
    onClose: () => {
      console.log('sys Close~');
      setTimeout(() => {
        console.debug('WS断开, 正在重连...');
      }, 2000);
    },
  });

  ldmWs = create({
    nameSpace: 'ldm',
    url: `ws://${location.host}/ws/ldm/websocket`,
    onOpen: () => {
      console.log('ldm Open~');
      ldmWs.send(JSON.stringify(initData));
    },
    onClose: () => {
      console.log('ldm Close~');
      setTimeout(() => {
        console.debug('WS断开, 正在重连...');
      }, 2000);
    },
  });
};