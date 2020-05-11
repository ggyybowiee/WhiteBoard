import Earlysense from '../routes/Earlysense';
import Infusion from '../routes/Infusion';
import WardOverView from '../routes/WardOverView';
import SurgeryMonitor from '../routes/SurgeryMonitor';
import BedList from '../routes/BedList';
import NursingPlan from '../routes/NursingPlan';
import VitalSignEvent from '../routes/VitalSignEvent';
import HandoverManagement from '../routes/HandoverManagement';

export default {
  wardoverview: {
    name: '病区概览',
    component: WardOverView,
    exact: true
  },
  surgerymonitor: {
    name: '手术监控',
    component: SurgeryMonitor,
    exact: true
  },
  bedlist: {
    name: '床位列表',
    component: BedList,
    exact: true
  },
  nursingplan: {
    name: '护理计划',
    component: NursingPlan,
    exact: true
  },
  vitalsignevent: {
    name: '体征事件',
    component: VitalSignEvent,
    exact: true
  },
  infusion: {
    name: '输液监控',
    component: Infusion,
    exact: true
  },
  earlysense: {
    name: '卧床监控',
    component: Earlysense,
    exact: true
  },
  handovermanagement: {
    name: '交班管理',
    component: HandoverManagement,
    exact: true
  },
  otherwise: {
    name: '未知路由',
    component: null,
    exact: true
  }
};
