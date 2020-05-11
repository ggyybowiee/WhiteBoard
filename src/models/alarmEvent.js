const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
  },
} = platform;

export default {
  namespace: 'alarmEvent',
  state: {},
  effects: {

    *getTurn({ payload }, { call, put }) {
      yield call(getApi, '/smartWard/pbimsAlert/turnoverReset', payload);

      return true;
    },

    *getReceive({ payload }, { call, put }) {

      yield call(getApi, '/smartWard/warning/cancel', payload);

      return true;
    },

    *handleAlertLater({ payload: { id, queryParams } }, { call, put }) {
      const params = _.keys(queryParams).length === 0 ? '' : `?${qs.stringify(queryParams)}`;

      yield call(postApi, `/windranger/mews/alerts/${id}${params}`, queryParams);

      return true;
    },

    *handleAlert({ payload: { id, queryParams } }, { call, put }) {
      const suffix = id ? `/${id}` : '';
      const params = _.keys(queryParams).length === 0 ? '' : `?${qs.stringify(queryParams)}`;

      yield call(postApi, `/windranger/mews/alerts${suffix}${params}`, queryParams);

      return true;
    },

    *cancelAlarm({ payload: { id, queryParams } }, { call, put }) {
      const suffix = id ? `/${id}` : '';
      const params = _.keys(queryParams).length === 0 ? '' : `?${qs.stringify(queryParams)}`;

      yield call(postApi, `/smartWard/arsms/alert/cancel${suffix}${params}`, queryParams);

      return true;
    }

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