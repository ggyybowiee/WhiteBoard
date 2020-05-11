const {
  vendor: {
    react: React,
    bizcharts: { Chart, Geom, Axis, Tooltip, Coord, Label, Legend, View, Guide, Shape },
    DataSet: { DataSet, DataView },
    moment,
  },
} = platform;

export default class PieChart extends React.Component {
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
    const dv = new DataView();

    dv.source(data).transform({
      type: 'percent',
      field: 'count',
      dimension: 'item',
      as: 'percent'
    });

    const cols = {
      percent: {
        formatter: val => {
          return `${parseInt(val * 100)}%`;
        }
      }
    }   

    return (
      <div style={{ height: height }}>
        <Chart height={height} data={dv} scale={cols} forceFit style={{ textAlign: 'center' }} padding={[40, 30, 40, 30]}>
          <Coord type={'theta'} radius={0.75} innerRadius={0.6} />
          <Axis name="percent" />
          <Legend position='bottom-center' marker='square' textStyle={{
            textAlign: 'middle', // 文本对齐方向，可取值为： start middle end
            fill: '#333', // 文本的颜色
            fontSize: '14', // 文本大小
            textBaseline: 'middle' // 文本基准线，可取 top middle bottom，默认为middle
          }} offsetY={5} />
          <Tooltip
            showTitle={false}
            marker='square'
            itemTpl='<li style="font-size: 14px;"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</li>'
          />
          <Geom
            type="intervalStack"
            position="percent"
            tooltip={['item*percent', (item, percent) => {
              percent = `${parseInt(percent * 100)}%`;
              return {
                name: item,
                value: percent
              };
            }]}
            color={['item', colors]}
            style={{ lineWidth: 1, stroke: '#fff' }}
          >
            <Label content='percent' formatter={(val, item) => {
              return `${item.point.item}:${val}`;
            }} textStyle={{
              fontSize: '14', // 文本大小
              fill: '#333', // 文本的颜色
            }} />
          </Geom>
        </Chart>
      </div>
    );
  }
}
