const {
  vendor: {
    react: React,
    bizcharts: { Chart, Geom, Axis, Tooltip, Coord, Label, Legend, View, Guide, Shape },
    DataSet: { DataSet },
    moment,
  },
} = platform;

export default class BarChart extends React.Component {
  render() {
    const {
      valueFormat,
      subTitle,
      total,
      hasLegend = false,
      className,
      style,
      height,
      forceFit = true,
      percent = 0,
      color,
      inner = 0.75,
      animate = true,
      colors,
      lineWidth = 1,
      htmlFontSize,
    } = this.props;

    const data = this.props.data;
    const fields = this.props.fields;
    const ds = new DataSet();
    const dv = ds.createView().source(data);
    
    dv.transform({
      type: 'fold',
      fields: fields, // 展开字段集
      key: '日期', // key字段
      value: '人次', // value字段
    });

    const title = {
      textStyle: {
        fontSize: '14',
        textAlign: 'center',
        fill: '#333',
      }, // 坐标轴文本属性配置
      position: 'center', // 标题的位置，**新增**
    }

    const line = {
      stroke: '#ccc',
      fill: '#ffffff',
      lineWidth: 2,
    }

    const tickLine = {
      lineWidth: 1, // 刻度线宽
      stroke: '#ccc', // 刻度线的颜色
      length: 5, // 刻度线的长度, **原来的属性为 line**,可以通过将值设置为负数来改变其在轴上的方向
    }

    return (
      <div style={{ height: height }}>
        <Chart height={height} data={dv} forceFit padding={[40, 20, 60, 55]}>
          <Axis name="日期" title={title} />
          <Axis name="人次" title={title} line={line} tickLine={tickLine}/>
          <Tooltip />
          <Geom type='intervalStack' position="日期*人次" color={['name', colors]}/>
        </Chart>
      </div>
    );
  }
}
