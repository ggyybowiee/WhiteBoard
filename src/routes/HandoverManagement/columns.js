export const handoverColumn = [ 
  {
    key: 'bedCode',
    title: '床号',
    dataIndex: 'bedCode',
    align: 'center',
    width: '5%',
    render: (text, record) => (
      <span>
        {text}
      </span>
    ),
  },
  {
    key: 'patName',
    title: '姓名',
    dataIndex: 'patName',
    align: 'center',
    width: '5%',
    render: (text, record) => (
      <span>
        {text}
      </span>
    ),
  },
  {
    key: 'diagnosis',
    title: '诊断',
    dataIndex: 'diagnosis',
    align: 'center',
    width: '20%',
    render: (text, record) => (
      <span>
        {text}
      </span>
    ),
  },
  {
    key: 'breif',
    title: '记录摘要',
    dataIndex: 'breif',
    align: 'center',
    render: (text, record) => (
      <span>
        {text}
      </span>
    ),
  },
];
