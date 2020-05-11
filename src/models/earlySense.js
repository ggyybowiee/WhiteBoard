import { NURSING_LEVEL, MOVE_LEVEL } from '../routes/Earlysense/const.js';

const {
  utils: {
    createSimpleRestModel: { default: createSimpleRestModel },
    request: { getApi, putApi, postApi },
    SessionStore,
  },
  vendor: {
    Cookies,
    qs,
  },
  app,
} = platform;

export default {
  namespace: 'earlySense',
  state: {},
  effects: {

    *getVitalList({ payload: { queryParams, bedList} }, { select, put, call }) {
      const response = yield call(getApi, `/smartWard/pbimsPatReadingRt/overview`, queryParams, null, true, false);
      let listCopy = [];
      const patientsCache = SessionStore.default.getItem('patients_cached');;
      const patients = {};

      for (let i = 0; i < _.get(response, 'queryResult.length'); i += 1) {
        const item = response.queryResult[i];
        const respInfo = _.get(patientsCache, item.inhosCode) || (_.find(bedList, bed => bed.inhosCode === item.inhosCode));
        const patient = _.get(respInfo, 'queryResult[0]') || respInfo || {};
        const requestParm = {
          mac: item.mac,
          insightReport: 0,
        };

        _.set(patients, patient.inhosCode, patient);

        const respDev = yield call(getApi, `/smartWard/pbimsInsightSetting`, requestParm, null, true, false);
        const turnDuration = _.get(respDev, 'queryResult[0].currentTurnDuration');
        const currentVoiceOn = _.get(respDev, 'queryResult[0].currentVoiceOn');
        listCopy.push({
          ...item,
          nurseLevelChinese: NURSING_LEVEL[item.nurseLevel],
          hr: item.hr === 0 || item.hr === -1 ? '--' : item.hr,
          rr: item.rr === 0 || item.rr === -1 ? '--' : item.rr,
          moveLevel: MOVE_LEVEL[item.movementLevel],
          patientName: patient.patName,
          bedCode: patient.bedCode,
          lastTurn: item.turnCountup >= turnDuration || item.turnCountup === 0 || item.turnCountup < 0 ? '--' : turnTime(new Date(), item.turnCountup, '-'),
          nextTurn: item.turnCountup >= turnDuration || item.turnCountup === 0 || item.turnCountup < 0 ? '--' : turnTime(new Date(), turnDuration - item.turnCountup, '+'),
          patientStatus: item.inBed === 0 ? '离床' : '在床',
          currentVoiceOn,
        })
      }

      const fiveMinutes = 1;

      if (_.keys(patients).length !== _.keys(patientsCache).length) {
        Cookies.set('patients_cached', patients, { expires: fiveMinutes });
        SessionStore.default.setItem('patients_cached', patients);
      }

      yield put({
        type: 'updateState',
        payload: {
          earlySenseCardlist: listCopy,
        },
      });
      return listCopy;
    },

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