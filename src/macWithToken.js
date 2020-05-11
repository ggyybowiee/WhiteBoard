import Wait from './routes/Wait';

const {
  vendor: {
    antd: { message, notification },
    lodash: _,
    qs,
  },
  utils: {
    request: { getApi, putApi, postApi },
    SessionStore,
  },
  app,
} = platform;

const getTokenByMac = (mac) => {
  return postApi(`/ldm/device/tokens?mac=${mac}`);
};

const getDevice = (mac) => {
  return getApi('/ldm/device', {
    eqpName: mac,
  });
};

const getWhiteBoardConfig = (wardCode) => {
  return getApi('/sys/whiteboard', {
    wardCode
  });
};

const getWardInfo = (wardCode) => {
  return getApi('/hospital/hosWard', {
    wardCode
  });
}

const getShiftInfo = (wardCode) => {
  return getApi('/hospital/hosUserShiftExt', {
    wardCode,
    status: 1
  });
}

let timer = null;

function initJumpToDefaultPage(slot, currentPermission, search) {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }

  let timeSlot = slot;
  let homePathUrl = `/${_.get(currentPermission, 'code')}${_.get(currentPermission, 'homePath')}`;

  const setTimer = () => {
    clearInterval(timer);
    timer = setInterval(() => {
      if (location.hash.indexOf(homePathUrl) > -1) {
        return;
      }

      const accessibleApp = _.get(app._store.getState(), 'permissions.accessibleApp');
      document.getElementById(`/${accessibleApp.code}${accessibleApp.homePath}`).click();
      location.hash = `#/${accessibleApp.code}${accessibleApp.homePath}${(search && search !== '?/' && search !== '?') ? search : ''}`;

      app._store.dispatch({
        type: 'whiteboard/updateState',
        payload: {
          handoverOperates: null,
        },
      });
  
    }, timeSlot * 1000);
  }

  document.addEventListener('touchstart', setTimer);
  document.addEventListener('click', setTimer);

  setTimer();
}

let currentPermissions = [];

platform.event.subscribe('currentPermissions', (payload) => {
  console.log('currentPermissions loaded:', payload);
  currentPermissions = payload;

  init({});
});

export async function init({ token, profile, editable, resetTimerFlag }) {
  platform.event.emmit({ type: 'noToken', value: () => <Wait />});
  const auth = SessionStore.default.getItem('auth');
  const { redirect } = qs.parse(location.search, { ignoreQueryPrefix: true });
  let fakeToken = null;
  let device = null;
  let wardCode = null;
  let pureToken = token;

  if (editable) {
    fakeToken = token;
    wardCode = _.get(profile, 'wardCode');
  } else {
    // if (!_.chain(window).get('music.getDevMac').isFunction().value()) {
    //   return;
    // }
    // const mac = music.getDevMac();
    const mac = '28:F0:76:1B:75:30';
    device = await getDevice(mac);

    if (_.isNil(device)) {
      notification.error({
        message: '无设备信息',
        description: '请检查服务器是否启动',
      });
      return;
    }

    wardCode = _.get(device, '[0].content.basicInfo.eqpBelong');
    pureToken = await getTokenByMac(mac);
    fakeToken = {
      ...(_.get(auth, 'isLogined') ? auth : pureToken),
      roles: [{
        roleCode: _.get(device, '[0].content.basicInfo.roleCode'),
        roleName: '',
      }],
    };
  }

  if (_.isNil(pureToken)) {
    notification.error({
      message: '无设备信息',
      description: '请检查相关服务是否正常',
    });

    return;
  }

  const whiteBoardConfig = await getWhiteBoardConfig(wardCode);
  const wardInfo = await getWardInfo(wardCode);
  const shiftInfo = await getShiftInfo(wardCode);

  if (!resetTimerFlag) {
    app._store.dispatch({
      type: 'whiteboard/updateState',
      payload: {
        wardCode,
        whiteBoardConfig,
        currentWardInfo: _.get(wardInfo, 'queryResult[0]'),
        shiftInfo,
      },
    });
  }

  if (!_.get(auth, 'isLogined')) {
    app._store.dispatch({
      type: 'auth/doStuffAfterLogin',
      payload: fakeToken,
    });
  }

  const slot = Number(_.get(whiteBoardConfig, 'config.basicConfig.jumpToDefaultInterval'));

  const findPermission = _.find(currentPermissions, (item) => {
    return item.code == 'app-whiteboard';
  });

  if (findPermission) {
    const search = `?${_.chain(redirect).split('?').last().value()}`;
    initJumpToDefaultPage(slot, findPermission, search);
  }

  return wardCode;
}