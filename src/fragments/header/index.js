import styles from './index.less';

const {
  vendor: {
    react: React,
    antd: { Menu, Dropdown, Icon },
  },
} = platform;

const FORM_TYPES = [{
  name: 'PCN变更单',
  key: '/pcnRecords/form',
}, {
  name: '供应商',
  key: '/proposer/form',
}, {
  key: '/stuff/form',
  name: '物料管理单',
}]

const onFormTypeClick = null;

const HeaderMenuFragment = () => {
  const formMenu = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onFormTypeClick}>
      {
        FORM_TYPES.map(({ name, key }) => (
          <Menu.Item key={key}>
            {name}
          </Menu.Item>
        ))
      }
    </Menu>
  );

  return (
    <div className={styles.createForm}>
      <Dropdown overlay={formMenu}>
        <a rel="noopener noreferrer">
          <Icon type="plus" />
          &nbsp;
          新建
        </a>
      </Dropdown>
    </div>
  );
};

export default HeaderMenuFragment;
