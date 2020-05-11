const {
  vendor: {
    Cookies,
    qs,
  },
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'whiteboard',
  state: {},
  effects: {
    
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },
};